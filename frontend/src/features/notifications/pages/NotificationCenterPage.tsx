import React, { useState } from 'react'
import {
  Bell,
  Clock,
  CheckCircle,
  Archive,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

// Dummy Data types
interface NotificationItem {
  id: string
  title: string
  time: string
  unread: boolean
  archived: boolean
  category: 'reminder' | 'task_alert' | 'deadline' | 'achievement' | 'ai_suggestion'
  description?: string
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Upcoming Pitch Deck Deadline',
    description: 'Your project pitch draft is due in 3 hours. Let\'s block out deep time.',
    time: '20 mins ago',
    unread: true,
    archived: false,
    category: 'deadline',
  },
  {
    id: 'n2',
    title: 'Sprint Master Level 15 reached',
    description: 'Congratulations! You unlocked the Retro Terminal UI shop item.',
    time: '1 hour ago',
    unread: true,
    archived: false,
    category: 'achievement',
  },
  {
    id: 'n3',
    title: 'Meditation Break Suggested',
    description: 'AI Coach recommendation: Schedule a 10m cognitive break now to avoid fatigue.',
    time: '3 hours ago',
    unread: false,
    archived: false,
    category: 'ai_suggestion',
  },
  {
    id: 'n4',
    title: 'SQL Index migration query compiled',
    description: 'Review performance logs inside diagnostic panels.',
    time: 'Yesterday',
    unread: false,
    archived: true,
    category: 'task_alert',
  },
  {
    id: 'n5',
    title: 'Daily Coding habit check-in ready',
    description: 'Streak: 14 days active. Tap to check off today\'s practice.',
    time: 'Yesterday',
    unread: false,
    archived: false,
    category: 'reminder',
  },
]

export const NotificationCenterPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Interactive Notifications list
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)

  // Filter Tabs
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived'>('all')

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
    addToast({
      type: 'info',
      title: 'Notification Read',
      message: 'Marked notification as read.',
    })
  }

  const handleArchive = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true } : n))
    )
    addToast({
      type: 'success',
      title: 'Notification Archived',
      message: 'Notification shifted to vault archives.',
    })
  }

  const handleRestore = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: false } : n))
    )
    addToast({
      type: 'info',
      title: 'Notification Restored',
      message: 'Notification restored to active feed.',
    })
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    addToast({
      type: 'success',
      title: 'All Marked Read',
      message: 'All active notifications set to read.',
    })
  }

  // Filter lists helper
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return n.unread && !n.archived
    if (activeFilter === 'archived') return n.archived
    return !n.archived // 'all' filter shows all active, unarchived ones
  })

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'deadline':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'achievement':
        return <Award className="h-5 w-5 text-amber-500" />
      case 'ai_suggestion':
        return <Sparkles className="h-5 w-5 text-primary" />
      case 'task_alert':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'reminder':
      default:
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-primary" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">Manage your smart reminders, deadline alerts, and AI coach recommendations.</p>
        </div>

        {/* Global actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-9 px-3">
            Mark all read
          </Button>
        </div>
      </div>

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Filter Sidebar */}
        <Card className="bg-secondary/10 border border-border h-fit">
          <div className="p-3 space-y-1">
            {(['all', 'unread', 'archived'] as const).map((filter) => {
              const count = notifications.filter((n) => {
                if (filter === 'unread') return n.unread && !n.archived
                if (filter === 'archived') return n.archived
                return !n.archived
              }).length

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-left',
                    activeFilter === filter
                      ? 'bg-card text-foreground border border-border shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <span>{filter}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{count}</Badge>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Right Column: Notifications Feed */}
        <div className="lg:col-span-3 space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border">
              <Inbox className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <h4 className="text-sm font-bold text-foreground">Inbox is empty</h4>
              <p className="text-xs text-muted-foreground">No notifications matching this filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 rounded-xl border flex gap-4 items-start text-left shadow-sm relative overflow-hidden transition-all duration-300',
                    notif.unread
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                      : 'bg-card border-border hover:border-border/80'
                  )}
                >
                  {/* Category symbol */}
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Message texts */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-foreground leading-normal">{notif.title}</h4>
                      <Badge variant="outline" className="text-[8px] uppercase tracking-wider font-black">
                        {notif.category.replace('_', ' ')}
                      </Badge>
                      {notif.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    {notif.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {notif.description}
                      </p>
                    )}
                    <span className="text-[9px] text-muted-foreground block">{notif.time}</span>
                  </div>

                  {/* Actions buttons shelf */}
                  <div className="flex gap-1.5 shrink-0">
                    {notif.unread && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Mark read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {notif.archived ? (
                      <button
                        onClick={() => handleRestore(notif.id)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(notif.id)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationCenterPage
