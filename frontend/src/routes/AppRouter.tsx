import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
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

import { useOffline } from '@/context/OfflineContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Wifi, WifiOff, Download } from 'lucide-react'

const SettingsView = () => {
  const { isOnline, syncQueueCount, addToSyncQueue, triggerPwaInstall } = useOffline()

  const handleAddMockOfflineTask = () => {
    addToSyncQueue('CREATE_TASK', { title: 'Mock Offline Task', id: Date.now() })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage notifications, integrations, offline sync parameters, and AI preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">PWA stand-alone Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install "Last Minute Life Saver" on your home screen or desktop to run it in standard standalone mode with native notifications support.
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={triggerPwaInstall}
              className="gap-1.5 h-9"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Install Application
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
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
