import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export interface Milestone {
  id: string
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  description?: string
  targetDate: string
  progress: number
  isCompleted: boolean
  milestones: Milestone[]
}

export interface Habit {
  id: string
  name: string
  description?: string
  frequency: string
  streak: number
  maxStreak: number
  completionRate: number
  completedToday: boolean
}

interface GoalHabitStore {
  goals: Goal[]
  habits: Habit[]
  heatmapData: Record<string, number>
  analyticsData: any
  isLoading: boolean
  fetchGoals: () => Promise<void>
  fetchHabits: () => Promise<void>
  fetchHeatmap: () => Promise<void>
  fetchAnalytics: () => Promise<void>
  addGoal: (goal: Omit<Goal, 'id' | 'progress'>) => Promise<void>
  toggleMilestone: (goalId: string, milestoneId: string, isCompleted: boolean) => Promise<void>
  addHabit: (habit: { name: string; description: string; frequency: string }) => Promise<void>
  checkInHabit: (habitId: string, date: string, isCompleted: boolean) => Promise<void>
}

export const useGoalHabitStore = create<GoalHabitStore>((set, get) => ({
  goals: [],
  habits: [],
  heatmapData: {},
  analyticsData: null,
  isLoading: false,

  fetchGoals: async () => {
    try {
      const response = await apiClient.get('/goals/')
      const goals = response.data.map((g: any) => ({
        id: String(g.id),
        title: g.title,
        description: g.description,
        targetDate: g.target_date,
        progress: g.progress,
        isCompleted: g.is_completed,
        milestones: (g.milestones || []).map((m: any) => ({
          id: String(m.id),
          title: m.title,
          completed: m.is_completed,
        })),
      }))
      set({ goals })
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    }
  },

  fetchHabits: async () => {
    try {
      const response = await apiClient.get('/habits/')
      const habits = response.data.map((h: any) => {
        const todayStr = new Date().toISOString().split('T')[0]
        const completedToday = (h.logs || []).some(
          (log: any) => log.date === todayStr && log.is_completed
        )
        return {
          id: String(h.id),
          name: h.name,
          description: h.description,
          frequency: h.frequency,
          streak: h.streak,
          maxStreak: h.max_streak,
          completionRate: h.completion_rate,
          completedToday,
        }
      })
      set({ habits })
    } catch (err) {
      console.error('Failed to fetch habits:', err)
    }
  },

  fetchHeatmap: async () => {
    try {
      const response = await apiClient.get('/habits/heatmap/')
      set({ heatmapData: response.data })
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err)
    }
  },

  fetchAnalytics: async () => {
    try {
      const response = await apiClient.get('/habits/analytics/')
      set({ analyticsData: response.data })
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
  },

  addGoal: async (goal) => {
    try {
      const payload = {
        title: goal.title,
        description: goal.description,
        target_date: goal.targetDate,
        is_completed: goal.isCompleted,
        milestones: goal.milestones.map((m) => ({
          title: m.title,
          is_completed: m.completed,
        })),
      }
      await apiClient.post('/goals/', payload)
      await get().fetchGoals()
    } catch (err) {
      console.error('Failed to add goal:', err)
      throw err
    }
  },

  toggleMilestone: async (goalId, milestoneId, isCompleted) => {
    try {
      const goal = get().goals.find((g) => g.id === goalId)
      if (!goal) return

      const updatedMilestones = goal.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: isCompleted } : m
      )

      const payload = {
        title: goal.title,
        description: goal.description,
        target_date: goal.targetDate,
        is_completed: goal.isCompleted,
        milestones: updatedMilestones.map((m) => ({
          title: m.title,
          is_completed: m.completed,
        })),
      }

      await apiClient.patch(`/goals/${goalId}/`, payload)
      await get().fetchGoals()
    } catch (err) {
      console.error('Failed to update milestone:', err)
    }
  },

  addHabit: async (habit) => {
    try {
      await apiClient.post('/habits/', habit)
      await get().fetchHabits()
    } catch (err) {
      console.error('Failed to add habit:', err)
      throw err
    }
  },

  checkInHabit: async (habitId, date, isCompleted) => {
    try {
      await apiClient.post(`/habits/${habitId}/check_in/`, {
        date,
        is_completed: isCompleted,
      })
      await get().fetchHabits()
      await get().fetchHeatmap()
      await get().fetchAnalytics()
    } catch (err) {
      console.error('Failed to check in habit:', err)
    }
  },
}))
