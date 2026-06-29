import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  defaultCollapsed?: boolean
  children?: React.ReactNode
}

export const Sidebar: React.FC<SidebarProps> = ({
  defaultCollapsed = false,
  children,
  className,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative border-r border-border bg-card flex flex-col justify-between h-full group z-20',
        className,
      )}
      {...(props as any)}
    >
      {/* Collapse Trigger Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 -right-3 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center shadow hover:bg-secondary cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Navigation Content Slot */}
      <div className="flex flex-col flex-1 overflow-hidden py-4">
        {/* Pass down isCollapsed state context/prop if needed, but here simple rendering is fine */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { isCollapsed } as any)
          }
          return child
        })}
      </div>
    </motion.aside>
  )
}

export default Sidebar
