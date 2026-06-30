import React, { useState, useRef, useEffect } from 'react'
import { Plus, Sparkles, Loader2, Mic, Keyboard, Brain, Send } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import { InputField } from '@/components/form/InputField'
import { useToastStore } from '@/store/useToastStore'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'
import apiClient from '@/services/apiClient'
import { cn } from '@/utils/cn'

export const QuickActions: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)
  const { fetchTasks, addTask } = useTaskStore()

  // Modal Open state
  const [isOpen, setIsOpen] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual')

  // Manual Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')

  // AI Form State
  const [aiInput, setAiInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [micActive, setMicActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Speech Recognition Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

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

  // Optimize Workload via Replan API
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
      const response = await apiClient.post('/action-engine/replan/')
      addToast({
        type: 'success',
        title: 'Workload Optimized',
        message: `Successfully time-blocked ${response.data.schedule?.length || 0} items for your schedule today.`,
      })
    } catch (err: any) {
      console.error('Optimization failed:', err)
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        message: 'Could not connect to AI Schedule Planner.',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // AI Command Processing
  const handleSendAiCommand = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!aiInput.trim()) return

    setIsAiProcessing(true)
    setAiResponse('')
    try {
      const response = await apiClient.post('/action-engine/process-input/', { text: aiInput })
      const data = response.data

      if (data.requires_follow_up) {
        setAiResponse(data.response)
      } else {
        addToast({
          type: 'success',
          title: 'AI Scheduled Task',
          message: data.response || 'Task successfully created and scheduled.',
        })
        setAiInput('')
        setIsOpen(false)
        fetchTasks()
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Extraction Failed',
        message: err.message || 'Could not parse task intent.',
      })
    } finally {
      setIsAiProcessing(false)
    }
  }

  // Toggle speech-to-text mic
  const handleToggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      addToast({
        type: 'warning',
        title: 'Speech Recognition Unsupported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
      })
      return
    }

    if (micActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setMicActive(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setMicActive(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setAiInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
      }

      recognition.onerror = () => {
        setMicActive(false)
      }

      recognition.onend = () => {
        setMicActive(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setMicActive(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOptimizeWorkload}
        disabled={isOptimizing}
        className="h-9 px-3 gap-1.5 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary btn-bounce"
        leftIcon={isOptimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 fill-current animate-pulse" />}
      >
        Optimize Workload
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCreationMode('ai')
          setIsOpen(true)
        }}
        className="h-9 px-3 gap-1.5 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 btn-bounce"
        leftIcon={<Brain className="h-3.5 w-3.5" />}
      >
        AI Task Wizard
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          setCreationMode('manual')
          setIsOpen(true)
        }}
        className="h-9 px-3 gap-1.5 btn-bounce"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
      >
        New Task
      </Button>

      {/* Task Creation Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Task" description="Add details manually or speak using natural language.">
        <div className="flex border-b border-border/60 pb-2 mb-4 gap-4">
          <button
            onClick={() => setCreationMode('manual')}
            className={cn(
              "text-xs font-semibold pb-1.5 border-b-2 px-1 transition-all flex items-center gap-1.5",
              creationMode === 'manual' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Keyboard className="h-3.5 w-3.5" /> Manual Form
          </button>
          <button
            onClick={() => setCreationMode('ai')}
            className={cn(
              "text-xs font-semibold pb-1.5 border-b-2 px-1 transition-all flex items-center gap-1.5",
              creationMode === 'ai' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Brain className="h-3.5 w-3.5" /> AI Action Engine
          </button>
        </div>

        {creationMode === 'manual' ? (
          <form onSubmit={handleCreateTask} className="space-y-4 text-left">
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
        ) : (
          <form onSubmit={handleSendAiCommand} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Voice / Text Command</label>
              <p className="text-[10px] text-muted-foreground">Type or speak your plan (e.g. "Call Rahul at 6 PM tomorrow and outline report for two hours")</p>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Tomorrow remind me to finish homework..."
                className="flex-grow h-10 px-3 py-2 rounded-lg border border-input bg-background/50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleMic}
                className={cn(
                  'h-10 w-10 p-0 shrink-0 border-border',
                  micActive && 'border-red-500 bg-red-500/10 text-red-500 animate-pulse'
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isAiProcessing || !aiInput.trim()}
                className="h-10 px-4 shrink-0"
              >
                {isAiProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {aiResponse && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs leading-relaxed text-left text-primary">
                <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">Coach Response:</span>
                {aiResponse}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default QuickActions
