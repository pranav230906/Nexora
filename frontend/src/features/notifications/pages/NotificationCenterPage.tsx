import React, { useEffect, useState } from 'react'
import {
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Inbox,
  Mail,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { cn } from '@/utils/cn'

export const NotificationCenterPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const {
    notifications,
    preferences,
    isLoading,
    fetchNotifications,
    fetchPreferences,
    updatePreferences,
    markRead,
    markAllRead,
  } = useNotificationStore()

  // Filter Tabs
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
    fetchPreferences()
  }, [fetchNotifications, fetchPreferences])

  const handleMarkAsRead = async (id: number) => {
    await markRead(id)
    addToast({
      type: 'info',
      title: 'Notification Read',
      message: 'Marked notification as read.',
    })
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    addToast({
      type: 'success',
      title: 'All Marked Read',
      message: 'All active notifications set to read.',
    })
  }

  const handleTogglePreference = async (key: any) => {
    if (!preferences) return
    const updatedVal = !preferences[key as keyof typeof preferences]
    await updatePreferences({ [key]: updatedVal })
    addToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Notification settings successfully updated.',
    })
  }

  // Filter lists helper
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read
    return true
  })

  // Category Icon helper
  const getCategoryIcon = (title: string) => {
    if (title.toLowerCase().includes('deadline') || title.toLowerCase().includes('due')) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
    if (title.toLowerCase().includes('streak') || title.toLowerCase().includes('milestone')) {
      return <Clock className="h-5 w-5 text-amber-500" />
    }
    return <Bell className="h-5 w-5 text-primary" />
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-primary" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">Manage your smart reminders, deadline alerts, and channel preferences.</p>
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
        {/* Left Column: Preference Configuration */}
        <Card className="border border-border h-fit">
          <CardHeader className="border-b border-border/40 pb-3 bg-secondary/10">
            <CardTitle className="text-sm flex items-center gap-2 text-left">
              <Settings className="h-4 w-4 text-primary" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-left">
            {preferences ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Email Notifications</span>
                  <button onClick={() => handleTogglePreference('email_enabled')} className="cursor-pointer">
                    {preferences.email_enabled ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Push Notifications</span>
                  <button onClick={() => handleTogglePreference('push_enabled')} className="cursor-pointer">
                    {preferences.push_enabled ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">In-App Notifications</span>
                  <button onClick={() => handleTogglePreference('in_app_enabled')} className="cursor-pointer">
                    {preferences.in_app_enabled ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <hr className="border-border/60" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Deadline Reminders</span>
                  <button onClick={() => handleTogglePreference('deadline_alerts_enabled')} className="cursor-pointer">
                    {preferences.deadline_alerts_enabled ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Habit Check-ins</span>
                  <button onClick={() => handleTogglePreference('habits_reminder_enabled')} className="cursor-pointer">
                    {preferences.habits_reminder_enabled ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Loading preferences...</p>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Notifications Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-1 bg-secondary/20 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer',
                activeFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Logs
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'text-xs font-semibold px-4 py-1.5 rounded-md transition-colors cursor-pointer',
                activeFilter === 'unread' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Unread
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">Loading feed...</div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border">
              <Inbox className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <h4 className="text-sm font-bold text-foreground">Inbox is empty</h4>
              <p className="text-xs text-muted-foreground">No alerts matching this filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 rounded-xl border flex gap-4 items-start text-left shadow-sm relative overflow-hidden transition-all duration-300',
                    !notif.read
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                      : 'bg-card border-border hover:border-border/80'
                  )}
                >
                  {/* Category symbol */}
                  <div className="p-2 bg-secondary rounded-lg shrink-0">
                    {getCategoryIcon(notif.title)}
                  </div>

                  {/* Message texts */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-foreground leading-normal">{notif.title}</h4>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-muted-foreground block">
                      {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions buttons shelf */}
                  <div className="flex gap-1.5 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Mark read"
                      >
                        <CheckCircle className="h-4 w-4" />
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
