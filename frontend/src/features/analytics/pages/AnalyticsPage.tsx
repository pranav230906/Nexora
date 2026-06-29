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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

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
      // Clear inputs
      setStartDate('')
      setEndDate('')
      // Poll reports list after 5 seconds
      setTimeout(() => fetchReports(), 5000)
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Queue Failed',
        message: 'Failed to trigger report generation.',
      })
    }
  }

  // Fallbacks if Time Distribution is empty
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Productivity statistics, deep work hours, and coaching telemetry.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchDashboard()
              fetchReports()
            }}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Sync Telemetry
          </Button>
        </div>
      </div>

      {/* 1. Score Overview widgets row */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">Syncing metrics data...</div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Productivity Score gauge */}
          <Card className="relative overflow-hidden bg-primary/5 border-primary/20 text-left">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Productivity Score</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-black text-3xl">{dashboard.productivity_score}%</span>
                <span className="text-xs font-bold text-primary">Efficiency Target</span>
              </div>
              <Progress value={dashboard.productivity_score} className="h-2" color="bg-primary" />
            </CardContent>
          </Card>

          {/* Focus Hours summary */}
          <Card className="text-left">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Focus Duration</span>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.focus_hours}h</span>
                <Badge variant="primary" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Total deep focus hours logged.</p>
            </CardContent>
          </Card>

          {/* Task Completion Rate summary */}
          <Card className="text-left">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Completion Rate</span>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.task_completion_rate}%</span>
                <Badge variant="success" className="text-[10px]">Ratio</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Ratio of created vs completed tasks.</p>
            </CardContent>
          </Card>

          {/* Habit Consistency summary */}
          <Card className="text-left">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Habits Consistency</span>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl">{dashboard.habit_consistency}%</span>
                <Badge className="text-[10px] bg-orange-500/10 border-orange-500/20 text-orange-500">Streak</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">Habit completions over 30 days.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground">No telemetry reports generated yet. Add tasks or habits to generate dashboard data.</div>
      )}

      {/* 2. Charts and Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task completion rate by Category / Tag labels */}
        <Card className="lg:col-span-2 text-left">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-primary" /> Task Distribution by Labels
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeDistData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" fill="var(--color-primary, hsl(var(--primary)))" radius={[4, 4, 0, 0]} name="Tasks Weight" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Distribution Pie */}
        <Card className="text-left">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-primary" /> Label Share Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center items-center">
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="label"
                  >
                    {timeDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2 max-h-16 overflow-y-auto">
              {timeDistData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
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
        <Card className="text-left">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Compile Performance Report
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Report Interval</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="WEEKLY">Weekly Performance</option>
                  <option value="MONTHLY">Monthly Performance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={isTriggering}>
                {isTriggering ? 'Compiling AI Telemetry...' : 'Compile Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Performance Reports and Insights list */}
        <Card className="lg:col-span-2 text-left">
          <CardHeader className="border-b border-border/40 pb-3 bg-secondary/5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              AI Coach Performance Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 max-h-[300px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">No compiled reports found. Generate one using the form!</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 rounded-xl border border-border bg-secondary/5 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        {report.report_type} Report
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        {report.start_date} to {report.end_date}
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[9px] uppercase">
                        Score: {report.productivity_score}%
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        Focus: {report.focus_hours.toFixed(1)}h
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 text-left space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Zap className="h-3.5 w-3.5 fill-current" /> AI Coach Feedback & Action Items
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">
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

export default AnalyticsPage
