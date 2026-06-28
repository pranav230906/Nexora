// import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { OfflineProvider } from '@/context/OfflineContext'
import { AppRouter } from '@/routes/AppRouter'
import './App.css'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="lmls-ui-theme">
        <OfflineProvider>
          <AppRouter />
          <ToastProvider />
        </OfflineProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
