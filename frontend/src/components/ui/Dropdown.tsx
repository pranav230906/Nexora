import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  disabled?: boolean
  destructive?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right', className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 rounded-xl border border-border/80 bg-card/95 p-1 text-card-foreground shadow-lg shadow-black/5 backdrop-blur-md focus:outline-none min-w-[12rem]',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              className,
            )}
          >
            <div className="flex flex-col py-1">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick()
                      setIsOpen(false)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-40',
                    item.destructive
                      ? 'text-red-500 hover:bg-red-500/10 hover:text-red-600'
                      : 'text-foreground hover:bg-secondary hover:text-accent-foreground',
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="flex-grow truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dropdown
