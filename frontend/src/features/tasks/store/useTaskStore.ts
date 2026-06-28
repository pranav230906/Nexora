import { create } from 'zustand'

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
  addTask: (task: Omit<Task, 'id' | 'progress' | 'subtasks' | 'comments' | 'attachments'>) => void
  updateTask: (id: string, updatedFields: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addSubtask: (taskId: string, title: string) => void
  addComment: (taskId: string, text: string) => void
  addAttachment: (taskId: string, name: string, size: string) => void
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Complete pitch deck draft',
    description: 'Structure slides, optimize content, and send to advisors.',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-06-29',
    labels: ['Business', 'Marketing'],
    estimatedTime: 120,
    progress: 0,
    subtasks: [
      { id: 's1', title: 'Write outline', completed: true },
      { id: 's2', title: 'Design slides template', completed: false },
      { id: 's3', title: 'Gather financial data', completed: false },
    ],
    comments: [
      { id: 'c1', text: 'Please double check slide 4 calculations.', createdAt: '2026-06-27T14:30:00Z', user: 'Admin User' },
    ],
    attachments: [
      { id: 'a1', name: 'financials_q2.xlsx', size: '1.2 MB', url: '#' },
    ],
  },
  {
    id: '2',
    title: 'Optimize database indexes',
    description: 'Identify slow query logs and add appropriate indices to user tables.',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: '2026-06-28',
    labels: ['Engineering', 'Database'],
    estimatedTime: 90,
    progress: 40,
    subtasks: [
      { id: 's4', title: 'Analyze query logs', completed: true },
      { id: 's5', title: 'Add indexes to transaction table', completed: false },
    ],
    comments: [],
    attachments: [],
  },
  {
    id: '3',
    title: 'Review design guidelines',
    description: 'Ensure spacing, typography, and dark mode standards are followed in layouts.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-06-26',
    labels: ['Design', 'SaaS'],
    estimatedTime: 45,
    progress: 100,
    subtasks: [],
    comments: [],
    attachments: [],
  },
]

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: initialTasks,
  searchQuery: '',
  filterStatus: 'all',
  filterPriority: 'all',
  sortBy: 'dueDate',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setSortBy: (sortBy) => set({ sortBy }),

  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          id: Math.random().toString(36).substring(2, 9),
          progress: 0,
          subtasks: [],
          comments: [],
          attachments: [],
        },
      ],
    })),

  updateTask: (id, updatedFields) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === id) {
          const nextTask = { ...task, ...updatedFields }
          // Recalculate progress if subtasks change
          if (updatedFields.subtasks) {
            const completedCount = nextTask.subtasks.filter((s) => s.completed).length
            nextTask.progress =
              nextTask.subtasks.length > 0
                ? Math.round((completedCount / nextTask.subtasks.length) * 100)
                : nextTask.status === 'completed'
                ? 100
                : nextTask.progress
          }
          return nextTask
        }
        return task
      }),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s,
          )
          const completedCount = updatedSubtasks.filter((s) => s.completed).length
          const progress = Math.round((completedCount / updatedSubtasks.length) * 100)
          return {
            ...task,
            subtasks: updatedSubtasks,
            progress,
            status: progress === 100 ? 'completed' : task.status,
          }
        }
        return task
      }),
    })),

  addSubtask: (taskId, title) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          const newSubtask = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            completed: false,
          }
          const updatedSubtasks = [...task.subtasks, newSubtask]
          const completedCount = updatedSubtasks.filter((s) => s.completed).length
          const progress = Math.round((completedCount / updatedSubtasks.length) * 100)
          return {
            ...task,
            subtasks: updatedSubtasks,
            progress,
          }
        }
        return task
      }),
    })),

  addComment: (taskId, text) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          const newComment = {
            id: Math.random().toString(36).substring(2, 9),
            text,
            createdAt: new Date().toISOString(),
            user: 'Admin User',
          }
          return {
            ...task,
            comments: [...task.comments, newComment],
          }
        }
        return task
      }),
    })),

  addAttachment: (taskId, name, size) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          const newAttachment = {
            id: Math.random().toString(36).substring(2, 9),
            name,
            size,
            url: '#',
          }
          return {
            ...task,
            attachments: [...task.attachments, newAttachment],
          }
        }
        return task
      }),
    })),
}))
export default useTaskStore
