import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  Plus,
  PlusCircle,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

// Dummy Data
interface Milestone {
  id: string
  title: string
  completed: boolean
}

interface Goal {
  id: string
  title: string
  category: string
  progress: number
  milestones: Milestone[]
}

interface Habit {
  id: string
  title: string
  streak: number
  completedToday: boolean
}

const initialGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Ship Beta Version of App',
    category: 'Engineering',
    progress: 50,
    milestones: [
      { id: 'm1', title: 'Initialize structure and setup', completed: true },
      { id: 'm2', title: 'Build core UI components', completed: true },
      { id: 'm3', title: 'Complete AI features', completed: false },
      { id: 'm4', title: 'Conduct user tests & publish', completed: false },
    ],
  },
  {
    id: 'g2',
    title: 'Acquire 100 Active Users',
    category: 'Marketing',
    progress: 25,
    milestones: [
      { id: 'm5', title: 'Create landing page', completed: true },
      { id: 'm6', title: 'Launch social campaign', completed: false },
      { id: 'm7', title: 'Publish product hunt page', completed: false },
      { id: 'm8', title: 'Run email newsletter', completed: false },
    ],
  },
]

const initialHabits: Habit[] = [
  { id: 'h1', title: 'Daily Coding Practice', streak: 14, completedToday: false },
  { id: 'h2', title: '25-minute Pomodoro Deep Block', streak: 7, completedToday: true },
  { id: 'h3', title: 'Read engineering newsletter', streak: 3, completedToday: false },
  { id: 'h4', title: 'Review slowdown logs', streak: 12, completedToday: true },
]

const chartData = [
  { day: 'Mon', count: 2 },
  { day: 'Tue', count: 3 },
  { day: 'Wed', count: 4 },
  { day: 'Thu', count: 2 },
  { day: 'Fri', count: 4 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 4 },
]

export const GoalsHabitsPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Interactive Goals & Milestones State
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [habits, setHabits] = useState<Habit[]>(initialHabits)

  // Heatmap Contribution Values
  const [contributions, setContributions] = useState<number[]>(
    Array.from({ length: 90 }, (_, i) => {
      if (i % 7 === 0) return 4
      if (i % 5 === 0) return 2
      if (i % 3 === 0) return 1
      return 0
    })
  )

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          )
          const completedCount = nextMilestones.filter((m) => m.completed).length
          const progress = Math.round((completedCount / nextMilestones.length) * 100)

          return {
            ...g,
            milestones: nextMilestones,
            progress,
          }
        }
        return g
      })
    )
    addToast({
      type: 'info',
      title: 'Milestone Updated',
      message: 'Goal progress recalculated.',
    })
  }

  const handleHabitCheckIn = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const nextCompleted = !h.completedToday
          const streakModifier = nextCompleted ? 1 : -1
          const nextStreak = h.streak + streakModifier

          if (nextCompleted) {
            addToast({
              type: 'success',
              title: 'Habit checked in!',
              message: `Keep the momentum! "${h.title}" checked off today. Streak: ${nextStreak} Days.`,
            })
            // Dynamically increment one contribution square value in the heatmap
            setContributions((c) => {
              const updated = [...c]
              updated[89] = Math.min(updated[89] + 1, 4)
              return updated
            })
          }
          return {
            ...h,
            completedToday: nextCompleted,
            streak: nextStreak,
          }
        }
        return h
      })
    )
  }

  const getHeatmapColor = (value: number) => {
    switch (value) {
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-700'
      case 3:
        return 'bg-emerald-500'
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-500/50'
      case 1:
        return 'bg-emerald-300 dark:bg-emerald-500/20'
      case 0:
      default:
        return 'bg-secondary/40'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Target className="h-7 w-7 text-primary" />
            Goals & Habits
          </h1>
          <p className="text-sm text-muted-foreground">Define milestones, track daily habits, and build streaks.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="h-9 px-3 gap-1.5" leftIcon={<Plus className="h-4 w-4" />}>
            New Goal
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Goal Cards & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Target className="h-4 w-4" /> Active Goals
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">{goal.category}</Badge>
                      <CardTitle className="text-base font-bold pt-1">{goal.title}</CardTitle>
                    </div>
                    <span className="text-sm font-black text-primary">{goal.progress}%</span>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Progress value={goal.progress} className="h-2" />

                    {/* Milestones list */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Milestones</span>
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleMilestone(goal.id, m.id)}
                          className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/40 border border-transparent hover:border-border cursor-pointer text-xs font-medium"
                        >
                          <div className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center',
                            m.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                          )}>
                            {m.completed && '✓'}
                          </div>
                          <span className={m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {/* GitHub Style Contribution Grid Heatmap */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                Completions Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <div className="flex gap-1.5 flex-wrap min-w-[500px]">
                {contributions.map((val, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'h-3.5 w-3.5 rounded-sm transition-all duration-300',
                      getHeatmapColor(val)
                    )}
                    title={`${val} habits completed`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-3 pr-2">
                <span>90 days contribution history</span>
                <div className="flex items-center gap-1">
                  <span>Less</span>
                  <div className="h-2.5 w-2.5 rounded-sm bg-secondary/40" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Daily Habits list check-in & Progress Chart */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Flame className="h-4 w-4 text-amber-500" /> Daily Habits Tracker
          </div>

          {/* Daily Habit Check-In list */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm">Today's Habits</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/5"
                >
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">{habit.title}</h5>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 fill-current" /> {habit.streak} Day Streak
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={habit.completedToday ? 'outline' : 'primary'}
                    onClick={() => handleHabitCheckIn(habit.id)}
                    className="h-8 text-[10px] px-3 font-semibold uppercase tracking-wider"
                  >
                    {habit.completedToday ? 'Checked' : 'Check In'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Habit statistics charts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Weekly completions
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '10px' }} />
                  <Bar dataKey="count" fill="var(--color-primary, hsl(var(--primary)))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GoalsHabitsPage
