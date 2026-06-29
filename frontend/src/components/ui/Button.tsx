import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none'

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm border border-primary/10',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40',
      outline: 'border border-border/80 bg-background/40 backdrop-blur-sm hover:bg-secondary hover:text-foreground text-muted-foreground',
      ghost: 'hover:bg-secondary hover:text-foreground text-muted-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm border border-destructive/10',
    }

    const sizes = {
      sm: 'h-9 px-3 text-xs gap-1.5',
      md: 'h-11 px-4 py-2.5 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
export default Button
