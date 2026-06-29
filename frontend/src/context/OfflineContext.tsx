import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import apiClient from '@/services/apiClient'
import { useTaskStore } from '@/features/tasks/store/useTaskStore'

export interface SyncOperation {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  model_name: 'Task' | 'Habit' | 'Goal'
  object_id: string
  client_timestamp: string
  data: any
}

interface OfflineContextType {
  isOnline: boolean
  syncQueueCount: number
  addToSyncQueue: (op: Omit<SyncOperation, 'client_timestamp'>) => void
  triggerPwaInstall: () => void
  isInstallable: boolean
  syncOfflineQueue: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addToast = useToastStore((state) => state.addToast)

  // Online connection state
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Sync Queue state
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const syncOfflineQueue = async () => {
    if (syncQueue.length === 0) return

    try {
      const lastSyncTime = localStorage.getItem('last_sync_time') || new Date(0).toISOString()
      
      const response = await apiClient.post('/sync/', {
        device_id: 'web-browser-client',
        last_sync_time: lastSyncTime,
        queue: syncQueue
      })

      const { sync_time, operations_applied } = response.data
      localStorage.setItem('last_sync_time', sync_time)
      
      // Clear queue
      setSyncQueue([])

      // Force refresh tasks store to sync with server delta upserts/deletes
      await useTaskStore.getState().fetchTasks()

      addToast({
        type: 'success',
        title: 'Database Synced',
        message: `Successfully synchronized ${operations_applied} offline actions and updated database delta.`,
      })
    } catch (err) {
      console.error('Failed to sync offline queue:', err)
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Could not contact synchronization gateway. Queue preserved.',
      })
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast({
        type: 'success',
        title: 'Connection Restored',
        message: 'Synchronizing offline tasks queue...',
      })
      syncOfflineQueue()
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

  const addToSyncQueue = (op: Omit<SyncOperation, 'client_timestamp'>) => {
    const fullOp: SyncOperation = {
      ...op,
      client_timestamp: new Date().toISOString()
    }
    setSyncQueue((prev) => [...prev, fullOp])
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
        syncOfflineQueue
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
