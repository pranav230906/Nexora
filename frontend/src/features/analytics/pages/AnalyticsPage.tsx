import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Award,
  Zap,
  HelpCircle,
  Lightbulb,
  Activity,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/utils/cn'

// Dummy Data
const weeklyFocusData = [
  { label: 'Mon', hours: 4.5, rate: 80 },
  { label: 'Tue', hours: 6.2, rate: 90 },
  { label: 'Wed', hours: 5.5, rate: 85 },
  { label: 'Thu', hours: 3.8, rate: 70 },
  { label: 'Fri', hours: 7.0, rate: 95 },
  { label: 'Sat', hours: 2.5, rate: 90 },
  { label: 'Sun', hours: 1.8, rate: 85 },
]

const monthlyFocusData = [
  { label: 'Week 1', hours: 22, rate: 82 },
  { label: 'Week 2', hours: 28, rate: 88 },
  { label: 'Week 3', hours: 24, rate: 85 },
  { label: 'Week 4', hours: 32, rate: 92 },
]

export const AnalyticsPage: React.FC = () => {
  // Weekly vs Monthly Report State
  const [reportRange, setReportRange] = useState<'weekly' | 'monthly'>('weekly')

  const chartData = reportRange === 'weekly' ? weeklyFocusData : monthlyFocusData

  // Mock Heatmap: hour-by-hour (24h) deep work distribution (7 days)
  const heatmapRows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const heatmapCols = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`) // 8 AM to 8 PM

  const getHeatmapColor = (rowIdx: number, colIdx: number) => {
    // Make up a pattern
    const val = (rowIdx + colIdx) % 5
    if (val === 4) return 'bg-emerald-600 dark:bg-emerald-700'
    if (val === 3) return 'bg-emerald-500/80 dark:bg-emerald-500/50'
    if (val === 2) return 'bg-emerald-500/40 dark:bg-emerald-500/20'
    return 'bg-secondary/40'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Productivity statistics, deep work hours, and coaching telemetry.</p>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
          <button
            onClick={() => setReportRange('weekly')}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              reportRange === 'weekly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportRange('monthly')}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              reportRange === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {/* 1. Score Overview widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Productivity Score gauge */}
        <Card className="relative overflow-hidden bg-primary/5 border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">AI Productivity Score</span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-display font-black text-3xl">92%</span>
              <span className="text-xs font-bold text-emerald-500">+4% this period</span>
            </div>
            <Progress value={92} className="h-2" color="bg-primary" />
          </CardContent>
        </Card>

        {/* Focus Hours summary */}
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Focus Hours</span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl">
                {reportRange === 'weekly' ? '36.5h' : '106.0h'}
              </span>
              <Badge variant="success" className="text-[10px]">+2.3h</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Total deep focus Pomodoro hours locked.</p>
          </CardContent>
        </Card>

        {/* Task Completion Rate summary */}
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Completion Rate</span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl">88%</span>
              <Badge variant="success" className="text-[10px]">+6%</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Ratio of created vs completed tasks.</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Plot: Focus Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" /> Focus Hours Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="hours" stroke="var(--color-primary, hsl(var(--primary)))" fillOpacity={1} fill="url(#hoursGrad)" strokeWidth={2} name="Focus Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Plot: Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> Tasks Completion Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="rate" fill="var(--color-primary, hsl(var(--primary)))" radius={[4, 4, 0, 0]} name="Completion Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Deep work hour-by-hour heatmap & AI Insights cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap block grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Daily Deep Work Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header Cols */}
              <div className="grid grid-cols-13 gap-1 mb-2 text-center text-[9px] font-bold text-muted-foreground uppercase">
                <div>Day</div>
                {heatmapCols.map((col, idx) => (
                  <div key={idx}>{col}</div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {heatmapRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-13 gap-1 items-center">
                    <div className="text-[10px] font-bold text-muted-foreground">{row}</div>
                    {heatmapCols.map((_, colIdx) => (
                      <div
                        key={colIdx}
                        className={cn('h-6 rounded-md transition-all duration-300', getHeatmapColor(rowIdx, colIdx))}
                        title="Work block duration details"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insight Coaching cards */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              AI Telemetry Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 text-left space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 fill-current" /> High Efficiency Alert
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your focus peaks between <span className="font-semibold text-foreground">9:00 AM - 11:30 AM</span>. Slotted database indexing and complex algorithms in this window yielded a 95% completion rate.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 text-left space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Lightbulb className="h-3.5 w-3.5 fill-current" /> Rest Suggestion
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Stamina drops significantly after 90m deep work sessions on Thursdays. Consider adding a 10m walking break to restore cognitive capacity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage
