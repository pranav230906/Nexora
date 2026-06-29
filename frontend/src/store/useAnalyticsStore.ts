import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export interface TimeDistributionItem {
  label: string
  value: number
}

export interface AnalyticsDashboard {
  productivity_score: number
  task_completion_rate: number
  habit_consistency: number
  goal_success_rate: number
  focus_hours: number
  time_distribution: TimeDistributionItem[]
}

export interface ProductivityReport {
  id: number
  report_type: 'WEEKLY' | 'MONTHLY'
  start_date: string
  end_date: string
  productivity_score: number
  tasks_completed: number
  tasks_created: number
  habit_consistency: number
  focus_hours: number
  ai_insights: string
  created_at: string
}

interface AnalyticsStore {
  dashboard: AnalyticsDashboard | null
  reports: ProductivityReport[]
  isLoading: boolean
  isTriggering: boolean
  fetchDashboard: () => Promise<void>
  fetchReports: () => Promise<void>
  triggerReport: (reportType: 'WEEKLY' | 'MONTHLY', startDate: string, endDate: string) => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dashboard: null,
  reports: [],
  isLoading: false,
  isTriggering: false,

  fetchDashboard: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/analytics/dashboard/')
      set({ dashboard: response.data })
    } catch (err) {
      console.error('Failed to fetch analytics dashboard:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchReports: async () => {
    try {
      const response = await apiClient.get('/analytics/reports/')
      set({ reports: response.data })
    } catch (err) {
      console.error('Failed to fetch productivity reports:', err)
    }
  },

  triggerReport: async (reportType, startDate, endDate) => {
    set({ isTriggering: true })
    try {
      await apiClient.post('/analytics/trigger/', {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      })
    } catch (err) {
      console.error('Failed to trigger report generation:', err)
      throw err
    } finally {
      set({ isTriggering: false })
    }
  },
}))
export default useAnalyticsStore
