import React, { useState } from 'react'
import { Plus, Sparkles, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import { InputField } from '@/components/form/InputField'
import { useToastStore } from '@/store/useToastStore'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'
import apiClient from '@/services/apiClient'

export const QuickActions: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)
  const { fetchTasks, addTask } = useTaskStore()

  // Modal Open state
  const [isOpen, setIsOpen] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await addTask({
        title,
        description,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority: urgency,
        status: 'todo',
        labels: [],
      })
      addToast({
        type: 'success',
        title: 'Task Created',
        message: `Successfully created task: "${title}".`,
      })
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setDueDate('')
      setUrgency('medium')
      fetchTasks()
    } catch (err: any) {
      console.error('Failed to create task:', err)
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'Could not create task. Please try again.',
      })
    }
  }

  const handleOptimizeWorkload = async () => {
    const activeTasks = useTaskStore.getState().tasks
    if (activeTasks.length === 0) {
      addToast({
        type: 'info',
        title: 'No Active Tasks',
        message: 'You currently have no tasks to optimize.',
      })
      return
    }

    setIsOptimizing(true)
    try {
      const taskTitles = activeTasks.map((t) => t.title)
      const response = await apiClient.post('/assistant/optimize/', { tasks: taskTitles })
      addToast({
        type: 'success',
        title: 'AI Workload Optimized',
        message: response.data.response || 'Your schedule has been optimized successfully.',
      })
    } catch (err: any) {
      console.error('Optimization failed:', err)
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Could not connect to AI Schedule Optimizer.',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOptimizeWorkload}
        disabled={isOptimizing}
        className="h-9 px-3 gap-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
        leftIcon={isOptimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 fill-current" />}
      >
        Optimize Workload
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9 px-3 gap-1.5"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
      >
        New Task
      </Button>

      {/* Task Creation Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Task" description="Add details to prioritize and track your task.">
        <form onSubmit={handleCreateTask} className="space-y-4 pt-2 text-left">
          <InputField
            label="Task Title"
            placeholder="e.g. Design landing page layouts"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              placeholder="Provide a description of the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background/50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background/50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low Urgency</option>
                <option value="medium">Medium Urgency</option>
                <option value="high">High Urgency</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default QuickActions

