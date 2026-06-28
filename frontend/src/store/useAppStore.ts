import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ user: null, isAuthenticated: false })
  },
}))
