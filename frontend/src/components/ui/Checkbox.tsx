import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked = false, onChange, disabled, id, ...props }, ref) => {
    const handleToggle = () => {
      if (!disabled && onChange) {
        onChange(!checked)
      }
    }

    const uniqueId = id || Math.random().toString(36).substring(2, 9)

    return (
      <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={handleToggle}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            id={uniqueId}
            checked={checked}
            disabled={disabled}
            className="sr-only"
            onChange={() => {}}
            {...props}
          />
          <motion.div
            animate={{
              backgroundColor: checked ? 'var(--color-primary, hsl(var(--primary)))' : 'transparent',
              borderColor: checked ? 'var(--color-primary, hsl(var(--primary)))' : 'hsl(var(--border))',
            }}
            transition={{ duration: 0.15 }}
            className={cn(
              'h-5 w-5 rounded border flex items-center justify-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed',
              className,
            )}
          >
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3px]" />
              </motion.div>
            )}
          </motion.div>
        </div>
        {label && (
          <label
            htmlFor={uniqueId}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {label}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
export default Checkbox
