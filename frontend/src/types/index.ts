export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  createdAt: string
  updatedAt: string
  userId: string
  aiAssisted?: boolean
  estimatedTime?: number // in minutes
  actualTime?: number // in minutes
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  bio?: string
  createdAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}
