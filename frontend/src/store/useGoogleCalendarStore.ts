import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  htmlLink?: string
}

interface GoogleCalendarStore {
  isConnected: boolean
  isSyncing: boolean
  meetings: Meeting[]
  fetchConnectionStatus: () => Promise<void>
  fetchMeetings: () => Promise<void>
  syncTasks: () => Promise<void>
  exchangeAuthCode: (code: string, redirectUri?: string) => Promise<void>
  disconnectCalendar: () => Promise<void>
}

export const useGoogleCalendarStore = create<GoogleCalendarStore>((set, get) => ({
  isConnected: false,
  isSyncing: false,
  meetings: [],

  fetchConnectionStatus: async () => {
    try {
      const response = await apiClient.get('/calendar/status/')
      set({ isConnected: response.data.connected })
    } catch (err) {
      console.error('Failed to fetch calendar status:', err)
    }
  },

  fetchMeetings: async () => {
    try {
      const response = await apiClient.get('/calendar/meetings/')
      set({
        isConnected: response.data.connected,
        meetings: response.data.meetings || [],
      })
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    }
  },

  syncTasks: async () => {
    set({ isSyncing: true })
    try {
      await apiClient.post('/calendar/sync/')
    } catch (err) {
      console.error('Failed to sync tasks:', err)
    } finally {
      set({ isSyncing: false })
    }
  },

  exchangeAuthCode: async (code, redirectUri) => {
    try {
      const payload: any = { code }
      if (redirectUri) payload.redirect_uri = redirectUri
      
      const response = await apiClient.post('/calendar/oauth/', payload)
      set({ isConnected: response.data.connected })
      await get().fetchMeetings()
    } catch (err) {
      console.error('Failed to exchange auth code:', err)
      throw err
    }
  },

  disconnectCalendar: async () => {
    // Simple reset on client, or delete credentials endpoint if desired.
    // Since our backend doesn't explicitly have a disconnect endpoint, we can just reset connection locally,
    // or let it check backend status.
    set({ isConnected: false, meetings: [] })
  },
}))
