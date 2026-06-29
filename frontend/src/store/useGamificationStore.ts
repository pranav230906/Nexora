import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export interface GamificationProfile {
  xp: number
  coins: number
  level: number
  streak_days: number
  last_active_date: string | null
}

export interface Achievement {
  id: number
  title: string
  description: string
  icon_name: string
  xp_reward: number
  coins_reward: number
  criteria_type: string
  target_value: number
  is_unlocked: boolean
  unlocked_at: string | null
}

export interface Challenge {
  id: number
  title: string
  description: string
  type: 'DAILY' | 'WEEKLY'
  criteria_type: string
  target_value: number
  xp_reward: number
  coins_reward: number
  end_date: string
  current_value: number
  is_completed: boolean
  completed_at: string | null
}

export interface LeaderboardUser {
  rank: number
  email: string
  username: string
  xp: number
  level: number
  streak_days: number
}

interface GamificationStore {
  profile: GamificationProfile | null
  achievements: Achievement[]
  challenges: Challenge[]
  leaderboard: LeaderboardUser[]
  isLoading: boolean
  fetchProfile: () => Promise<void>
  fetchAchievements: () => Promise<void>
  fetchChallenges: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  profile: null,
  achievements: [],
  challenges: [],
  leaderboard: [],
  isLoading: false,

  fetchProfile: async () => {
    try {
      const response = await apiClient.get('/gamification/profile/')
      set({ profile: response.data })
    } catch (err) {
      console.error('Failed to fetch gamification profile:', err)
    }
  },

  fetchAchievements: async () => {
    try {
      const response = await apiClient.get('/gamification/achievements/')
      set({ achievements: response.data })
    } catch (err) {
      console.error('Failed to fetch achievements:', err)
    }
  },

  fetchChallenges: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/gamification/challenges/')
      set({ challenges: response.data })
    } catch (err) {
      console.error('Failed to fetch challenges:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchLeaderboard: async () => {
    try {
      const response = await apiClient.get('/gamification/leaderboard/')
      set({ leaderboard: response.data })
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  },
}))
export default useGamificationStore
