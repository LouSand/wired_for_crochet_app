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
