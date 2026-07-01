import React, { useEffect, useState } from 'react'
import {
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Lightbulb,
  Activity,
  Calendar,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { cn } from '@/utils/cn'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const AnalyticsPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const {
    dashboard,
    reports,
    isLoading,
    isTriggering,
    fetchDashboard,
    fetchReports,
    triggerReport,
  } = useAnalyticsStore()

  // Manual Trigger Range State
  const [reportType, setReportType] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [startDate, setStartDate] = useState('')
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchDashboard()
    fetchReports()
  }, [fetchDashboard, fetchReports])

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      addToast({
        type: 'warning',
        title: 'Missing Dates',
        message: 'Please provide both start and end dates.',
      })
      return
    }

    try {
      await triggerReport(reportType, startDate, endDate)
      addToast({
        type: 'success',
        title: 'Report Queued',
        message: `Your ${reportType.toLowerCase()} report task is now compiling with AI insights. Refresh in a few seconds!`,
      })
      setStartDate('')
      setEndDate('')
      setTimeout(() => fetchReports(), 5000)
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Queue Failed',
        message: 'Failed to trigger report generation.',
      })
    }
  }

  const timeDistData = dashboard?.time_distribution?.length
    ? dashboard.time_distribution
    : [
        { label: 'Engineering', value: 5 },
        { label: 'Design', value: 3 },
        { label: 'Review', value: 2 },
      ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-primary animate-pulse" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Productivity statistics, deep work hours, and coaching telemetry.</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchDashboard()
            fetchReports()
          }}
          className="btn-bounce h-9 gap-1.5"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Sync Telemetry
        </Button>
      </div>

      {/* 1. Score Overview widgets row */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Syncing metrics data...</p>
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Productivity Score gauge */}
          <Card className="relative overflow-hidden bg-primary/5 border-primary/20 text-left shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">Productivity Score</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-black text-3xl text-primary">{dashboard.productivity_score}%</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Target</span>
              </div>
              <Progress value={dashboard.productivity_score} className="h-2 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
            </CardContent>
          </Card>

          {/* Focus Hours summary */}
          <Card className="text-left shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/5">
            <CardHeader className="pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">Focus Duration</span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.focus_hours}h</span>
                <Badge variant="primary" className="text-[9px] font-black uppercase">Active</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">Total deep focus hours logged.</p>
            </CardContent>
          </Card>

          {/* Task Completion Rate summary */}
          <Card className="text-left shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/5">
            <CardHeader className="pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">Completion Rate</span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.task_completion_rate}%</span>
                <Badge variant="success" className="text-[9px] font-black uppercase">Ratio</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">Ratio of created vs completed tasks.</p>
            </CardContent>
          </Card>

          {/* Habit Consistency summary */}
          <Card className="text-left shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/5">
            <CardHeader className="pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">Habits Consistency</span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.habit_consistency}%</span>
                <Badge className="text-[9px] font-black uppercase bg-orange-500/10 border-orange-500/20 text-orange-500">Streak</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">Habit completions over 30 days.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground">No telemetry reports generated yet. Add tasks or habits to generate dashboard data.</div>
      )}

      {/* 2. Charts and Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task completion rate by Category / Tag labels */}
        <Card className="lg:col-span-2 text-left shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" /> Task Distribution by Labels
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeDistData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263, 80%, 65%)" />
                    <stop offset="100%" stopColor="hsl(263, 80%, 45%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="color-mix(in srgb, hsl(var(--border)) 70%, transparent)" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} dx={-8} />
                <RechartsTooltip
                  cursor={false}
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
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Tasks Weight" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Distribution Pie as a premium Donut */}
        <Card className="text-left shadow-lg relative">
          <CardHeader>
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" /> Label Share Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center items-center relative">
            <div className="w-full h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="shadow3d" x="-20%" y="-20%" width="145%" height="145%">
                      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
                    </filter>
                    <linearGradient id="pieGrad-0" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c7d2fe" />
                      <stop offset="40%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#312e81" />
                    </linearGradient>
                    <linearGradient id="pieGrad-1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a7f3d0" />
                      <stop offset="40%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#064e3b" />
                    </linearGradient>
                    <linearGradient id="pieGrad-2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="40%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="pieGrad-3" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fecaca" />
                      <stop offset="40%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </linearGradient>
                    <linearGradient id="pieGrad-4" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ddd6fe" />
                      <stop offset="40%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#4c1d95" />
                    </linearGradient>
                    <linearGradient id="pieGrad-5" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbcfe8" />
                      <stop offset="40%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#831843" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={timeDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="label"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={1.5}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {timeDistData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#pieGrad-${index % COLORS.length})`} 
                        style={{ filter: 'url(#shadow3d)', outline: 'none', transition: 'all 0.2s ease-in-out' }} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: 'color-mix(in srgb, hsl(var(--card)) 85%, transparent)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid color-mix(in srgb, hsl(var(--border)) 80%, transparent)',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Donut Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all duration-200">
                  {activePieIndex !== null ? timeDistData[activePieIndex].label : 'Total Tasks'}
                </span>
                <span className="text-2xl font-black font-display text-foreground leading-none mt-1 transition-all duration-200">
                  {activePieIndex !== null ? timeDistData[activePieIndex].value : timeDistData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center pt-2 max-h-16 overflow-y-auto">
              {timeDistData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {entry.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. AI Reports & Manual Compiler Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compiler Form */}
        <Card className="text-left shadow-lg">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Compile Performance Report
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Report Interval</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="WEEKLY">Weekly Performance</option>
                  <option value="MONTHLY">Monthly Performance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full btn-bounce shadow-lg shadow-primary/20" disabled={isTriggering}>
                {isTriggering ? 'Compiling AI Telemetry...' : 'Compile Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Performance Reports and Insights list */}
        <Card className="lg:col-span-2 text-left shadow-lg">
          <CardHeader className="border-b border-border/40 pb-3 bg-secondary/5">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              AI Coach Performance Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 max-h-[300px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center font-semibold">No compiled reports found. Generate one using the form!</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 rounded-2xl border border-border bg-secondary/5 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        {report.report_type} Report
                      </span>
                      <h4 className="text-xs font-black text-foreground">
                        {report.start_date} to {report.end_date}
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[9px] font-black uppercase">
                        Score: {report.productivity_score}%
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] font-black uppercase">
                        Focus: {report.focus_hours.toFixed(1)}h
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 text-left space-y-1">
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
                      <Zap className="h-3.5 w-3.5 fill-current animate-bounce" /> AI Coach Feedback & Action Items
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                      {report.ai_insights}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loader mock icon
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default AnalyticsPage
