import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Clock,
  Sparkles,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  CircleDot,
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
import { useGamificationStore } from '@/store/useGamificationStore'
import apiClient from '@/services/apiClient'

// Daily stats
const chartData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 75 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 70 },
  { day: 'Fri', score: 90 },
  { day: 'Sat', score: 95 },
  { day: 'Sun', score: 88 },
]

export const DashboardHome: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Focus Timer Pomodoro State
  const [timerTime, setTimerTime] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [emailStatus, setEmailStatus] = useState<any>(null)

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
  const { profile, leaderboard, fetchProfile, fetchLeaderboard } = useGamificationStore()

  useEffect(() => {
    fetchTasks()
    fetchProfile()
    fetchLeaderboard()
    apiClient.get('/gmail/status/')
      .then((res) => setEmailStatus(res.data))
      .catch(() => {})
  }, [fetchTasks, fetchProfile, fetchLeaderboard])

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
      {/* 1. Top Greeting Card with Duolingo Banner style */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left space-y-1">
          <h2 className="font-display font-black text-2xl tracking-tight text-foreground flex items-center gap-2">
            Welcome back! <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block">👋</motion.span>
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your daily planner is synced. You have {totalTodayTasks - completedTodayTasks} tasks remaining for today.
          </p>
        </div>
        {emailStatus?.connected && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shrink-0 self-start sm:self-auto">
            <CircleDot className="h-3.5 w-3.5 fill-current animate-pulse" />
            <span>Gmail Auto-Sync Connected</span>
          </div>
        )}
      </div>

      {/* 2. Top Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productivity Score */}
        <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Productivity Score</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black font-display text-primary">{productivityScore}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Completed {completedTasks} of {totalTasks} total tasks
            </p>
            <Progress value={productivityScore} className="mt-3 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Progress</span>
            <CircleDot className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black font-display text-emerald-500">
              {completedTodayTasks} / {totalTodayTasks}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Today's tasks completed</p>
            <Progress value={todayProgress} className="mt-3 bg-secondary" color="bg-emerald-500" />
          </CardContent>
        </Card>

        {/* Habits / Daily Streak */}
        <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Streak</span>
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
          </CardHeader>
          <CardContent className="text-left">
            <div className="text-3xl font-black font-display text-amber-500">{profile?.streak_days || 0} Days</div>
            <p className="text-[10px] text-amber-500 font-bold mt-1">Keep it up! Active habit streak</p>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: Math.min(7, profile?.streak_days || 1) }).map((_, index) => (
                <div key={index} className="h-2 w-full rounded bg-amber-500" />
              ))}
              {Array.from({ length: 7 - Math.min(7, profile?.streak_days || 1) }).map((_, index) => (
                <div key={index} className="h-2 w-full rounded bg-secondary/55" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Level & XP */}
        {(() => {
          const level = profile?.level || 1
          const xp = profile?.xp || 0
          const minXp = 100 * Math.pow(level - 1, 2)
          const maxXp = 100 * Math.pow(level, 2)
          const progressVal = xp - minXp
          const totalVal = maxXp - minXp
          const progressPercent = totalVal > 0 ? Math.round((progressVal / totalVal) * 100) : 0
          
          return (
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Level</span>
                <Award className="h-4 w-4 text-primary animate-pulse" />
              </CardHeader>
              <CardContent className="text-left">
                <div className="text-3xl font-black font-display text-primary">Lv. {level}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{xp} / {maxXp} XP to Level {level + 1}</p>
                <Progress value={progressPercent} className="mt-3 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
              </CardContent>
            </Card>
          )
        })()}
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks, Deadlines, Focus Timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card className="border-border">
            <CardHeader className="border-b border-border/40 pb-4 text-left">
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
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        key={task.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/40 hover:bg-secondary/20 transition-all cursor-pointer text-left"
                        onClick={() => toggleTask(task.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border'
                            }`}
                          >
                            {isCompleted && '✓'}
                          </div>
                          <span className={`text-sm font-semibold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </span>
                        </div>
                        <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'warning' : 'secondary'}>
                          {task.priority}
                        </Badge>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Productivity Stats Chart */}
          <Card>
            <CardHeader className="text-left">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Productivity Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(263, 80%, 60%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(263, 80%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="color-mix(in srgb, hsl(var(--border)) 70%, transparent)" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} dx={-8} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'color-mix(in srgb, hsl(var(--card)) 85%, transparent)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid color-mix(in srgb, hsl(var(--border)) 80%, transparent)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(263, 80%, 60%)" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={3} dot={{ stroke: 'hsl(263, 80%, 60%)', strokeWidth: 2, r: 4, fill: 'hsl(var(--card))' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pomodoro, AI Coach suggestions, Leaderboard */}
        <div className="space-y-6">
          {/* Pomodoro Focus Timer */}
          <Card className="text-center relative overflow-hidden bg-primary/5 border-primary/20 rounded-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Focus Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-5xl font-black font-display tracking-tight text-foreground select-none">
                {formatTime(timerTime)}
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="primary" onClick={toggleTimer} className="h-10 px-6 font-semibold shadow-lg shadow-primary/20 btn-bounce">
                  {timerActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {timerActive ? 'Pause' : 'Start'}
                </Button>
                <Button variant="outline" onClick={resetTimer} className="h-10 w-10 p-0 border border-border btn-bounce">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions Panel */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4 text-left">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                AI Assistant Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5 fill-current" /> Schedule Urgency Alert
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have tasks pending for today. I suggest starting a Pomodoro session now to check off items early and keep your streak!
                </p>
                <Button size="sm" variant="primary" onClick={() => { setTimerTime(25 * 60); setTimerActive(true); }} className="text-xs h-7 px-3 btn-bounce">
                  Start Session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard & XP */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-4 text-left">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-left">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No leaderboard rankings found.</p>
              ) : (
                leaderboard.slice(0, 5).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-muted-foreground w-4">{user.rank}.</span>
                      <Avatar fallback={user.username ? user.username.slice(0,2).toUpperCase() : user.email.slice(0,2).toUpperCase()} size="sm" />
                      <span className="text-xs font-bold truncate max-w-[100px]" title={user.username || user.email}>
                        {user.username || user.email.split('@')[0]}
                      </span>
                    </div>
                    <Badge variant={user.rank === 1 ? 'primary' : 'secondary'} className="text-[10px] font-black">
                      {user.xp} XP
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
