import React, { useState } from 'react'
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
import { cn } from '@/utils/cn'

// Dummy Event Data
interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time: string
  type: 'meeting' | 'deep_work' | 'sync' | 'break'
  link?: string
  guests?: string[]
}

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Advisors Pitch Deck Review',
    date: '2026-06-29',
    time: '01:00 PM - 02:00 PM',
    type: 'meeting',
    link: 'https://meet.google.com/abc-defg-hij',
    guests: ['Pranav S', 'Sarah Miller'],
  },
  {
    id: 'e2',
    title: 'Database index configuration window',
    date: '2026-06-28',
    time: '09:00 AM - 10:30 AM',
    type: 'deep_work',
    guests: [],
  },
  {
    id: 'e3',
    title: 'Marketing Strategy Sync',
    date: '2026-06-30',
    time: '11:00 AM - 12:00 PM',
    type: 'sync',
    link: 'https://meet.google.com/xyz-uvwx-yza',
    guests: ['Alexander T', 'Pranav S'],
  },
  {
    id: 'e4',
    title: 'Cognitive breather & coffee break',
    date: '2026-06-28',
    time: '10:30 AM - 11:00 AM',
    type: 'break',
  },
]

export const CalendarPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Calendar Perspectives Tabs State
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'day' | 'agenda'>('month')

  // Google Calendar Integration Mock State
  const [googleConnected, setGoogleConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncGoogle = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setGoogleConnected(!googleConnected)
      setIsSyncing(false)
      addToast({
        type: 'success',
        title: googleConnected ? 'Google Account Disconnected' : 'Google Calendar Synced!',
        message: googleConnected
          ? 'Google account references removed.'
          : 'Successfully synced 4 external calendar events.',
      })
    }, 1500)
  }

  const getEventBg = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
      case 'deep_work':
        return 'bg-primary/5 border-primary/20 text-primary'
      case 'sync':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
      case 'break':
      default:
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
    }
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'primary'
      case 'deep_work':
        return 'outline'
      case 'sync':
        return 'success'
      case 'break':
      default:
        return 'warning'
    }
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
          const dayEvents = mockEvents.filter((e) => e.date === dateStr)

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
          const dayEvents = mockEvents.filter((ev) => ev.date === day.date)
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
                    <span className="text-[10px] opacity-80 block">{ev.time.split(' ')[0]}</span>
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
    const dayEvents = mockEvents.filter((ev) => ev.date === '2026-06-28')

    return (
      <div className="border border-border bg-card p-4 rounded-lg space-y-4 animate-in fade-in duration-200 max-w-2xl mx-auto">
        <h3 className="font-display font-semibold text-sm border-b border-border pb-2 text-muted-foreground uppercase">Sunday, June 28</h3>
        <div className="space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">No events planned.</div>
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
      {mockEvents.map((ev) => (
        <div key={ev.id} className="py-4 flex gap-4 items-start first:pt-0 last:pb-0">
          <div className="w-24 text-xs font-bold text-muted-foreground">{ev.date}</div>
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{ev.title}</h4>
              <Badge variant={getEventBadge(ev.type)} className="text-[9px]">{ev.type}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ev.time}</span>
              {ev.link && <span className="flex items-center gap-1 text-primary"><Video className="h-3.5 w-3.5" /> Join Meet</span>}
            </div>
            {ev.guests && ev.guests.length > 0 && (
              <div className="flex gap-1.5 pt-1">
                {ev.guests.map((g, idx) => (
                  <Avatar key={idx} fallback={g} size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
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
              googleConnected && 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10'
            )}
            leftIcon={
              isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : googleConnected ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )
            }
          >
            {isSyncing ? 'Syncing...' : googleConnected ? 'Google Connected' : 'Sync Google Calendar'}
          </Button>
          <Button variant="primary" size="sm" className="h-9 px-3 gap-1.5" leftIcon={<Plus className="h-4 w-4" />}>
            New Event
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
              {mockEvents
                .filter((ev) => ev.type === 'meeting' || ev.type === 'sync')
                .map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-border bg-secondary/15 flex flex-col gap-2 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{ev.type}</span>
                    <h4 className="text-xs font-bold text-foreground leading-normal">{ev.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{ev.date} • {ev.time.split(' ')[0]}</span>
                    {ev.link && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(ev.link, '_blank')}
                        className="text-[10px] h-7 w-fit border-border mt-1"
                        leftIcon={<Video className="h-3 w-3" />}
                      >
                        Join Meet
                      </Button>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
