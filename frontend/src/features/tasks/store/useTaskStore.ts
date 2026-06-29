import { create } from 'zustand'
import apiClient from '@/services/apiClient'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface TaskComment {
  id: string
  text: string
  createdAt: string
  user: string
}

export interface TaskAttachment {
  id: string
  name: string
  size: string
  url: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  labels: string[]
  estimatedTime?: number // in minutes
  progress: number // percentage
  subtasks: Subtask[]
  comments: TaskComment[]
  attachments: TaskAttachment[]
}

interface TaskStore {
  tasks: Task[]
  searchQuery: string
  filterStatus: string
  filterPriority: string
  sortBy: string
  setSearchQuery: (query: string) => void
  setFilterStatus: (status: string) => void
  setFilterPriority: (priority: string) => void
  setSortBy: (sort: string) => void
  fetchTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'progress' | 'subtasks' | 'comments' | 'attachments'>) => Promise<void>
  updateTask: (id: string, updatedFields: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  addSubtask: (taskId: string, title: string) => Promise<void>
  addComment: (taskId: string, text: string) => Promise<void>
  addAttachment: (taskId: string, file: File) => Promise<void>
}

// Mapper helpers
const mapPriorityToFrontend = (val: string): Priority => {
  const map: Record<string, Priority> = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent' }
  return map[val] || 'medium'
}
const mapPriorityToBackend = (val: Priority): string => {
  const map: Record<Priority, string> = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH', urgent: 'URGENT' }
  return map[val] || 'MEDIUM'
}

const mapStatusToFrontend = (val: string): TaskStatus => {
  const map: Record<string, TaskStatus> = { TODO: 'todo', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' }
  return map[val] || 'todo'
}
const mapStatusToBackend = (val: TaskStatus): string => {
  const map: Record<TaskStatus, string> = { todo: 'TODO', in_progress: 'IN_PROGRESS', completed: 'COMPLETED' }
  return map[val] || 'TODO'
}

const mapTaskToFrontend = (backendTask: any): Task => {
  return {
    id: String(backendTask.id),
    title: backendTask.title,
    description: backendTask.description || '',
    status: mapStatusToFrontend(backendTask.status),
    priority: mapPriorityToFrontend(backendTask.priority),
    dueDate: backendTask.due_date ? backendTask.due_date.split('T')[0] : '',
    labels: (backendTask.tags || []).map((t: any) => t.name),
    estimatedTime: backendTask.estimated_time || 0,
    progress: backendTask.progress || 0,
    subtasks: (backendTask.checklist_items || []).map((item: any) => ({
      id: String(item.id),
      title: item.title,
      completed: item.is_completed,
    })),
    comments: (backendTask.comments || []).map((c: any) => ({
      id: String(c.id),
      text: c.content,
      createdAt: c.created_at,
      user: c.user_email,
    })),
    attachments: (backendTask.attachments || []).map((a: any) => ({
      id: String(a.id),
      name: a.file ? a.file.split('/').pop() || 'Attachment' : 'Attachment',
      size: 'Size N/A',
      url: a.file,
    })),
  }
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  searchQuery: '',
  filterStatus: 'all',
  filterPriority: 'all',
  sortBy: 'dueDate',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setSortBy: (sortBy) => set({ sortBy }),

  fetchTasks: async () => {
    try {
      const response = await apiClient.get('/tasks/')
      const tasks = response.data.map(mapTaskToFrontend)
      set({ tasks })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  },

  addTask: async (task) => {
    try {
      // 1. Resolve Labels to Tag objects
      const tagResponse = await apiClient.get('/tags/')
      const existingTags = tagResponse.data
      const tagIds: number[] = []

      for (const label of task.labels) {
        let tag = existingTags.find((t: any) => t.name.toLowerCase() === label.toLowerCase())
        if (!tag) {
          const createResponse = await apiClient.post('/tags/', { name: label, color: '#3B82F6' })
          tag = createResponse.data
        }
        tagIds.push(tag.id)
      }

      // 2. Post Task
      const payload = {
        title: task.title,
        description: task.description,
        status: mapStatusToBackend(task.status),
        priority: mapPriorityToBackend(task.priority),
        due_date: task.dueDate 
          ? (task.dueDate.includes('T') ? `${task.dueDate}:00Z` : `${task.dueDate}T12:00:00Z`)
          : null,
        estimated_time: task.estimatedTime || 0,
        tag_ids: tagIds,
        checklist_items: []
      }

      const response = await apiClient.post('/tasks/', payload)
      const newTask = mapTaskToFrontend(response.data)
      set((state) => ({ tasks: [...state.tasks, newTask] }))
    } catch (error) {
      console.error('Failed to add task:', error)
      throw error
    }
  },

  updateTask: async (id, updatedFields) => {
    try {
      const existingTask = get().tasks.find((t) => t.id === id)
      if (!existingTask) return

      const payload: any = {}
      if (updatedFields.title !== undefined) payload.title = updatedFields.title
      if (updatedFields.description !== undefined) payload.description = updatedFields.description
      if (updatedFields.status !== undefined) payload.status = mapStatusToBackend(updatedFields.status)
      if (updatedFields.priority !== undefined) payload.priority = mapPriorityToBackend(updatedFields.priority)
      if (updatedFields.dueDate !== undefined) {
        payload.due_date = updatedFields.dueDate
          ? (updatedFields.dueDate.includes('T') ? `${updatedFields.dueDate}:00Z` : `${updatedFields.dueDate}T12:00:00Z`)
          : null
      }
      if (updatedFields.estimatedTime !== undefined) payload.estimated_time = updatedFields.estimatedTime
      if (updatedFields.subtasks !== undefined) {
        payload.checklist_items = updatedFields.subtasks.map((s) => ({
          title: s.title,
          is_completed: s.completed,
        }))
      }

      const response = await apiClient.patch(`/tasks/${id}/`, payload)
      const updatedTask = mapTaskToFrontend(response.data)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }))
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    }
  },

  deleteTask: async (id) => {
    try {
      await apiClient.delete(`/tasks/${id}/`)
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const task = get().tasks.find((t) => t.id === taskId)
      if (!task) return

      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )

      await get().updateTask(taskId, { subtasks: updatedSubtasks })
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  },

  addSubtask: async (taskId, title) => {
    try {
      const task = get().tasks.find((t) => t.id === taskId)
      if (!task) return

      const updatedSubtasks = [...task.subtasks, { id: '', title, completed: false }]
      await get().updateTask(taskId, { subtasks: updatedSubtasks })
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  },

  addComment: async (taskId, text) => {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/add_comment/`, { content: text })
      const newComment = {
        id: String(response.data.id),
        text: response.data.content,
        createdAt: response.data.created_at,
        user: response.data.user_email,
      }

      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, comments: [...t.comments, newComment] }
          }
          return t
        }),
      }))
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  },

  addAttachment: async (taskId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post(`/tasks/${taskId}/add_attachment/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newAttachment = {
        id: String(response.data.id),
        name: response.data.file.split('/').pop() || 'Attachment',
        size: 'Size N/A',
        url: response.data.file,
      }

      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, attachments: [...t.attachments, newAttachment] }
          }
          return t
        }),
      }))
    } catch (error) {
      console.error('Failed to add attachment:', error)
    }
  },
}))

export default useTaskStore
