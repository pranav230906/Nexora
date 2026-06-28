import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'There are no items to display right now.',
  icon = <Inbox className="h-10 w-10 text-muted-foreground" />,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-card/20 min-h-[250px]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center p-4 bg-secondary rounded-full mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}

export default EmptyState
