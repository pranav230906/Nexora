import { create } from 'zustand'
import apiClient from '@/services/apiClient'

interface Message {
  sender: 'ai' | 'user'
  text: string
}

interface AiPlannerStore {
  dailyPlan: string
  weeklyPlan: string
  coachReply: string
  chatHistory: Message[]
  isPlanning: boolean
  isCoaching: boolean
  generateDailyPlan: (tasks: string[], goals: string[]) => Promise<void>
  sendMessageToCoach: (messageText: string, habits: string[], streaks: string) => Promise<void>
  optimizeTaskPriority: (tasks: string[]) => Promise<string>
  clearChat: () => void
}

export const useAiPlannerStore = create<AiPlannerStore>((set, get) => ({
  dailyPlan: '',
  weeklyPlan: '',
  coachReply: '',
  chatHistory: [
    {
      sender: 'ai',
      text: "Hello! I am your AI Productivity Coach. Ask me anything about your schedule, time blocking, habits, or streaks!",
    },
  ],
  isPlanning: false,
  isCoaching: false,

  generateDailyPlan: async (tasks, goals) => {
    set({ isPlanning: true })
    try {
      const response = await apiClient.post(
        '/ai/planner/',
        { tasks, goals },
        { timeout: 45000 } // Allow up to 45 seconds for LLM generation
      )
      set({ dailyPlan: response.data.response })
    } catch (err) {
      console.error('Failed to generate daily plan:', err)
      set({ dailyPlan: 'Could not generate daily plan. Fallback: focus on task priority checklist.' })
    } finally {
      set({ isPlanning: false })
    }
  },

  sendMessageToCoach: async (messageText, habits, streaks) => {
    // 1. Add user message
    set((state) => ({
      chatHistory: [...state.chatHistory, { sender: 'user', text: messageText }],
      isCoaching: true,
    }))

    try {
      // 2. Call productivity coach
      const response = await apiClient.post(
        '/ai/coach/',
        {
          habits,
          streaks,
          user_message: messageText,
        },
        { timeout: 45000 } // Allow up to 45 seconds for LLM generation
      )

      set((state) => ({
        chatHistory: [...state.chatHistory, { sender: 'ai', text: response.data.response }],
      }))
    } catch (err) {
      console.error('Failed to chat with coach:', err)
      set((state) => ({
        chatHistory: [
          ...state.chatHistory,
          { sender: 'ai', text: 'Sorry, I am having trouble connecting right now. Try focusing on the Pomodoro technique!' },
        ],
      }))
    } finally {
      set({ isCoaching: false })
    }
  },

  optimizeTaskPriority: async (tasks) => {
    try {
      const response = await apiClient.post(
        '/ai/priority/',
        { tasks },
        { timeout: 45000 }
      )
      return response.data.response
    } catch (err) {
      console.error('Failed to optimize priorities:', err)
      return 'Could not calculate optimized priorities.'
    }
  },

  clearChat: () => {
    set({
      chatHistory: [
        {
          sender: 'ai',
          text: "Hello! I am your AI Productivity Coach. Ask me anything about your schedule, time blocking, habits, or streaks!",
        },
      ],
    })
  },
}))
export default useAiPlannerStore
