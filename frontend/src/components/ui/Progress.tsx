import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0 to 100
  color?: string
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = 'bg-primary',
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max(value, 0), 100)

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  )
}

export default Progress
