import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Sparkles, Loader2, Wand2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { useTaskStore, type Task, type Priority, type TaskStatus } from '../store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'
import apiClient from '@/services/apiClient'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const addTask = useTaskStore((state) => state.addTask)
  const updateTask = useTaskStore((state) => state.updateTask)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const addToast = useToastStore((state) => state.addToast)

  // AI Command Input State
  const [aiCommand, setAiCommand] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo' as TaskStatus,
      priority: 'medium' as Priority,
      dueDate: '',
      labelsString: '',
      estimatedTime: 30,
    },
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (taskToEdit) {
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        status: taskToEdit.status,
        priority: taskToEdit.priority,
        dueDate: taskToEdit.dueDate,
        labelsString: taskToEdit.labels.join(', '),
        estimatedTime: taskToEdit.estimatedTime || 30,
      })
    } else {
      reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        labelsString: '',
        estimatedTime: 30,
      })
      setAiCommand('')
    }
  }, [taskToEdit, reset, isOpen])

  const handleAiActionSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!aiCommand.trim()) {
      addToast({
        type: 'warning',
        title: 'Empty Command',
        message: 'Please enter a natural language command (e.g., "Build UI tomorrow at 5pm").'
      })
      return
    }

    setIsAiLoading(true)
    try {
      const response = await apiClient.post('/action-engine/', { text: aiCommand })
      if (response.data.success) {
        if (response.data.requires_follow_up) {
          addToast({
            type: 'info',
            title: 'Task Parsed (Needs details)',
            message: response.data.response || 'Please provide more details.'
          })
          if (response.data.task_title) {
            setValue('title', response.data.task_title)
          }
        } else {
          addToast({
            type: 'success',
            title: 'Task Created via AI 🎉',
            message: response.data.response || 'Successfully created task.'
          })
          await fetchTasks()
          onClose()
        }
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Processing Failed',
        message: err.response?.data?.error || 'Could not parse input command.'
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    const formattedLabels = data.labelsString
      ? data.labelsString.split(',').map((l: string) => l.trim()).filter(Boolean)
      : []

    const taskPayload = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate || new Date().toISOString(),
      labels: formattedLabels,
      estimatedTime: Number(data.estimatedTime) || 30,
    }

    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskPayload)
        addToast({
          type: 'success',
          title: 'Task Updated',
          message: `Successfully saved changes to "${data.title}".`,
        })
      } else {
        await addTask(taskPayload)
        addToast({
          type: 'success',
          title: 'Task Created',
          message: `Successfully created new task "${data.title}".`,
        })
      }
      onClose()
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Task Operation Failed',
        message: err.message || 'Something went wrong.',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create Task'}
      description={taskToEdit ? 'Modify properties of your task.' : 'Add a new deadline to keep you on schedule.'}
    >
      <div className="space-y-4 pt-2">
        {/* AI Natural Language Generation Input Box */}
        {!taskToEdit && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 text-left">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 fill-primary/10 animate-pulse" />
              Nexora AI Action Engine
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                placeholder="e.g. Write backend test scripts tomorrow at 3pm, urgent"
                className="flex-grow h-10 px-3 py-2 text-xs rounded-xl border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                onClick={handleAiActionSubmit}
                disabled={isAiLoading}
                className="h-10 px-4 btn-bounce shrink-0"
                variant="primary"
                leftIcon={isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              >
                {isAiLoading ? 'Parsing...' : 'AI Create'}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground font-semibold leading-relaxed">
              Enter tasks in natural language. Our AI extracts deadlines, categories, and inserts them directly.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            label="Task Title"
            placeholder="e.g. Write test suites"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />

          <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              placeholder="Describe what needs to get done..."
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Due Date & Time"
              type="datetime-local"
              {...register('dueDate')}
            />

            <InputField
              label="Estimate (minutes)"
              type="number"
              {...register('estimatedTime')}
            />
          </div>

          <InputField
            label="Labels / Tags (comma separated)"
            placeholder="Design, Business, Engineering"
            {...register('labelsString')}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl btn-bounce">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl btn-bounce">
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateTaskModal
