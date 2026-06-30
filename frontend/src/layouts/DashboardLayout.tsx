import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  Command,
  Brain,
  Calendar,
  Target,
  Trophy,
  BarChart3,
  MessageSquare,
  Bell,
  Flame,
  Award,
  Zap,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationPanel } from '@/components/feedback/NotificationPanel'
import { QuickActions } from '@/components/ui/QuickActions'
import { FloatingAiButton } from '@/components/ui/FloatingAiButton'
import { Dropdown } from '@/components/ui/Dropdown'
import { cn } from '@/utils/cn'
import apiClient from '@/services/apiClient'
import { Progress } from '@/components/ui/Progress'

export const DashboardLayout: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { user, setUser, logout } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchVal, setSearchVal] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  React.useEffect(() => {
    if (!user && localStorage.getItem('auth_token')) {
      apiClient.get('/auth/profile/')
        .then((response) => {
          setUser(response.data)
        })
        .catch((err) => {
          console.error("Failed to load user profile:", err)
          logout()
          navigate('/login')
        })
    }
  }, [user, setUser, logout, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Tasks', path: '/dashboard/tasks', icon: <CheckSquare className="h-4 w-4" /> },
    { label: 'AI Planner', path: '/dashboard/planner', icon: <Brain className="h-4 w-4" /> },
    { label: 'Calendar', path: '/dashboard/calendar', icon: <Calendar className="h-4 w-4" /> },
    { label: 'Goals & Habits', path: '/dashboard/goals', icon: <Target className="h-4 w-4" /> },
    { label: 'Gamification', path: '/dashboard/gamification', icon: <Trophy className="h-4 w-4" /> },
    { label: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'AI Chat', path: '/dashboard/chat', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Notifications', path: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Settings', path: '/dashboard/settings', icon: <Settings className="h-4 w-4" /> },
  ]

  const userEmail = user?.email || ''
  const userName = user?.name || user?.username || ''

  const profileDropdownItems = [
    { label: 'View Profile', onClick: () => navigate('/dashboard/settings') },
    { label: 'Sign Out', onClick: handleLogout, destructive: true },
  ]

  const renderNavContent = () => (
    <nav className="space-y-1 flex-1 py-4">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden btn-bounce',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {item.icon}
            <span className={cn(sidebarCollapsed ? 'lg:hidden' : 'block')}>{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-primary-foreground rounded-r-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-all duration-300">
      {/* 1. Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 256 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md justify-between"
      >
        <div className="flex flex-col px-4 pt-4 overflow-y-auto flex-1">
          {/* Sidebar Brand Header */}
          <div className="h-12 flex items-center gap-3 border-b border-border/60 pb-3">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-primary-foreground text-sm font-black shadow-lg shadow-primary/30">
              N
            </span>
            <span
              className={cn(
                'font-display font-black text-base tracking-tight truncate transition-opacity',
                sidebarCollapsed && 'lg:hidden',
              )}
            >
              Nexora
            </span>
          </div>

          {/* Nav list */}
          {renderNavContent()}
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="p-4 border-t border-border/60 space-y-2">
          {/* Theme Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer btn-bounce"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>Theme Mode</span>
            </span>
            <span className={cn('text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-muted', sidebarCollapsed ? 'lg:hidden' : 'block')}>
              {theme}
            </span>
          </button>

          {/* Collapse sidebar toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl border border-border/60 text-xs font-bold hover:bg-secondary text-muted-foreground transition-all cursor-pointer btn-bounce"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </motion.aside>

      {/* 2. Responsive Mobile Slide Drawer Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            />
            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r border-border p-6 flex flex-col justify-between md:hidden"
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="font-display font-black text-lg tracking-tight">Nexora</span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {renderNavContent()}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary text-muted-foreground"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    Theme Mode
                  </span>
                  <span className="text-xs uppercase font-bold">{theme}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-500/10 text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Container */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-grow md:flex-grow-0">
            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Command search input */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search command or task..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full h-9 pl-9 pr-12 rounded-xl border border-input bg-background/50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/80">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Right Header Gamified telemetry dashboard controls */}
          <div className="flex items-center gap-4">
            {/* Daily Streak Fire Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 cursor-pointer hover:bg-amber-500/20 transition-all font-display font-black text-xs">
              <Flame className="h-4 w-4 fill-amber-500/20 animate-bounce" />
              <span>7 DAYS</span>
            </div>

            {/* XP Level Telemetry status */}
            <div className="hidden lg:flex flex-col w-32 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-primary flex items-center gap-1"><Award className="h-3 w-3" /> LV. 14</span>
                <span className="text-muted-foreground">1,850/2,000 XP</span>
              </div>
              <Progress value={92} className="h-1.5 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
            </div>

            <QuickActions />
            <NotificationPanel />

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Profile Account controls */}
            <div className="flex items-center gap-2 select-none">
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 hover:bg-secondary/40 p-1.5 rounded-xl cursor-pointer transition-colors">
                    <Avatar fallback={userName} size="sm" status="online" />
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-semibold leading-none">{userName}</span>
                      <span className="text-[9px] text-muted-foreground">{userEmail}</span>
                    </div>
                  </div>
                }
                items={profileDropdownItems}
                align="right"
              />
            </div>
          </div>
        </header>

        {/* Content Outlet with smooth animations */}
        <main className="flex-grow overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 relative">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI companion panel */}
      <FloatingAiButton />
    </div>
  )
}

export default DashboardLayout
