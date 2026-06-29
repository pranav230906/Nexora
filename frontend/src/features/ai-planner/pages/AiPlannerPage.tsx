import React, { useState, useEffect } from 'react'
import {
  Brain,
  CalendarDays,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { useAiPlannerStore } from '@/store/useAiPlannerStore'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'
import { useGoalHabitStore } from '@/store/useGoalHabitStore'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const AiPlannerPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const {
    dailyPlan,
    chatHistory,
    isPlanning,
    isCoaching,
    generateDailyPlan,
    sendMessageToCoach
  } = useAiPlannerStore()

  const { tasks, fetchTasks } = useTaskStore()
  const { habits, fetchHabits } = useGoalHabitStore()

  // Interactive View Tabs
  const [plannerTab, setPlannerTab] = useState<'daily' | 'weekly'>('daily')

  // Chat window state
  const [promptInput, setPromptInput] = useState('')

  // Plan Actions state
  const [currentPlanState, setCurrentPlanState] = useState<'default' | 'regenerated' | 'accepted' | 'rejected'>('default')

  useEffect(() => {
    fetchTasks()
    fetchHabits()
  }, [fetchTasks, fetchHabits])

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptInput.trim()) return

    const userMsg = promptInput
    setPromptInput('')

    const habitsList = habits.map((h) => `${h.name} (streak: ${h.streak})`)
    const streaksData = habits.map((h) => `${h.name}: ${h.streak} days`).join(', ')

    await sendMessageToCoach(userMsg, habitsList, streaksData)
  }

  const handleRegenerate = async () => {
    const taskTitles = tasks.map((t) => `${t.title} (${t.priority} priority)`)
    await generateDailyPlan(taskTitles, [])
    setCurrentPlanState('regenerated')
    addToast({
      type: 'info',
      title: 'Plan Regenerated',
      message: 'Proposed schedule updated according to active tasks.',
    })
  }

  const handleAccept = () => {
    setCurrentPlanState('accepted')
    addToast({
      type: 'success',
      title: 'Plan Accepted!',
      message: 'AI Planner proposal saved to active calendar.',
    })
  }

  const handleReject = () => {
    setCurrentPlanState('rejected')
    addToast({
      type: 'error',
      title: 'Plan Rejected',
      message: 'Proposed calendar changes discarded.',
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Brain className="h-7 w-7 text-primary animate-pulse" />
            AI Planner
          </h1>
          <p className="text-sm text-muted-foreground">Automated time-blocking schedules and optimization coach.</p>
        </div>

        {/* Plan Actions toolbar */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPlanning}
            className="h-9 px-3 gap-1.5"
            leftIcon={<RefreshCw className={isPlanning ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
          >
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="h-9 px-3 gap-1.5 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10"
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            className="h-9 px-3 gap-1.5"
            leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
          >
            Accept Plan
          </Button>
        </div>
      </div>

      {/* Main planner perspective view layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Schedule Time Blocking grid & tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex gap-1 bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setPlannerTab('daily')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                  plannerTab === 'daily' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Proposed Plan
              </button>
              <button
                onClick={() => setPlannerTab('weekly')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                  plannerTab === 'weekly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Backlog Tasks
              </button>
            </div>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Energy Schedule
            </span>
          </div>

          {/* Render Daily Time-Blocking */}
          {plannerTab === 'daily' && (
            <div className="space-y-4 text-left">
              {isPlanning ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">AI is scheduling and prioritizing tasks...</p>
                </div>
              ) : dailyPlan ? (
                <Card className="p-6 overflow-x-auto">
                  <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-left space-y-4
                    [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                    [&_th]:border-b [&_th]:border-border [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:bg-secondary/20
                    [&_td]:border-b [&_td]:border-border/60 [&_td]:p-3 [&_td]:text-left
                    [&_tr:hover]:bg-secondary/10 [&_tr]:transition-colors
                    [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-primary
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-2
                    [&_li]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-semibold">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {dailyPlan}
                    </ReactMarkdown>
                  </div>
                </Card>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <p className="text-xs text-muted-foreground">Ready to optimize your schedule with AI?</p>
                  <Button variant="primary" size="sm" onClick={handleRegenerate} leftIcon={<Brain className="h-4 w-4" />}>
                    Generate Daily Plan
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Render Weekly Focus planner */}
          {plannerTab === 'weekly' && (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-10 text-center">No tasks in your backlog right now.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-border bg-card flex items-center justify-between"
                  >
                    <div className="space-y-1 text-left">
                      <h4 className="text-sm font-bold text-foreground">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">{task.description || 'No description'}</p>
                    </div>
                    <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'outline'}>
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Explanations, tips, and chat window */}
        <div className="space-y-6">
          {/* Why Proposed plan? explanations card */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Schedule Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-muted-foreground leading-relaxed space-y-2 text-left">
              <p>
                • Groups high-priority tasks in early time-blocks.
              </p>
              <p>
                • Organizes tasks according to standard cognitive energy peaks.
              </p>
            </CardContent>
          </Card>

          {/* Productivity Tips Card */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                Productivity Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-muted-foreground leading-relaxed space-y-2 text-left">
              <p>
                • Keep notifications muted during deep work coding blocks.
              </p>
              <p>
                • Use habit streaks to build consistent daily momentum.
              </p>
            </CardContent>
          </Card>

          {/* Chat interface */}
          <Card className="flex flex-col h-96">
            <CardHeader className="border-b border-border/40 pb-3 bg-secondary/15">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Ask AI Assistant
              </CardTitle>
            </CardHeader>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-normal text-left ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground border border-border'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCoaching && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-normal bg-secondary text-muted-foreground border border-border animate-pulse">
                    Typing...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendPrompt} className="p-3 border-t border-border flex gap-2 bg-secondary/5">
              <input
                type="text"
                placeholder="Suggest schedule tweaks..."
                value={promptInput}
                disabled={isCoaching}
                onChange={(e) => setPromptInput(e.target.value)}
                className="flex-grow h-9 px-3 py-1.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0" disabled={isCoaching}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AiPlannerPage
