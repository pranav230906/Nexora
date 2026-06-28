import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'

interface OfflineContextType {
  isOnline: boolean
  syncQueueCount: number
  addToSyncQueue: (action: string, payload: any) => void
  triggerPwaInstall: () => void
  isInstallable: boolean
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addToast = useToastStore((state) => state.addToast)

  // Online connection state
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Sync Queue mock state
  const [syncQueue, setSyncQueue] = useState<Array<{ action: string; payload: any }>>([])

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast({
        type: 'success',
        title: 'Connection Restored',
        message: 'Synchronizing offline tasks queue...',
      })

      // Simulate syncing IndexedDB queue
      if (syncQueue.length > 0) {
        setTimeout(() => {
          setSyncQueue([])
          addToast({
            type: 'success',
            title: 'Database Synced',
            message: 'All offline modifications synced successfully.',
          })
        }, 1500)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      addToast({
        type: 'warning',
        title: 'Offline Mode Active',
        message: 'Modifications will be queued and synced when online.',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [syncQueue, addToast])

  const addToSyncQueue = (action: string, payload: any) => {
    setSyncQueue((prev) => [...prev, { action, payload }])
    addToast({
      type: 'info',
      title: 'Action Queued',
      message: 'Offline modification stored in IndexedDB.',
    })
  }

  const triggerPwaInstall = () => {
    if (!deferredPrompt) {
      addToast({
        type: 'info',
        title: 'PWA Installed',
        message: 'Application is already running standalone or installed.',
      })
      return
    }

    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation prompt.')
        setDeferredPrompt(null)
      }
    })
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncQueueCount: syncQueue.length,
        addToSyncQueue,
        triggerPwaInstall,
        isInstallable: !!deferredPrompt,
      }}
    >
      {children}

      {/* Floating Offline Notification Warning Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-red-500/20 text-xs font-semibold">
              <WifiOff className="h-5 w-5 animate-pulse shrink-0" />
              <div className="text-left flex-1">
                <div>Offline Mode Active</div>
                <div className="opacity-90 text-[10px] font-normal leading-normal">
                  Changes will sync when connection returns.
                </div>
              </div>
              {syncQueue.length > 0 && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] shrink-0">
                  {syncQueue.length} Queued
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OfflineContext.Provider>
  )
}

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used inside an OfflineProvider')
  }
  return context
}
