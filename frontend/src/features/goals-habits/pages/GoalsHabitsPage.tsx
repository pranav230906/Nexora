import React, { useState, useEffect } from 'react'
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
import { useGoalHabitStore } from '@/store/useGoalHabitStore'
import { cn } from '@/utils/cn'
import { Modal } from '@/components/ui/Modal'
import { InputField } from '@/components/form/InputField'

export const GoalsHabitsPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)
  
  const {
    goals,
    habits,
    heatmapData,
    analyticsData,
    fetchGoals,
    fetchHabits,
    fetchHeatmap,
    fetchAnalytics,
    addGoal,
    toggleMilestone,
    addHabit,
    checkInHabit
  } = useGoalHabitStore()

  // Modals state
  const [isGoalOpen, setIsGoalOpen] = useState(false)
  const [isHabitOpen, setIsHabitOpen] = useState(false)

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalMilestones, setGoalMilestones] = useState<string>('')

  // Habit Form State
  const [habitName, setHabitName] = useState('')
  const [habitDesc, setHabitDesc] = useState('')
  const [habitFreq, setHabitFreq] = useState('DAILY')

  useEffect(() => {
    fetchGoals()
    fetchHabits()
    fetchHeatmap()
    fetchAnalytics()
  }, [fetchGoals, fetchHabits, fetchHeatmap, fetchAnalytics])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalTitle.trim()) return

    const milestonesList = goalMilestones
      ? goalMilestones.split(',').map((m) => ({ title: m.trim(), completed: false })).filter((m) => m.title)
      : []

    try {
      await addGoal({
        title: goalTitle,
        description: goalDesc,
        targetDate: goalDate || new Date().toISOString().split('T')[0],
        isCompleted: false,
        milestones: milestonesList
      })
      addToast({
        type: 'success',
        title: 'Goal Created',
        message: `Successfully created goal: "${goalTitle}".`
      })
      setIsGoalOpen(false)
      setGoalTitle('')
      setGoalDesc('')
      setGoalDate('')
      setGoalMilestones('')
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to create goal.' })
    }
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitName.trim()) return

    try {
      await addHabit({
        name: habitName,
        description: habitDesc,
        frequency: habitFreq
      })
      addToast({
        type: 'success',
        title: 'Habit Created',
        message: `Successfully created habit: "${habitName}".`
      })
      setIsHabitOpen(false)
      setHabitName('')
      setHabitDesc('')
      setHabitFreq('DAILY')
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to create habit.' })
    }
  }

  const handleToggleMilestone = async (goalId: string, milestoneId: string, currentStatus: boolean) => {
    await toggleMilestone(goalId, milestoneId, !currentStatus)
    addToast({
      type: 'info',
      title: 'Milestone Updated',
      message: 'Goal progress re-calculated.'
    })
  }

  const handleHabitCheckIn = async (habitId: string, currentCompletedToday: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0]
    await checkInHabit(habitId, todayStr, !currentCompletedToday)
    
    if (!currentCompletedToday) {
      addToast({
        type: 'success',
        title: 'Habit checked in!',
        message: 'Keep the momentum going today!'
      })
    }
  }

  // Parse Heatmap contributions: last 90 days
  const last90DaysContributions = Array.from({ length: 90 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (89 - i))
    const dateKey = d.toISOString().split('T')[0]
    return heatmapData[dateKey] || 0
  })

  const getHeatmapColor = (value: number) => {
    if (value >= 4) return 'bg-emerald-600 dark:bg-emerald-700'
    if (value === 3) return 'bg-emerald-500'
    if (value === 2) return 'bg-emerald-400 dark:bg-emerald-500/50'
    if (value === 1) return 'bg-emerald-300 dark:bg-emerald-500/20'
    return 'bg-secondary/40'
  }

  // Map Weekly bar chart data
  const chartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
    // Check logs inside last 7 days matching days of week
    const d = new Date()
    const currentDay = d.getDay() // 0 = Sun, 1 = Mon ...
    const offset = idx + 1 - (currentDay === 0 ? 7 : currentDay) // Offset back/forward
    d.setDate(d.getDate() + offset)
    const dateKey = d.toISOString().split('T')[0]
    return {
      day,
      count: heatmapData[dateKey] || 0
    }
  })

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
          <Button onClick={() => setIsHabitOpen(true)} variant="outline" size="sm" className="h-9 px-3 gap-1.5" leftIcon={<Plus className="h-4 w-4" />}>
            New Habit
          </Button>
          <Button onClick={() => setIsGoalOpen(true)} variant="primary" size="sm" className="h-9 px-3 gap-1.5" leftIcon={<Plus className="h-4 w-4" />}>
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

          {goals.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80">
              <Target className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <h4 className="text-sm font-bold text-foreground">No active goals yet</h4>
              <p className="text-xs text-muted-foreground">Define milestones to lock your long term targets.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">Goal</Badge>
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
                            onClick={() => handleToggleMilestone(goal.id, m.id, m.completed)}
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
          )}

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
                {last90DaysContributions.map((val, idx) => (
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
              {habits.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No habits tracked. Add one above!</p>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/5"
                  >
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-foreground">{habit.name}</h5>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 fill-current" /> {habit.streak} Day Streak
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={habit.completedToday ? 'outline' : 'primary'}
                      onClick={() => handleHabitCheckIn(habit.id, habit.completedToday)}
                      className="h-8 text-[10px] px-3 font-semibold uppercase tracking-wider"
                    >
                      {habit.completedToday ? 'Checked' : 'Check In'}
                    </Button>
                  </div>
                ))
              )}
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

      {/* New Goal Modal */}
      <Modal isOpen={isGoalOpen} onClose={() => setIsGoalOpen(false)} title="Create New Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4 pt-2 text-left">
          <InputField label="Goal Title" placeholder="e.g. Master Backend Engineering" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} placeholder="What is this goal about?" />
          </div>
          <InputField label="Target Date" type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
          <InputField label="Milestones (comma separated)" placeholder="Set up postgres, Write tests, Deploy" value={goalMilestones} onChange={(e) => setGoalMilestones(e.target.value)} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsGoalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Goal</Button>
          </div>
        </form>
      </Modal>

      {/* New Habit Modal */}
      <Modal isOpen={isHabitOpen} onClose={() => setIsHabitOpen(false)} title="Track New Habit">
        <form onSubmit={handleCreateHabit} className="space-y-4 pt-2 text-left">
          <InputField label="Habit Name" placeholder="e.g. Drink 3L Water" value={habitName} onChange={(e) => setHabitName(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={habitDesc} onChange={(e) => setHabitDesc(e.target.value)} placeholder="Details..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none" value={habitFreq} onChange={(e) => setHabitFreq(e.target.value)}>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsHabitOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Habit</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default GoalsHabitsPage
