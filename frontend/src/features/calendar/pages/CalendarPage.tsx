import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Video,
  Plus,
  RefreshCw,
  CheckCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CalendarDays,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
  } = useGoogleCalendarStore()

  const { tasks, fetchTasks } = useTaskStore()

  // Calendar Perspectives Tabs State
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  
  // Date State for Navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Selected event for interactive details drawer
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  // Track slide direction for transition animations
  const [slideDirection, setSlideDirection] = useState<number>(0)

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
            title: 'Calendar Linked! 🎉',
            message: 'Successfully linked your Google Calendar.'
          })
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
      const client_id = "1023743274517-n5q4hviq6h0qdhh1nf3l7i1tmiv9h7tb.apps.googleusercontent.com"
      const redirect_uri = `${window.location.origin}/calendar`
      const scope = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      window.location.href = url
    } else {
      await syncTasks()
      addToast({
        type: 'success',
        title: 'Synchronized! 🔄',
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
      priority?: string
    }> = []

    tasks.forEach((task) => {
      if (task.dueDate) {
        events.push({
          id: `t-${task.id}`,
          title: task.title,
          date: task.dueDate.split('T')[0],
          time: task.dueDate.includes('T') ? task.dueDate.split('T')[1].substring(0, 5) : 'Due Date',
          type: 'task',
          priority: task.priority
        })
      }
    })

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

  // Classify future events starting from today's date
  const todayStr = new Date().toISOString().split('T')[0]
  const futureTasks = allEvents
    .filter((e) => e.type === 'task' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
  const futureMeetings = allEvents
    .filter((e) => e.type === 'meeting' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  const getEventBg = (type: 'task' | 'meeting') => {
    if (type === 'meeting') {
      return 'bg-violet-500/10 border-violet-500/20 text-violet-500 hover:bg-violet-500/20'
    }
    return 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
  }

  // Navigation Handlers with animation direction set
  const handlePrev = () => {
    setSlideDirection(-1)
    if (activeTab === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else if (activeTab === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
    }
  }

  const handleNext = () => {
    setSlideDirection(1)
    if (activeTab === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (activeTab === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  const handleToday = () => {
    setSlideDirection(0)
    setCurrentDate(new Date())
  }

  // Animation variants for smooth sliding calendar transitions
  const calendarVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 40 : direction < 0 ? -40 : 0,
      y: direction === 0 ? 10 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' as const },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -40 : direction < 0 ? 40 : 0,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    }),
  }

  // View renderer: Month
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1
    const totalDays = new Date(year, month + 1, 0).getDate()
    const prevTotalDays = new Date(year, month, 0).getDate()

    const cells: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = prevTotalDays - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      cells.push({
        day: prevDay,
        dateStr: `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`,
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        day: i,
        dateStr: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
        isCurrentMonth: true,
      })
    }

    let nextMonthDay = 1
    while (cells.length < 42) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      cells.push({
        day: nextMonthDay,
        dateStr: `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${nextMonthDay.toString().padStart(2, '0')}`,
        isCurrentMonth: false,
      })
      nextMonthDay++
    }

    return (
      <div className="grid grid-cols-7 gap-2 border border-border bg-card p-4 rounded-2xl shadow-lg">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-black text-xs py-2 text-muted-foreground uppercase tracking-wider">{day}</div>
        ))}
        {cells.map(({ day, dateStr, isCurrentMonth }) => {
          const dayEvents = allEvents.filter((e) => e.date === dateStr)
          const isToday = new Date().toISOString().split('T')[0] === dateStr

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[110px] border border-border/40 rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200',
                isCurrentMonth ? 'bg-secondary/5' : 'bg-secondary/1 opacity-30',
                isToday && 'border-primary bg-primary/5 ring-1 ring-primary/20'
              )}
            >
              <span className={cn('text-xs font-black', isToday ? 'text-primary' : 'text-muted-foreground')}>
                {day}
              </span>
              <div className="space-y-1.5 mt-2 flex-grow overflow-y-auto max-h-[80px]">
                {dayEvents.map((ev) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={cn(
                      'text-[9px] font-black p-1.5 rounded-lg border truncate cursor-pointer leading-none text-left shadow-sm',
                      getEventBg(ev.type)
                    )}
                    title={`${ev.title} (${ev.time})`}
                  >
                    {ev.title}
                  </motion.div>
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
    const currentDay = currentDate.getDay()
    const offsetToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(currentDate.getTime() + offsetToMonday * 24 * 60 * 60 * 1000)

    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
      return {
        label: day.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
        date: day.toISOString().split('T')[0]
      }
    })

    return (
      <div className="grid grid-cols-7 gap-3 border border-border bg-card p-5 rounded-2xl shadow-lg overflow-x-auto min-w-[700px]">
        {daysOfWeek.map((day) => {
          const dayEvents = allEvents.filter((ev) => ev.date === day.date)
          const isToday = new Date().toISOString().split('T')[0] === day.date

          return (
            <div
              key={day.date}
              className={cn(
                'space-y-3 min-h-[420px] border-r border-border/40 last:border-0 pr-2.5',
                isToday && 'bg-primary/5 rounded-xl border border-primary/20 p-1.5'
              )}
            >
              <div className={cn('text-center font-black text-xs border-b border-border pb-2.5 uppercase tracking-wider', isToday ? 'text-primary' : 'text-muted-foreground')}>
                {day.label}
              </div>
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <motion.div
                    whileHover={{ scale: 1.02, y: -1 }}
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={cn(
                      'p-3 rounded-xl border text-xs font-black space-y-1.5 shadow-sm text-left cursor-pointer transition-all duration-200',
                      getEventBg(ev.type)
                    )}
                  >
                    <div className="truncate font-black">{ev.title}</div>
                    <span className="text-[9px] opacity-80 block font-bold">{ev.time}</span>
                  </motion.div>
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
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayEvents = allEvents.filter((ev) => ev.date === dateStr)

    return (
      <div className="border border-border bg-card p-6 rounded-2xl shadow-lg space-y-5 max-w-2xl mx-auto">
        <h3 className="font-display font-black text-sm border-b border-border pb-3 text-muted-foreground uppercase tracking-widest text-left">
          {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <div className="space-y-3.5">
          {dayEvents.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground font-semibold">No events planned for this day.</div>
          ) : (
            dayEvents.map((ev) => (
              <motion.div
                whileHover={{ scale: 1.01 }}
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className={cn(
                  'p-4.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all',
                  getEventBg(ev.type)
                )}
              >
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-90">{ev.type}</span>
                  <h4 className="text-sm font-black leading-snug">{ev.title}</h4>
                  <span className="text-[10px] opacity-80 flex items-center gap-1 font-bold"><Clock className="h-3.5 w-3.5" /> {ev.time}</span>
                </div>
                {ev.link && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); window.open(ev.link, '_blank'); }}
                    className="h-8 border-current text-current hover:bg-current/10 rounded-lg btn-bounce"
                    leftIcon={<Video className="h-3.5 w-3.5" />}
                  >
                    Join Meet
                  </Button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    )
  }

  // View renderer: Agenda
  const renderAgendaView = () => {
    const targetDateStr = currentDate.toISOString().split('T')[0]
    const upcomingEvents = allEvents.filter((ev) => ev.date >= targetDateStr).sort((a, b) => a.date.localeCompare(b.date))

    return (
      <div className="border border-border bg-card p-6 rounded-2xl shadow-lg divide-y divide-border/60 max-w-2xl mx-auto">
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-12 text-center font-semibold">No upcoming schedules.</p>
        ) : (
          upcomingEvents.map((ev) => (
            <div key={ev.id} className="py-4.5 flex gap-4 items-start first:pt-0 last:pb-0 cursor-pointer" onClick={() => setSelectedEvent(ev)}>
              <div className="w-24 text-xs font-black text-muted-foreground text-left">{ev.date}</div>
              <div className="flex-grow space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-foreground">{ev.title}</h4>
                  <Badge variant={ev.type === 'meeting' ? 'primary' : 'outline'} className="text-[9px] font-black uppercase tracking-wider">{ev.type}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ev.time}</span>
                  {ev.link && <span className="flex items-center gap-1 text-primary cursor-pointer font-bold" onClick={(e) => { e.stopPropagation(); window.open(ev.link, '_blank'); }}><Video className="h-3.5 w-3.5" /> Join Meet</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const getHeaderTitle = () => {
    if (activeTab === 'month') {
      return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
    }
    if (activeTab === 'week') {
      const currentDay = currentDate.getDay()
      const offsetToMonday = currentDay === 0 ? -6 : 1 - currentDay
      const monday = new Date(currentDate.getTime() + offsetToMonday * 24 * 60 * 60 * 1000)
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
      return `${monday.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-primary animate-pulse" />
            Calendar Hub
          </h1>
          <p className="text-sm text-muted-foreground">Manage schedules, sync accounts, and track meetings.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGoogle}
            disabled={isSyncing}
            className={cn(
              'h-9 px-4 gap-1.5 btn-bounce rounded-xl font-bold text-xs',
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
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-1 bg-secondary/80 p-1 rounded-xl w-fit border border-border/60">
              {(['month', 'week', 'day', 'agenda'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                  }}
                  className={`text-xs font-black px-4 py-1.5 rounded-lg transition-all cursor-pointer capitalize btn-bounce ${
                    activeTab === tab ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-foreground mr-1">{getHeaderTitle()}</span>
              <div className="flex bg-secondary/80 p-1 rounded-xl border border-border/60">
                <button
                  onClick={handlePrev}
                  className="p-1 hover:bg-card hover:text-foreground rounded-lg text-muted-foreground transition-all cursor-pointer btn-bounce"
                  title="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-0.5 text-[10px] font-black uppercase tracking-wider hover:bg-card hover:text-foreground rounded-lg text-muted-foreground transition-all cursor-pointer btn-bounce"
                >
                  Today
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-card hover:text-foreground rounded-lg text-muted-foreground transition-all cursor-pointer btn-bounce"
                  title="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Animated calendar layout container */}
          <div className="relative overflow-hidden min-h-[400px]">
            <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
              <motion.div
                key={activeTab + currentDate.toISOString()}
                custom={slideDirection}
                variants={calendarVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full"
              >
                {activeTab === 'month' && renderMonthView()}
                {activeTab === 'week' && renderWeekView()}
                {activeTab === 'day' && renderDayView()}
                {activeTab === 'agenda' && renderAgendaView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Classified Future Tasks/Submissions & Meetings */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-left">
                <CalendarDays className="h-4.5 w-4.5 text-primary" />
                Upcoming Schedule Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6 max-h-[600px] overflow-y-auto">
              
              {/* Classified: Meetings & Events */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40 text-left">
                  <Video className="h-3.5 w-3.5 text-violet-500" /> Meetings & Syncs ({futureMeetings.length})
                </div>
                {futureMeetings.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground font-semibold py-2 text-left">No upcoming meetings synced.</p>
                ) : (
                  futureMeetings.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-3 rounded-xl border border-border bg-secondary/15 flex flex-col gap-1.5 text-left hover:border-violet-500/40 cursor-pointer transition-all duration-200"
                    >
                      <h5 className="text-xs font-bold text-foreground truncate">{ev.title}</h5>
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground font-semibold">
                        <span>{ev.date} • {ev.time}</span>
                        {ev.link && <span className="text-violet-500 font-black">Link</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Classified: Submissions & Tasks */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-1.5 border-b border-border/40 text-left">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Tasks & Submissions ({futureTasks.length})
                </div>
                {futureTasks.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground font-semibold py-2 text-left">No upcoming tasks scheduled.</p>
                ) : (
                  futureTasks.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-3 rounded-xl border border-border bg-secondary/15 flex flex-col gap-1.5 text-left hover:border-primary/40 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="text-xs font-bold text-foreground truncate flex-grow">{ev.title}</h5>
                        {ev.priority && (
                          <Badge variant={ev.priority === 'urgent' || ev.priority === 'high' ? 'destructive' : 'secondary'} className="text-[8px] px-1 py-0 font-bold shrink-0">
                            {ev.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground font-semibold">
                        <span>Due: {ev.date}</span>
                        <span className="text-primary font-black">+50 XP</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Details Modal Dialog */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-6 text-left shadow-2xl backdrop-blur-lg z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <Badge variant={selectedEvent.type === 'meeting' ? 'primary' : 'outline'} className="text-[9px] font-black uppercase tracking-wider">
                  {selectedEvent.type}
                </Badge>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display font-black text-base text-foreground leading-snug">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedEvent.date} • {selectedEvent.time}
                </p>
              </div>

              {selectedEvent.link && (
                <Button
                  variant="primary"
                  onClick={() => window.open(selectedEvent.link, '_blank')}
                  className="w-full btn-bounce rounded-xl"
                  leftIcon={<Video className="h-4 w-4" />}
                >
                  Join Meeting Room
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="w-full btn-bounce rounded-xl border-border"
              >
                Close Details
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
)

export default CalendarPage
