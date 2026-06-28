import React, { useState } from 'react'
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

// Mock Schedule Data
const initialDailySchedule = [
  { time: '09:00 AM - 10:30 AM', task: 'Optimize database indexes', duration: '90m', category: 'Deep Work', priority: 'urgent' },
  { time: '11:00 AM - 12:00 PM', task: 'Review API responses', duration: '60m', category: 'Engineering', priority: 'medium' },
  { time: '01:00 PM - 02:30 PM', task: 'Complete pitch deck draft', duration: '90m', category: 'Business', priority: 'high' },
  { time: '03:00 PM - 04:00 PM', task: 'Email correspondence', duration: '60m', category: 'Admin', priority: 'low' },
]

const regeneratedDailySchedule = [
  { time: '09:00 AM - 10:30 AM', task: 'Complete pitch deck draft', duration: '90m', category: 'Business', priority: 'high' },
  { time: '11:00 AM - 12:00 PM', task: 'Optimize database indexes', duration: '90m', category: 'Deep Work', priority: 'urgent' },
  { time: '01:00 PM - 02:00 PM', task: 'Review API responses', duration: '60m', category: 'Engineering', priority: 'medium' },
  { time: '03:00 PM - 04:00 PM', task: 'Email correspondence', duration: '60m', category: 'Admin', priority: 'low' },
]

const initialWeeklySchedule = [
  { day: 'Monday', focus: 'Database Indexes & API Architecture', duration: '4h Deep Work' },
  { day: 'Tuesday', focus: 'Business Pitch deck & Financial Outline', duration: '3.5h Deep Work' },
  { day: 'Wednesday', focus: 'Frontend Layouts & Component Design', duration: '5h Deep Work' },
  { day: 'Thursday', focus: 'Marketing Strategies & Team Syncs', duration: '3h Admin' },
  { day: 'Friday', focus: 'Diagnostic checks & Deployments', duration: '4h Deep Work' },
]

export const AiPlannerPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Interactive View Tabs
  const [plannerTab, setPlannerTab] = useState<'daily' | 'weekly'>('daily')

  // Chat window state
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: "I've structured your day to place deep-work tasks during peak morning energy, followed by communications in the afternoon. How does it look?",
    },
  ])
  const [promptInput, setPromptInput] = useState('')

  // Plan Actions state
  const [currentPlanState, setCurrentPlanState] = useState<'default' | 'regenerated' | 'accepted' | 'rejected'>('default')
  const [isRegenerating, setIsRegenerating] = useState(false)

  const schedule = currentPlanState === 'regenerated' ? regeneratedDailySchedule : initialDailySchedule

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptInput.trim()) return

    const userMsg = promptInput
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setPromptInput('')

    // Simulated AI schedule change
    setTimeout(() => {
      let reply = "Understood. I've re-prioritized your pitch deck draft to 9:00 AM as requested. Click 'Regenerate' to preview the updated schedule."
      if (userMsg.toLowerCase().includes('database') || userMsg.toLowerCase().includes('index')) {
        reply = "Acknowledged. Keeping your database indexes optimization in the morning window to optimize server traffic."
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }])
    }, 1000)
  }

  const handleRegenerate = () => {
    setIsRegenerating(true)
    setTimeout(() => {
      setCurrentPlanState('regenerated')
      setIsRegenerating(false)
      addToast({
        type: 'info',
        title: 'Plan Regenerated',
        message: 'Proposed schedule updated according to preferences.',
      })
    }, 1200)
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
            disabled={isRegenerating}
            className="h-9 px-3 gap-1.5"
            leftIcon={<RefreshCw className={isRegenerating ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
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
                Daily Schedule
              </button>
              <button
                onClick={() => setPlannerTab('weekly')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                  plannerTab === 'weekly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Weekly Focus
              </button>
            </div>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Today: June 28
            </span>
          </div>

          {/* Render Daily Time-Blocking */}
          {plannerTab === 'daily' && (
            <div className="space-y-4">
              {schedule.map((slot, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-start"
                >
                  <div className="w-36 text-xs text-muted-foreground font-bold pt-2">{slot.time}</div>
                  <div className="flex-grow p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{slot.task}</h4>
                        <Badge variant="secondary" className="text-[9px]">{slot.category}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Duration: {slot.duration}</span>
                    </div>
                    <Badge variant={slot.priority === 'urgent' ? 'destructive' : slot.priority === 'high' ? 'warning' : 'outline'}>
                      {slot.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Render Weekly Focus planner */}
          {plannerTab === 'weekly' && (
            <div className="space-y-3">
              {initialWeeklySchedule.map((slot, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-border bg-card flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">{slot.day}</h4>
                    <p className="text-xs text-muted-foreground">{slot.focus}</p>
                  </div>
                  <Badge variant="outline" className="h-6">{slot.duration}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Explanations, tips, and chat window */}
        <div className="space-y-6">
          {/* Why This proposed plan? explanations card */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Priority Explanations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                • Grouped <span className="font-semibold text-foreground">deep work coding blocks</span> in the morning window when cognitive stamina peaks.
              </p>
              <p>
                • Slotted communication tasks right before lunch when cognitive reserves drop.
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
            <CardContent className="pt-3 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                • Use a Pomodoro structure for index optimization tasks.
              </p>
              <p>
                • Block desktop alerts during slide preparation deep work.
              </p>
            </CardContent>
          </Card>

          {/* Beautiful chat interface */}
          <Card className="flex flex-col h-96">
            <CardHeader className="border-b border-border/40 pb-3 bg-secondary/15">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Ask AI Assistant
              </CardTitle>
            </CardHeader>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-normal ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground border border-border'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendPrompt} className="p-3 border-t border-border flex gap-2 bg-secondary/5">
              <input
                type="text"
                placeholder="Suggest schedule tweaks..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="flex-grow h-9 px-3 py-1.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0">
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
