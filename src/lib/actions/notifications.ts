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
