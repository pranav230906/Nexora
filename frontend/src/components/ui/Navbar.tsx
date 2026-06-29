import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { Button } from './Button'
import { cn } from '@/utils/cn'

export interface NavbarProps {
  onMenuClick?: () => void
  className?: string
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, className }) => {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className={cn(
        'h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-30 sticky top-0 w-full',
        className,
      )}
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden"
            leftIcon={<Menu className="h-5 w-5" />}
          />
        )}
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
          <span className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            N
          </span>
          Nexora
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 p-0"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}

export default Navbar
