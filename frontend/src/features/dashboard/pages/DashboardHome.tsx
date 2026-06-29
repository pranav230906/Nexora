import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Clock,
  Sparkles,
  Calendar,
  Trophy,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  CircleDot,
  AlertCircle,
  Flame,
  Award,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useToastStore } from '@/store/useToastStore'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'

// Dummy Data
const chartData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 75 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 70 },
  { day: 'Fri', score: 90 },
  { day: 'Sat', score: 95 },
  { day: 'Sun', score: 88 },
]

const dummyLeaderboard = [
  { id: '1', name: 'Pranav S', xp: 2450, rank: 1, avatar: 'P' },
  { id: '2', name: 'Sarah Miller', xp: 2200, rank: 2, avatar: 'SM' },
  { id: '3', name: 'Alexander T', xp: 1980, rank: 3, avatar: 'AT' },
]

export const DashboardHome: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Focus Timer Pomodoro State
  const [timerTime, setTimerTime] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    let interval: any = null
    if (timerActive && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime((t) => t - 1)
      }, 1000)
    } else if (timerTime === 0) {
      setTimerActive(false)
      addToast({
        type: 'success',
        title: 'Focus Session Complete!',
        message: 'Great job staying focused. Take a 5-minute break.',
      })
    }
    return () => clearInterval(interval)
  }, [timerActive, timerTime])

  const toggleTimer = () => setTimerActive(!timerActive)
  const resetTimer = () => {
    setTimerActive(false)
    setTimerTime(25 * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const { tasks, fetchTasks, updateTask } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const todayStr = new Date().toISOString().split('T')[0]
  const todaysTasks = tasks.filter((task) => {
    return task.dueDate === todayStr || (!task.dueDate && task.status !== 'completed')
  })

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    try {
      await updateTask(id, { status: newStatus })
      addToast({
        type: 'success',
        title: newStatus === 'completed' ? 'Task Completed' : 'Task Re-opened',
        message: `"${task.title}" updated successfully.`,
      })
    } catch (err) {
      console.error('Failed to update task status:', err)
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update task status.',
      })
    }
  }

  // Calculations based on live tasks
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalTodayTasks = todaysTasks.length
  const completedTodayTasks = todaysTasks.filter(t => t.status === 'completed').length
  const todayProgress = totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* 1. Top Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productivity Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Productivity Score</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{productivityScore}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Completed {completedTasks} of {totalTasks} total tasks
            </p>
            <Progress value={productivityScore} className="mt-3 bg-secondary" color="bg-primary" />
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Progress</span>
            <CircleDot className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">
              {completedTodayTasks} / {totalTodayTasks}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Today's tasks completed</p>
            <Progress value={todayProgress} className="mt-3 bg-secondary" color="bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Habits / Daily Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Streak</span>
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">7 Days</div>
            <p className="text-[10px] text-amber-500 font-medium mt-1">Keep it up! Active habit streak</p>
            <div className="flex gap-1 mt-3">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className="h-2 w-full rounded bg-amber-500" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Level & XP */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Level</span>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">Lv. 14</div>
            <p className="text-[10px] text-muted-foreground mt-1">1,850 / 2,000 XP to Level 15</p>
            <Progress value={92} className="mt-3 bg-secondary" color="bg-primary" />
          </CardContent>
        </Card>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks, Deadlines, Focus Timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No tasks scheduled for today.</p>
                ) : (
                  todaysTasks.map((task) => {
                    const isCompleted = task.status === 'completed'
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40 hover:bg-secondary/20 transition-all cursor-pointer"
                        onClick={() => toggleTask(task.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border'
                            }`}
                          >
                            {isCompleted && '✓'}
                          </div>
                          <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </span>
                        </div>
                        <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
                          {task.priority}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Productivity Stats Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Productivity Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="score" stroke="var(--color-primary, hsl(var(--primary)))" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pomodoro, AI Coach suggestions, Leaderboard */}
        <div className="space-y-6">
          {/* Pomodoro Focus Timer */}
          <Card className="text-center relative overflow-hidden bg-primary/5 border-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Focus Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-5xl font-black font-display tracking-tight text-foreground">
                {formatTime(timerTime)}
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="primary" onClick={toggleTimer} className="h-10 px-6 font-semibold shadow">
                  {timerActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {timerActive ? 'Pause' : 'Start'}
                </Button>
                <Button variant="outline" onClick={resetTimer} className="h-10 w-10 p-0 border border-border">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions Panel */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                AI Assistant Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5 fill-current" /> Schedule Urgency Alert
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have <span className="font-semibold text-foreground">Complete pitch deck draft</span> due today at 5:00 PM. I suggest starting a Pomodoro session now to avoid a last-minute rush.
                </p>
                <Button size="sm" variant="primary" onClick={() => { setTimerTime(25 * 60); setTimerActive(true); }} className="text-xs h-7 px-3">
                  Start Session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard & XP */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {dummyLeaderboard.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-muted-foreground w-4">{user.rank}.</span>
                    <Avatar fallback={user.avatar} size="sm" />
                    <span className="text-xs font-semibold">{user.name}</span>
                  </div>
                  <Badge variant={user.rank === 1 ? 'primary' : 'secondary'} className="text-[10px]">
                    {user.xp} XP
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
