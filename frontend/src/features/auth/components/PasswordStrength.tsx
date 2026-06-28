import React from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PasswordStrengthProps {
  password?: string
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const getCriteria = (val: string) => {
    return [
      { label: 'At least 8 characters', met: val.length >= 8 },
      { label: 'Contains a number', met: /\d/.test(val) },
      { label: 'Contains a special character', met: /[^A-Za-z0-9]/.test(val) },
      { label: 'Mixed case (upper & lowercase)', met: /[A-Z]/.test(val) && /[a-z]/.test(val) },
    ]
  }

  const criteria = getCriteria(password)
  const score = criteria.filter((c) => c.met).length

  const getStrengthText = () => {
    if (!password) return ''
    if (score <= 1) return 'Weak'
    if (score <= 3) return 'Moderate'
    return 'Strong'
  }

  const getProgressColor = () => {
    if (score <= 1) return 'bg-red-500'
    if (score <= 3) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getStrengthTextColor = () => {
    if (score <= 1) return 'text-red-500'
    if (score <= 3) return 'text-amber-500'
    return 'text-emerald-500'
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Score Header */}
      {password && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-semibold uppercase">Password Strength</span>
          <span className={cn('font-bold', getStrengthTextColor())}>
            {getStrengthText()}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full flex-1 transition-all duration-300',
              step <= score ? getProgressColor() : 'bg-border',
            )}
          />
        ))}
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1.5">
        {criteria.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex items-center justify-center h-4 w-4 rounded-full border transition-colors',
                item.met ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-border',
              )}
            >
              {item.met ? (
                <Check className="h-2.5 w-2.5 text-emerald-500 stroke-[3px]" />
              ) : (
                <X className="h-2.5 w-2.5 text-muted-foreground/30 stroke-[3px]" />
              )}
            </span>
            <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PasswordStrength
