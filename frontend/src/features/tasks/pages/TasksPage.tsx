import React, { useState, useEffect } from 'react'
import {
  List as ListIcon,
  Kanban as KanbanIcon,
  Calendar as CalendarIcon,
  GitCommit as TimelineIcon,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Award,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useTaskStore, type Task, type TaskStatus } from '../store/useTaskStore'
import { Tabs, type TabOption } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import CreateTaskModal from '../components/CreateTaskModal'
import TaskDetailsDrawer from '../components/TaskDetailsDrawer'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const TasksPage: React.FC = () => {
  const {
    tasks,
    searchQuery,
    filterStatus,
    filterPriority,
    sortBy,
    setSearchQuery,
    setFilterStatus,
    setFilterPriority,
    setSortBy,
    deleteTask,
    updateTask,
    fetchTasks,
  } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addToast = useToastStore((state) => state.addToast)

  // Modals & Panels State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  const tabOptions: TabOption[] = [
    { id: 'list', label: 'List', icon: <ListIcon className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <TimelineIcon className="h-4 w-4" /> },
  ]

  // Filter & Sort Tasks
  const processedTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (sortBy === 'priority') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      }
      return a.title.localeCompare(b.title)
    })

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteTask(id)
    addToast({
      type: 'error',
      title: 'Task Deleted',
      message: 'Task removed successfully.',
    })
  }

  const handleEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setTaskToEdit(task)
    setIsCreateOpen(true)
  }

  // Handle checking/completing task with Confetti and XP trigger
  const handleToggleComplete = async (task: Task) => {
    const isNowCompleted = task.status !== 'completed'
    try {
      await updateTask(task.id, {
        status: isNowCompleted ? 'completed' : 'todo',
        progress: isNowCompleted ? 100 : 0,
      })

      if (isNowCompleted) {
        // Confetti explosion
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#3b82f6']
        })

        addToast({
          type: 'success',
          title: 'Task Completed! 🎉',
          message: `+50 XP rewarded for completing "${task.title}".`,
        })
      } else {
        addToast({
          type: 'info',
          title: 'Task Re-opened',
          message: `"${task.title}" status reset to todo.`,
        })
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: 'Could not change task status.',
      })
    }
  }

  // 1. Perspective view layouts: List
  const renderListView = () => (
    <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-lg animate-in fade-in duration-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Task Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>XP Gain</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                No tasks match your filters.
              </TableCell>
            </TableRow>
          ) : (
            processedTasks.map((task) => {
              const isCompleted = task.status === 'completed'
              return (
                <TableRow
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="cursor-pointer hover:bg-secondary/10 transition-colors"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={cn(
                        "h-5 w-5 rounded-lg border flex items-center justify-center transition-colors btn-bounce shrink-0",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isCompleted && '✓'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className={cn("font-bold text-foreground", isCompleted && "line-through text-muted-foreground")}>{task.title}</div>
                    {task.labels.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        {task.labels.map((lbl, idx) => (
                          <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-black uppercase tracking-wider">
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-muted-foreground">{task.dueDate}</TableCell>
                  <TableCell>
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 fill-amber-500/10" /> +50 XP
                    </span>
                  </TableCell>
                  <TableCell className="w-36">
                    <div className="flex items-center gap-2">
                      <Progress value={task.progress} className="h-1.5 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
                      <span className="text-[10px] font-black text-muted-foreground">{task.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(task.id)} className="h-8 w-8 p-0 hover:bg-secondary/40 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleEdit(task, e)} className="h-8 w-8 p-0 hover:bg-secondary/40 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleDelete(task.id, e)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )

  // 2. Perspective view layouts: Kanban
  const renderKanbanView = () => {
    const columns: Array<{ id: TaskStatus; label: string }> = [
      { id: 'todo', label: 'Todo' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'completed', label: 'Completed' },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
        {columns.map((col) => {
          const colTasks = processedTasks.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className="flex flex-col rounded-2xl border border-border bg-secondary/15 p-4 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 px-1 border-b border-border/60 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">{col.label}</span>
                <Badge variant="secondary" className="font-bold">{colTasks.length}</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.map((task) => {
                  const isCompleted = task.status === 'completed'
                  return (
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <Card className="p-4 border-primary/5 hover:border-primary/20 hover:shadow-xl cursor-pointer text-left relative overflow-hidden transition-all duration-300">
                        {isCompleted && (
                          <div className="absolute right-0 top-0 w-8 h-8 bg-primary/10 flex items-center justify-center rounded-bl-xl text-primary font-bold text-[10px]">
                            ✓
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={cn("text-sm font-bold leading-snug", isCompleted ? "line-through text-muted-foreground" : "text-foreground")}>
                              {task.title}
                            </h4>
                            {!isCompleted && (
                              <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'} className="text-[9px] font-semibold shrink-0">
                                {task.priority}
                              </Badge>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                            <span className="font-semibold">Due: {task.dueDate}</span>
                            <span className="text-amber-500 font-black flex items-center gap-0.5">
                              <Award className="h-3.5 w-3.5 fill-amber-500/10" /> +50 XP
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 3. Perspective view layouts: Calendar Month preview
  const renderCalendarView = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1)
    return (
      <div className="grid grid-cols-7 gap-2 border border-border bg-card p-4 rounded-2xl shadow-lg animate-in fade-in duration-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-black text-xs py-2 text-muted-foreground uppercase tracking-wider">{day}</div>
        ))}
        {days.map((day) => {
          const mockDate = `2026-06-${day.toString().padStart(2, '0')}`
          const dayTasks = processedTasks.filter((t) => t.dueDate === mockDate)

          return (
            <div key={day} className="min-h-[90px] border border-border/30 bg-secondary/5 rounded-xl p-1.5 flex flex-col justify-between hover:bg-secondary/10 transition-colors">
              <span className="text-[10px] font-black text-muted-foreground">{day}</span>
              <div className="space-y-1">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="text-[9px] font-bold truncate bg-primary text-primary-foreground px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 4. Perspective view layouts: Timeline
  const renderTimelineView = () => (
    <div className="border border-border bg-card p-5 rounded-2xl shadow-lg animate-in fade-in duration-200 overflow-x-auto">
      <div className="min-w-[600px] divide-y divide-border/60">
        <div className="grid grid-cols-6 gap-2 pb-3 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">
          <div className="text-left">Task Details</div>
          <div>June 25</div>
          <div>June 26</div>
          <div>June 27</div>
          <div>June 28</div>
          <div>June 29</div>
        </div>

        {processedTasks.map((task) => {
          const dueDayNum = Number(task.dueDate.split('-')[2])
          const offsetCol = Math.min(Math.max(dueDayNum - 25, 0), 4)

          return (
            <div key={task.id} className="grid grid-cols-6 gap-2 py-4 items-center">
              <div
                onClick={() => setSelectedTaskId(task.id)}
                className="text-xs font-bold text-foreground cursor-pointer truncate text-left hover:text-primary transition-colors"
              >
                {task.title}
              </div>
              <div className="col-span-5 grid grid-cols-5 gap-2 relative h-7 bg-secondary/20 rounded-xl overflow-hidden">
                <div
                  style={{ gridColumnStart: offsetCol + 1, gridColumnEnd: offsetCol + 2 }}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center rounded-xl cursor-pointer truncate px-2.5 shadow btn-bounce"
                >
                  {task.estimatedTime}m due
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight text-foreground">Task Engine</h1>
          <p className="text-sm text-muted-foreground">Perspectives and task states orchestration.</p>
        </div>
        <Button onClick={() => { setTaskToEdit(null); setIsCreateOpen(true); }} className="btn-bounce shadow-lg shadow-primary/20" leftIcon={<Plus className="h-4 w-4" />}>
          Add Task
        </Button>
      </div>

      {/* Filter and search bar controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search task title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="dueDate">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="title">Sort alphabetically</option>
        </select>
      </div>

      {/* Perspectives tabs selectors */}
      <Tabs options={tabOptions} activeId={activeTab} onChange={setActiveTab} />

      {/* Workspace Area */}
      <div className="min-h-[400px]">
        {activeTab === 'list' && renderListView()}
        {activeTab === 'kanban' && renderKanbanView()}
        {activeTab === 'calendar' && renderCalendarView()}
        {activeTab === 'timeline' && renderTimelineView()}
      </div>

      {/* Create / Edit Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setTaskToEdit(null); }}
        taskToEdit={taskToEdit}
      />

      {/* Details drawer */}
      <TaskDetailsDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}

export default TasksPage
