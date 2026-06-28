import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/store/useToastStore'

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/20'
      case 'error':
        return 'border-red-500/20'
      case 'warning':
        return 'border-amber-500/20'
      case 'info':
      default:
        return 'border-blue-500/20'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 w-full p-4 rounded-lg border bg-card text-card-foreground shadow-lg backdrop-blur-md ${getBorderColor()}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-grow min-w-0">
        {toast.title && <h5 className="font-semibold text-sm leading-none mb-1">{toast.title}</h5>}
        <p className="text-xs text-muted-foreground leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
