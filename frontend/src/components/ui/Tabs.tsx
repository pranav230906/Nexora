import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface TabOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  options: TabOption[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  variant?: 'pills' | 'underline'
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeId,
  onChange,
  className,
  variant = 'underline',
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 select-none',
        variant === 'underline' ? 'border-b border-border w-full' : 'p-1 bg-secondary rounded-lg',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.id === activeId

        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none rounded-md',
              variant === 'underline'
                ? 'pb-3 rounded-none text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground z-10',
              isActive && 'text-foreground',
            )}
          >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span>{option.label}</span>

            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTabBorder"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {isActive && variant === 'pills' && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-card rounded-md shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
