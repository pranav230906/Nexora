import React, { useState } from 'react'
import { cn } from '@/utils/cn'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'busy' | 'away'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false)

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-muted-foreground',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="relative inline-block" {...props}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-secondary border border-border text-secondary-foreground font-semibold overflow-hidden select-none',
          sizes[size],
          className,
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || fallback}
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(fallback)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
            statusColors[status],
          )}
        />
      )}
    </div>
  )
}

export default Avatar
