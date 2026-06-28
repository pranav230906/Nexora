import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'sm',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

  const variants = {
    primary: 'bg-primary text-primary-foreground border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 border',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20 border',
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20 border',
    outline: 'border border-border text-foreground bg-transparent',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wider uppercase',
    md: 'px-2.5 py-0.5 text-xs',
  }

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
  )
}

export default Badge
