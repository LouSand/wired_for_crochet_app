'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export async function getNotifications(): Promise<{ data: Notification[]; unreadCount: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], unreadCount: 0, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: [], unreadCount: 0, error: 'Failed to fetch notifications.' }

  const notifications = (data ?? []) as Notification[]
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { data: notifications, unreadCount, error: null }
}

export async function markAsRead(notificationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/')
  return { error: null }
}

export async function markAllAsRead(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/')
  return { error: null }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('user_notifications').insert({
    user_id: userId,
    type,
    title,
    message: message ?? null,
    link: link ?? null,
  })
}

export async function checkTimerReminders(): Promise<{ checked: number; created: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { checked: 0, created: 0 }

  // Find time_sessions with null end_time older than 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const { data: runningSessions, error } = await supabase
    .from('time_sessions')
    .select('id, project_id, start_time')
    .eq('user_id', user.id)
    .is('end_time', null)
    .lt('start_time', twoHoursAgo)

  if (error || !runningSessions) return { checked: 0, created: 0 }

  let created = 0
  for (const session of runningSessions) {
    // Check if we already sent a reminder for this session
    const { data: existing } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'timer_reminder')
      .eq('link', `/projects/${session.project_id}`)
      .gte('created_at', twoHoursAgo)
      .limit(1)

    if (!existing || existing.length === 0) {
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        type: 'timer_reminder',
        title: 'Timer still running',
        message: `You have a timer running for over 2 hours. Did you forget to stop it?`,
        link: `/projects/${session.project_id}`,
      })
      created++
    }
  }

  return { checked: runningSessions.length, created }
}

/**
 * Feature 8: Price drop notifications (placeholder)
 * Checks if any favourited patterns have reduced their price.
 * TODO: Implement actual price tracking - store historical prices and compare.
 * TODO: Schedule this to run periodically (e.g. daily cron job).
 */
export async function checkPriceDrops(): Promise<{ checked: number; notified: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { checked: 0, notified: 0 }

  // TODO: Implement price drop detection
  // 1. Fetch user's favourited patterns with current prices
  // 2. Compare against stored historical prices (needs a price_history table)
  // 3. Create notifications for any price drops
  // 4. Update stored prices

  return { checked: 0, notified: 0 }
}

/**
 * Feature 10: Pattern update notification
 * Creates notifications for all buyers of a pattern when it is updated.
 */
export async function notifyPatternUpdate(
  patternId: string,
  message: string
): Promise<{ notified: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notified: 0, error: 'Not authenticated' }

  // Verify the caller owns this pattern
  const { data: pattern } = await supabase
    .from('patterns')
    .select('id, title, user_id')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (!pattern) return { notified: 0, error: 'Pattern not found or not owned by you.' }

  // Fetch all buyers of this pattern
  const { data: purchases } = await supabase
    .from('pattern_purchases')
    .select('buyer_id')
    .eq('pattern_id', patternId)

  if (!purchases || purchases.length === 0) return { notified: 0, error: null }

  // Create a notification for each buyer
  const notifications = purchases.map((p) => ({
    user_id: p.buyer_id,
    type: 'pattern_update',
    title: `Pattern updated: ${pattern.title}`,
    message,
    link: `/patterns/${patternId}`,
  }))

  const { error } = await supabase.from('user_notifications').insert(notifications)
  if (error) return { notified: 0, error: 'Failed to create notifications.' }

  return { notified: notifications.length, error: null }
}

/**
 * Feature 11: Weekly progress summary
 * Counts projects worked on, time tracked, and counters incremented in the last 7 days.
 * Creates a notification with the summary.
 */
export async function generateWeeklyProgressSummary(
  userId: string
): Promise<{ summary: string | null; error: string | null }> {
  const supabase = await createClient()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Count projects worked on (time sessions in last 7 days)
  const { data: recentSessions } = await supabase
    .from('time_sessions')
    .select('project_id, start_time, end_time')
    .eq('user_id', userId)
    .gte('start_time', oneWeekAgo)

  const uniqueProjects = new Set((recentSessions ?? []).map((s) => s.project_id))
  const projectsWorkedOn = uniqueProjects.size

  // Calculate total time tracked
  const totalSeconds = (recentSessions ?? []).reduce((sum, s) => {
    if (!s.end_time) return sum
    return sum + Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000)
  }, 0)

  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)

  // Count counters incremented (updated in last 7 days)
  const { count: countersIncremented } = await supabase
    .from('counters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('updated_at', oneWeekAgo)
    .gt('current_value', 0)

  const summaryParts: string[] = []
  if (projectsWorkedOn > 0) summaryParts.push(`${projectsWorkedOn} project${projectsWorkedOn !== 1 ? 's' : ''} worked on`)
  if (totalSeconds > 0) summaryParts.push(`${hours}h ${mins}m tracked`)
  if (countersIncremented && countersIncremented > 0) summaryParts.push(`${countersIncremented} counter${countersIncremented !== 1 ? 's' : ''} updated`)

  if (summaryParts.length === 0) {
    return { summary: null, error: null }
  }

  const summaryMessage = `This week: ${summaryParts.join(', ')}.`

  // Create the notification
  await supabase.from('user_notifications').insert({
    user_id: userId,
    type: 'weekly_summary',
    title: '📊 Weekly Progress Summary',
    message: summaryMessage,
    link: '/projects',
  })

  return { summary: summaryMessage, error: null }
}

/**
 * Feature 13: Email digest
 * Compiles unread notifications and sends via the existing email edge function.
 * TODO: Schedule this to run weekly (e.g. every Monday morning via cron).
 */
export async function sendWeeklyEmailDigest(
  userId: string
): Promise<{ sent: boolean; error: string | null }> {
  const supabase = await createClient()

  // Fetch unread notifications for the user
  const { data: unread } = await supabase
    .from('user_notifications')
    .select('title, message, created_at')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!unread || unread.length === 0) {
    return { sent: false, error: null }
  }

  // Get user email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user?.email) {
    return { sent: false, error: 'User email not found.' }
  }

  // Compile digest body
  const digestItems = unread.map((n) => {
    const date = new Date(n.created_at).toLocaleDateString('en-GB')
    return `• ${n.title}${n.message ? ` - ${n.message}` : ''} (${date})`
  }).join('\n')

  const body = `Hi! Here's your weekly digest from Wired for Crochet:\n\n${digestItems}\n\nYou have ${unread.length} unread notification${unread.length !== 1 ? 's' : ''}. Log in to see more details.`

  // Send via the existing edge function
  const { error: fnError } = await supabase.functions.invoke('send-email', {
    body: {
      to: user.email,
      subject: 'Your Weekly Wired for Crochet Digest',
      body,
      document_type: 'digest',
      document_id: userId,
    },
  })

  if (fnError) {
    return { sent: false, error: 'Failed to send email digest.' }
  }

  // TODO: Schedule this function to run weekly via a cron job or Supabase scheduled function

  return { sent: true, error: null }
}
