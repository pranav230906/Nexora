import React from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from './Button'
import { useToastStore } from '@/store/useToastStore'

export const QuickActions: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const handleCreateTask = () => {
    addToast({
      type: 'success',
      title: 'Action Triggered',
      message: 'New Task creation form overlay opened (Stub).',
    })
  }

  const handleOptimizeWorkload = () => {
    addToast({
      type: 'info',
      title: 'AI Optimizer',
      message: 'Analyzing calendar and deadlines... Schedule optimized!',
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOptimizeWorkload}
        className="h-9 px-3 gap-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
        leftIcon={<Sparkles className="h-3.5 w-3.5 fill-current" />}
      >
        Optimize Workload
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleCreateTask}
        className="h-9 px-3 gap-1.5"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
      >
        New Task
      </Button>
    </div>
  )
}

export default QuickActions
