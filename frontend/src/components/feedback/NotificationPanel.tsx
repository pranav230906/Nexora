import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, Clock, Trash2, ShieldAlert } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface AlertItem {
  id: string
  title: string
  time: string
  unread: boolean
  type: 'urgency' | 'success' | 'system'
}

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      title: 'Task Overdue: Database migration deadline has passed.',
      time: '5 mins ago',
      unread: true,
      type: 'urgency',
    },
    {
      id: '2',
      title: 'AI optimization complete: 3 sub-tasks suggested.',
      time: '1 hour ago',
      unread: true,
      type: 'system',
    },
    {
      id: '3',
      title: 'Successfully shipped code bundle to staging server.',
      time: '2 hours ago',
      unread: false,
      type: 'success',
    },
  ])

  const unreadCount = alerts.filter((a) => a.unread).length

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })))
  }

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgency':
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'system':
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-border/85 bg-background/50 hover:bg-secondary text-foreground hover:text-foreground transition-all duration-200 cursor-pointer shadow-sm"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-ping" />
        )}
      </button>

      {/* Popover pane */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-[#09090b] border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Notifications ({unreadCount} new)
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  All caught up! No notifications.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 flex items-start gap-3 transition-colors',
                      alert.unread ? 'bg-primary/5' : 'hover:bg-secondary/10',
                    )}
                  >
                    <span className="mt-0.5">{getAlertIcon(alert.type)}</span>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-medium text-foreground leading-normal break-words">
                        {alert.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {alert.time}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-muted-foreground/40 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationPanel
