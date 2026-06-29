import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { useTaskStore, type Task, type Priority, type TaskStatus } from '../store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const addTask = useTaskStore((state) => state.addTask)
  const updateTask = useTaskStore((state) => state.updateTask)
  const addToast = useToastStore((state) => state.addToast)

  const {
    register,
    handleSubmit,
    reset,
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
    }
  }, [taskToEdit, reset, isOpen])

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <InputField
          label="Task Title"
          placeholder="e.g. Write test suites"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <textarea
            placeholder="Describe what needs to get done..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('status')}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateTaskModal
