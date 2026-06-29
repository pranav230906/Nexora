import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export interface Notification {
  id: number
  title: string
  message: string
  channel: 'EMAIL' | 'PUSH' | 'IN_APP'
  status: 'PENDING' | 'SENT' | 'FAILED'
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  deadline_alerts_enabled: boolean
  habits_reminder_enabled: boolean
}

interface NotificationStore {
  notifications: Notification[]
  preferences: NotificationPreferences | null
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  fetchPreferences: () => Promise<void>
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (notif: Notification) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  preferences: null,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/notifications/logs/')
      set({ notifications: response.data })
    } catch (err) {
      console.error('Failed to fetch notifications logs:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchPreferences: async () => {
    try {
      const response = await apiClient.get('/notifications/preferences/')
      set({ preferences: response.data })
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err)
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const response = await apiClient.put('/notifications/preferences/', prefs)
      set({ preferences: response.data })
    } catch (err) {
      console.error('Failed to update notification preferences:', err)
    }
  },

  markRead: async (id) => {
    try {
      await apiClient.post(`/notifications/logs/${id}/mark_read/`)
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  },

  markAllRead: async () => {
    try {
      await apiClient.post('/notifications/logs/mark_all_read/')
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }))
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  },

  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
    }))
  },
}))
export default useNotificationStore
