import React from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-3/4 rounded',
        variant === 'rect' && 'rounded-md',
        className,
      )}
      {...props}
    />
  )
}

export default Skeleton
