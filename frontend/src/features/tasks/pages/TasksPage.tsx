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
} from 'lucide-react'
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
    { id: 'kanban', label: 'Kanban', icon: <KanbanIcon className="h-4 w-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-4 w-4" /> },
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

  // 1. Perspective view layouts: List
  const renderListView = () => (
    <Table className="animate-in fade-in duration-200">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Task Title</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {processedTasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No tasks match your filters.
            </TableCell>
          </TableRow>
        ) : (
          processedTasks.map((task) => (
            <TableRow
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="cursor-pointer"
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() =>
                    updateTask(task.id, {
                      status: task.status === 'completed' ? 'todo' : 'completed',
                      progress: task.status === 'completed' ? 0 : 100,
                    })
                  }
                  className="h-4 w-4 border-border rounded"
                />
              </TableCell>
              <TableCell>
                <div className="font-semibold text-foreground">{task.title}</div>
                {task.labels.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {task.labels.map((lbl, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold uppercase">
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
              <TableCell className="font-medium text-xs">{task.dueDate}</TableCell>
              <TableCell className="w-36">
                <div className="flex items-center gap-2">
                  <Progress value={task.progress} className="h-1.5" />
                  <span className="text-[10px] font-bold text-muted-foreground">{task.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(task.id)} className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => handleEdit(task, e)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => handleDelete(task.id, e)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  // 2. Perspective view layouts: Kanban
  const renderKanbanView = () => {
    const columns: Array<{ id: TaskStatus; label: string }> = [
      { id: 'todo', label: 'Todo' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'completed', label: 'Completed' },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
        {columns.map((col) => {
          const colTasks = processedTasks.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className="flex flex-col rounded-lg border border-border bg-secondary/10 p-3 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 px-1 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                <Badge variant="secondary">{colTasks.length}</Badge>
              </div>

              <div className="flex-1 py-3 space-y-3 overflow-y-auto">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    hoverable
                    onClick={() => setSelectedTaskId(task.id)}
                    className="p-4 border-border/80 relative"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-foreground leading-normal">{task.title}</h4>
                        <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'} className="text-[9px]">
                          {task.priority}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                        <span>Due: {task.dueDate}</span>
                        {task.subtasks.length > 0 && (
                          <span>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 3. Perspective view layouts: Calendar Month preview
  const renderCalendarView = () => {
    // Simple calendar logic rendering month grid (days 1 to 30) for visualization
    const days = Array.from({ length: 30 }, (_, i) => i + 1)
    return (
      <div className="grid grid-cols-7 gap-1.5 border border-border bg-card p-3 rounded-lg animate-in fade-in duration-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-bold text-xs py-1.5 text-muted-foreground uppercase">{day}</div>
        ))}
        {days.map((day) => {
          // Format mockup dates matching task dueDates
          const mockDate = `2026-06-${day.toString().padStart(2, '0')}`
          const dayTasks = processedTasks.filter((t) => t.dueDate === mockDate)

          return (
            <div key={day} className="min-h-[80px] border border-border/40 bg-secondary/5 rounded p-1 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">{day}</span>
              <div className="space-y-1">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="text-[9px] font-semibold truncate bg-primary text-primary-foreground px-1.5 py-0.5 rounded cursor-pointer"
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
    <div className="border border-border bg-card p-4 rounded-lg space-y-4 animate-in fade-in duration-200 overflow-x-auto">
      <div className="min-w-[600px] divide-y divide-border">
        {/* Timeline Header Row */}
        <div className="grid grid-cols-6 gap-2 pb-2 text-center text-xs font-bold text-muted-foreground uppercase">
          <div className="text-left">Task Details</div>
          <div>June 25</div>
          <div>June 26</div>
          <div>June 27</div>
          <div>June 28</div>
          <div>June 29</div>
        </div>

        {/* Timeline Tasks bars */}
        {processedTasks.map((task) => {
          const dueDayNum = Number(task.dueDate.split('-')[2])
          const offsetCol = Math.min(Math.max(dueDayNum - 25, 0), 4) // mapping offset based on mockup timeline columns

          return (
            <div key={task.id} className="grid grid-cols-6 gap-2 py-3 items-center">
              <div
                onClick={() => setSelectedTaskId(task.id)}
                className="text-xs font-bold text-foreground cursor-pointer truncate"
              >
                {task.title}
              </div>
              <div className="col-span-5 grid grid-cols-5 gap-2 relative h-6 bg-secondary/20 rounded">
                <div
                  style={{ gridColumnStart: offsetCol + 1, gridColumnEnd: offsetCol + 2 }}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded cursor-pointer truncate px-2"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground">Task Engine</h1>
          <p className="text-sm text-muted-foreground">Perspectives and task states orchestration.</p>
        </div>
        <Button onClick={() => { setTaskToEdit(null); setIsCreateOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
          Add Task
        </Button>
      </div>

      {/* Filter and search bar controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-lg border border-border/80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search task title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
