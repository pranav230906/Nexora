import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Video,
  Plus,
  RefreshCw,
  CheckCircle,
  Share2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useToastStore } from '@/store/useToastStore'
import { useGoogleCalendarStore } from '@/store/useGoogleCalendarStore'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'
import { cn } from '@/utils/cn'

export const CalendarPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const {
    isConnected,
    isSyncing,
    meetings,
    fetchConnectionStatus,
    fetchMeetings,
    syncTasks,
    exchangeAuthCode,
    disconnectCalendar
  } = useGoogleCalendarStore()

  const { tasks, fetchTasks } = useTaskStore()

  // Calendar Perspectives Tabs State
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'day' | 'agenda'>('month')

  useEffect(() => {
    fetchTasks()
    fetchConnectionStatus()
    fetchMeetings()

    // Capture OAuth Authorization Code from URL Redirect
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const triggerOAuthExchange = async () => {
        try {
          const redirectUri = `${window.location.origin}/calendar`
          await exchangeAuthCode(code, redirectUri)
          addToast({
            type: 'success',
            title: 'Calendar Linked!',
            message: 'Successfully linked your Google Calendar.'
          })
          // Clean up url parameters
          window.history.replaceState(null, '', window.location.pathname)
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Link Failed',
            message: 'Failed to complete OAuth handshake.'
          })
        }
      }
      triggerOAuthExchange()
    }
  }, [fetchTasks, fetchConnectionStatus, fetchMeetings, exchangeAuthCode])

  const handleSyncGoogle = async () => {
    if (!isConnected) {
      // Redirect to Google Consent screen
      const client_id = "1023743274517-n5q4hviq6h0qdhh1nf3l7i1tmiv9h7tb.apps.googleusercontent.com"
      const redirect_uri = `${window.location.origin}/calendar`
      const scope = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      window.location.href = url
    } else {
      // Trigger a manual task synchronization
      await syncTasks()
      addToast({
        type: 'success',
        title: 'Synchronized!',
        message: 'Backend tasks successfully synced to your Google Calendar.'
      })
    }
  }

  // Combine Tasks & Meetings for view renders
  const getCalendarEvents = () => {
    const events: Array<{
      id: string
      title: string
      date: string
      time: string
      type: 'task' | 'meeting'
      link?: string
    }> = []

    // 1. Map backend tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate) {
        events.push({
          id: `t-${task.id}`,
          title: task.title,
          date: task.dueDate,
          time: 'Due Date',
          type: 'task'
        })
      }
    })

    // 2. Map meetings from Google Calendar
    meetings.forEach((meet) => {
      if (meet.startTime) {
        const datePart = meet.startTime.split('T')[0]
        const timePart = meet.startTime.includes('T')
          ? meet.startTime.split('T')[1].substring(0, 5)
          : 'All Day'

        events.push({
          id: `m-${meet.id}`,
          title: meet.title,
          date: datePart,
          time: timePart,
          type: 'meeting',
          link: meet.htmlLink
        })
      }
    })

    return events
  }

  const allEvents = getCalendarEvents()

  const getEventBg = (type: 'task' | 'meeting') => {
    if (type === 'meeting') {
      return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    }
    return 'bg-primary/5 border-primary/20 text-primary'
  }

  // View renderer: Month
  const renderMonthView = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1)
    return (
      <div className="grid grid-cols-7 gap-1.5 border border-border bg-card p-3 rounded-lg animate-in fade-in duration-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-bold text-xs py-1.5 text-muted-foreground uppercase">{day}</div>
        ))}
        {days.map((day) => {
          const dateStr = `2026-06-${day.toString().padStart(2, '0')}`
          const dayEvents = allEvents.filter((e) => e.date === dateStr)

          return (
            <div key={day} className="min-h-[100px] border border-border/40 bg-secondary/5 rounded p-2 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground">{day}</span>
              <div className="space-y-1 mt-2">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'text-[9px] font-bold p-1 rounded border truncate cursor-pointer leading-none',
                      getEventBg(ev.type)
                    )}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // View renderer: Week
  const renderWeekView = () => {
    const daysOfWeek = [
      { label: 'Mon 25', date: '2026-06-25' },
      { label: 'Tue 26', date: '2026-06-26' },
      { label: 'Wed 27', date: '2026-06-27' },
      { label: 'Thu 28', date: '2026-06-28' },
      { label: 'Fri 29', date: '2026-06-29' },
      { label: 'Sat 30', date: '2026-06-30' },
    ]

    return (
      <div className="grid grid-cols-6 gap-2 border border-border bg-card p-4 rounded-lg animate-in fade-in duration-200 overflow-x-auto min-w-[700px]">
        {daysOfWeek.map((day) => {
          const dayEvents = allEvents.filter((ev) => ev.date === day.date)
          return (
            <div key={day.date} className="space-y-3 min-h-[400px] border-r border-border/40 last:border-0 pr-2">
              <div className="text-center font-bold text-xs border-b border-border pb-2 text-muted-foreground uppercase">{day.label}</div>
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'p-2.5 rounded-lg border text-xs font-semibold space-y-1.5 shadow-sm',
                      getEventBg(ev.type)
                    )}
                  >
                    <div className="truncate">{ev.title}</div>
                    <span className="text-[10px] opacity-80 block">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // View renderer: Day
  const renderDayView = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dayEvents = allEvents.filter((ev) => ev.date === todayStr)

    return (
      <div className="border border-border bg-card p-4 rounded-lg space-y-4 animate-in fade-in duration-200 max-w-2xl mx-auto">
        <h3 className="font-display font-semibold text-sm border-b border-border pb-2 text-muted-foreground uppercase">Today</h3>
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">No events planned today.</div>
          ) : (
            dayEvents.map((ev) => (
              <div
                key={ev.id}
                className={cn(
                  'p-4 rounded-xl border flex items-center justify-between shadow-sm',
                  getEventBg(ev.type)
                )}
              >
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">{ev.type}</span>
                  <h4 className="text-sm font-bold">{ev.title}</h4>
                  <span className="text-xs opacity-80 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ev.time}</span>
                </div>
                {ev.link && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(ev.link, '_blank')}
                    className="h-8 border-current text-current hover:bg-current/10"
                    leftIcon={<Video className="h-3.5 w-3.5" />}
                  >
                    Join Meet
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // View renderer: Agenda
  const renderAgendaView = () => (
    <div className="border border-border bg-card p-4 rounded-lg divide-y divide-border/60 max-w-2xl mx-auto animate-in fade-in duration-200">
      {allEvents.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No upcoming schedules.</p>
      ) : (
        allEvents.map((ev) => (
          <div key={ev.id} className="py-4 flex gap-4 items-start first:pt-0 last:pb-0">
            <div className="w-24 text-xs font-bold text-muted-foreground">{ev.date}</div>
            <div className="flex-grow space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">{ev.title}</h4>
                <Badge variant={ev.type === 'meeting' ? 'primary' : 'outline'} className="text-[9px]">{ev.type}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ev.time}</span>
                {ev.link && <span className="flex items-center gap-1 text-primary cursor-pointer" onClick={() => window.open(ev.link, '_blank')}><Video className="h-3.5 w-3.5" /> Join Meet</span>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-primary" />
            Calendar Hub
          </h1>
          <p className="text-sm text-muted-foreground">Manage schedules, sync accounts, and track meetings.</p>
        </div>

        {/* Sync Actions toolbar */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            className={cn(
              'h-9 px-3 gap-1.5',
              isConnected && 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10'
            )}
            leftIcon={
              isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )
            }
          >
            {isSyncing ? 'Syncing...' : isConnected ? 'Sync Tasks' : 'Link Google Calendar'}
          </Button>
        </div>
      </div>

      {/* Main Page Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Perspective Panels & tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
            {(['month', 'week', 'day', 'agenda'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer capitalize ${
                  activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'month' && renderMonthView()}
            {activeTab === 'week' && renderWeekView()}
            {activeTab === 'day' && renderDayView()}
            {activeTab === 'agenda' && renderAgendaView()}
          </div>
        </div>

        {/* Right Column: Upcoming Events List */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {!isConnected ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-3">Link your Google Calendar to view upcoming meetings.</p>
                  <Button size="sm" onClick={handleSyncGoogle} leftIcon={<Share2 className="h-3 w-3" />}>Link Calendar</Button>
                </div>
              ) : meetings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No upcoming meetings found.</p>
              ) : (
                meetings.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-border bg-secondary/15 flex flex-col gap-2 text-left animate-in fade-in">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Google Event</span>
                    <h4 className="text-xs font-bold text-foreground leading-normal">{ev.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{ev.startTime.split('T')[0]} • {ev.startTime.includes('T') ? ev.startTime.split('T')[1].substring(0, 5) : 'All Day'}</span>
                    {ev.htmlLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(ev.htmlLink, '_blank')}
                        className="text-[10px] h-7 w-fit border-border mt-1"
                        leftIcon={<Video className="h-3 w-3" />}
                      >
                        Open Calendar
                      </Button>
                    )}
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

export default CalendarPage
