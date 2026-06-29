import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckSquare, MessageSquare, Paperclip, Clock, Calendar, AlertTriangle, Plus } from 'lucide-react'
import { useTaskStore, type Task } from '../store/useTaskStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'

interface TaskDetailsDrawerProps {
  taskId: string | null
  onClose: () => void
}

export const TaskDetailsDrawer: React.FC<TaskDetailsDrawerProps> = ({ taskId, onClose }) => {
  const { tasks, toggleSubtask, addSubtask, addComment, addAttachment } = useTaskStore()
  const task = tasks.find((t) => t.id === taskId)

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newCommentText, setNewCommentText] = useState('')

  if (!task) return null

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    await addSubtask(task.id, newSubtaskTitle)
    setNewSubtaskTitle('')
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim()) return
    await addComment(task.id, newCommentText)
    setNewCommentText('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await addAttachment(task.id, e.target.files[0])
    }
  }

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Details</span>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Badges */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'outline'}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'}>
                    {task.priority} Priority
                  </Badge>
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">
                  {task.title}
                </h2>
                {task.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Spacing tags */}
              {task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((lbl, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground font-semibold border border-border">
                      {lbl}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress and estimates */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-border/60 py-4">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Estimate</span>
                    <span className="font-semibold">{task.estimatedTime || 30} mins</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Due Date</span>
                    <span className="font-semibold">{task.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
                  <span className="font-bold">{task.progress}%</span>
                </div>
                <Progress value={task.progress} />
              </div>

              {/* Subtask Checklist */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" /> Checklist / Subtasks
                </h4>
                {/* Checklist list */}
                <div className="space-y-2">
                  {task.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => toggleSubtask(task.id, sub.id)}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/40 border border-transparent hover:border-border cursor-pointer text-xs font-medium"
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center',
                        sub.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      )}>
                        {sub.completed && '✓'}
                      </div>
                      <span className={sub.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtask input Form */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-grow h-9 px-3 py-1.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="submit" variant="outline" size="sm" className="h-9 px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              {/* Attachments */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> Attachments
                  </h4>
                  <label className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                    + Add File
                    <input type="file" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                {task.attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No files attached.</p>
                ) : (
                  <div className="space-y-2">
                    {task.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-secondary/10">
                        <span className="text-xs font-semibold truncate max-w-xs">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">{file.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Activity & Comments
                </h4>
                {/* Comments list */}
                <div className="space-y-3">
                  {task.comments.map((comm) => (
                    <div key={comm.id} className="flex gap-3 p-3 rounded-lg bg-secondary/20 border border-border/40 text-xs">
                      <Avatar fallback={comm.user} size="sm" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{comm.user}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(comm.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{comm.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment input form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-grow h-9 px-3 py-1.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="submit" variant="primary" size="sm" className="h-9 px-4">
                    Comment
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default TaskDetailsDrawer
