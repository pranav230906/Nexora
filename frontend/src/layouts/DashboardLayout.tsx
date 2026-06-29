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
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationPanel } from '@/components/feedback/NotificationPanel'
import { QuickActions } from '@/components/ui/QuickActions'
import { FloatingAiButton } from '@/components/ui/FloatingAiButton'
import { Dropdown } from '@/components/ui/Dropdown'
import { cn } from '@/utils/cn'

export const DashboardLayout: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchVal, setSearchVal] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="h-4 w-4" /> },
    { label: 'AI Planner', path: '/planner', icon: <Brain className="h-4 w-4" /> },
    { label: 'Calendar', path: '/calendar', icon: <Calendar className="h-4 w-4" /> },
    { label: 'Goals & Habits', path: '/goals', icon: <Target className="h-4 w-4" /> },
    { label: 'Gamification', path: '/gamification', icon: <Trophy className="h-4 w-4" /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'AI Chat', path: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="h-4 w-4" /> },
  ]

  const userEmail = user?.email || 'admin@admin.com'
  const userName = user?.name || 'Admin User'

  const profileDropdownItems = [
    { label: 'View Profile', onClick: () => navigate('/settings') },
    { label: 'System Diagnostics', onClick: () => {} },
    { label: 'Sign Out', onClick: handleLogout, destructive: true },
  ]

  const renderNavContent = () => (
    <nav className="space-y-1.5 flex-1 py-4">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative overflow-hidden',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {item.icon}
            <span className={cn(sidebarCollapsed ? 'lg:hidden' : 'block')}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* 1. Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 256 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md justify-between"
      >
        <div className="flex flex-col px-4 pt-4 overflow-y-auto flex-1">
          {/* Sidebar Brand Header */}
          <div className="h-12 flex items-center gap-3 border-b border-border/60 pb-3">
            <span className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow">
              L
            </span>
            <span
              className={cn(
                'font-display font-bold text-sm tracking-tight truncate transition-opacity',
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
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className={sidebarCollapsed ? 'lg:hidden' : 'block'}>Theme Mode</span>
            </span>
            <span className={cn('text-[10px] uppercase font-bold tracking-wider', sidebarCollapsed ? 'lg:hidden' : 'block')}>
              {theme}
            </span>
          </button>

          {/* Collapse sidebar toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-1.5 rounded-lg border border-border/60 text-xs font-semibold hover:bg-secondary text-muted-foreground transition-all cursor-pointer"
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
                  <span className="font-display font-bold text-lg tracking-tight">Nexora</span>
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
                className="w-full h-9 pl-9 pr-12 rounded-lg border border-input bg-background/50 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/80">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation Panel controls */}
          <div className="flex items-center gap-4">
            <QuickActions />
            <NotificationPanel />

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Profile Account controls */}
            <div className="flex items-center gap-2 select-none">
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 hover:bg-secondary/40 p-1.5 rounded-lg cursor-pointer transition-colors">
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
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>

      {/* Floating AI companion panel */}
      <FloatingAiButton />
    </div>
  )
}

export default DashboardLayout
