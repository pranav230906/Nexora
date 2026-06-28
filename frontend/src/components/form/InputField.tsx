import React from 'react'
import { cn } from '@/utils/cn'

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
      </div>
    )
  },
)

InputField.displayName = 'InputField'
export default InputField
