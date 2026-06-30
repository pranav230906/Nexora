import React, { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'

// Import Pages
import LoginPage from '@/features/auth/pages/LoginPage'
import SignupPage from '@/features/auth/pages/SignupPage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import OtpPage from '@/features/auth/pages/OtpPage'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage'
import DashboardHome from '@/features/dashboard/pages/DashboardHome'
import TasksPage from '@/features/tasks/pages/TasksPage'
import AiPlannerPage from '@/features/ai-planner/pages/AiPlannerPage'
import CalendarPage from '@/features/calendar/pages/CalendarPage'
import GoalsHabitsPage from '@/features/goals-habits/pages/GoalsHabitsPage'
import GamificationPage from '@/features/gamification/pages/GamificationPage'
import AnalyticsPage from '@/features/analytics/pages/AnalyticsPage'
import AiChatPage from '@/features/ai-chat/pages/AiChatPage'
import NotificationCenterPage from '@/features/notifications/pages/NotificationCenterPage'
import LandingPage from '@/features/landing/pages/LandingPage'

import { useOffline } from '@/context/OfflineContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Wifi, WifiOff, Download, Mail, Pause, Play, RefreshCw, LogOut, Loader2 } from 'lucide-react'
import apiClient from '@/services/apiClient'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

const SettingsView = () => {
  const { isOnline, syncQueueCount, addToSyncQueue, triggerPwaInstall } = useOffline()
  const addToast = useToastStore((state) => state.addToast)
  const [searchParams, setSearchParams] = useSearchParams()

  // Gmail status state
  const [gmailStatus, setGmailStatus] = useState<any>(null)
  const [isGmailLoading, setIsGmailLoading] = useState(true)
  const [isCallbackProcessing, setIsCallbackProcessing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Track if callback request has already been triggered to avoid parallel StrictMode double calls
  const callbackSentRef = React.useRef(false)

  // Fetch status
  const fetchGmailStatus = async () => {
    try {
      const response = await apiClient.get('/gmail/status/')
      setGmailStatus(response.data)
    } catch (err) {
      console.error("Failed to load Gmail integration status:", err)
    } finally {
      setIsGmailLoading(false)
    }
  }

  // Handle incoming OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && !callbackSentRef.current) {
      callbackSentRef.current = true
      setIsCallbackProcessing(true)
      apiClient.post('/gmail/oauth/callback/', {
        code,
        redirect_uri: window.location.origin + '/dashboard/settings'
      })
      .then((res) => {
        addToast({
          type: 'success',
          title: 'Gmail Account Connected',
          message: `Successfully connected ${res.data.gmail_address || 'your account'}.`
        })
        fetchGmailStatus()
      })
      .catch((err) => {
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: err.response?.data?.error || 'Could not verify authorization code.'
        })
      })
      .finally(() => {
        setIsCallbackProcessing(false)
        setSearchParams({}) // Clear URL params
      })
    } else if (!code) {
      fetchGmailStatus()
    }
  }, [searchParams])

  const handleConnectGmail = async () => {
    try {
      const response = await apiClient.post('/gmail/connect/', {
        redirect_uri: window.location.origin + '/dashboard/settings'
      })
      if (response.data.authorization_url) {
        window.location.href = response.data.authorization_url
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not fetch authorization URL.'
      })
    }
  }

  const handleDisconnectGmail = async () => {
    try {
      await apiClient.post('/gmail/disconnect/')
      addToast({
        type: 'success',
        title: 'Gmail Disconnected',
        message: 'Unlinked and purged your Gmail credentials successfully.'
      })
      setGmailStatus({ connected: false })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Disconnection Failed',
        message: 'Could not unlink credentials.'
      })
    }
  }

  const handleTogglePause = async () => {
    if (!gmailStatus) return
    const nextPauseState = !gmailStatus.is_sync_paused
    try {
      const response = await apiClient.patch('/gmail/status/', {
        is_sync_paused: nextPauseState
      })
      setGmailStatus((prev: any) => ({
        ...prev,
        is_sync_paused: response.data.is_sync_paused
      }))
      addToast({
        type: 'success',
        title: nextPauseState ? 'Sync Paused' : 'Sync Resumed',
        message: nextPauseState ? 'Automatically paused inbox checkups.' : 'Resumed active background syncing.'
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not modify synchronization state.'
      })
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      const response = await apiClient.post('/gmail/sync/')
      addToast({
        type: 'success',
        title: 'Sync Complete',
        message: `Discovered and created ${response.data.new_tasks_created || 0} tasks from new emails.`
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Error pulling messages from Gmail.'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAddMockOfflineTask = () => {
    addToSyncQueue({ action: 'CREATE', model_name: 'Task', object_id: String(Date.now()), data: { title: 'Mock Offline Task' } })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage notifications, integrations, offline sync parameters, and AI preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offline capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Offline Capabilities & Syncing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10">
              <span className="text-xs font-semibold">Service Worker status</span>
              <Badge variant="success">Active / Caching</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10">
              <span className="text-xs font-semibold">Connection status</span>
              {isOnline ? (
                <Badge variant="success" className="gap-1.5"><Wifi className="h-3 w-3" /> Online</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1.5"><WifiOff className="h-3 w-3" /> Offline</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-semibold block">IndexedDB Sync Queue</span>
                <span className="text-[10px] text-muted-foreground block">{syncQueueCount} modifications queued</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddMockOfflineTask}
                className="text-[10px] h-8"
              >
                Queue Mock Action
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gmail Connect intelligence integration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-primary" />
              AI Email Intelligence (Gmail)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            {isCallbackProcessing ? (
              <div className="flex flex-col items-center py-6 space-y-3 justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Exchanging authorization tokens with Google...</p>
              </div>
            ) : isGmailLoading ? (
              <div className="flex flex-col items-center py-6 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : gmailStatus?.connected ? (
              <div className="space-y-4">
                <div className="p-3 border border-border bg-secondary/5 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Connected Account</span>
                    <span className="text-xs font-semibold text-foreground">{gmailStatus.gmail_address}</span>
                  </div>
                  <Badge variant={gmailStatus.is_sync_paused ? 'warning' : 'success'}>
                    {gmailStatus.is_sync_paused ? 'Sync Paused' : 'Sync Active'}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Gmail sync monitors your inbox every few minutes to parse new invoices, flight details, assignments, or follow-ups and block out slots automatically.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTogglePause}
                    className="h-9 px-3 gap-1.5"
                  >
                    {gmailStatus.is_sync_paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    {gmailStatus.is_sync_paused ? 'Resume Sync' : 'Pause Sync'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="h-9 px-3 gap-1.5"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                    Sync Now
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisconnectGmail}
                    className="h-9 px-3 gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Link your own Gmail inbox securely using Google OAuth 2.0. Our AI coach analyzes new emails, extracts actions, schedules calendars, and tracks accountability context-sensitively.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConnectGmail}
                  className="gap-1.5 h-9"
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Connect Gmail Inbox
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


const RootRoute = () => {
  const token = localStorage.getItem('auth_token')
  return token ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'planner',
        element: <AiPlannerPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'goals',
        element: <GoalsHabitsPage />,
      },
      {
        path: 'gamification',
        element: <GamificationPage />,
      },
      {
        path: 'chat',
        element: <AiChatPage />,
      },
      {
        path: 'notifications',
        element: <NotificationCenterPage />,
      },
      {
        path: 'settings',
        element: <SettingsView />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'otp-verification',
        element: <OtpPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
