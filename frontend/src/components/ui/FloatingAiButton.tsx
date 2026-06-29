import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquareText } from 'lucide-react'

export const FloatingAiButton: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Hide the floating button if we are already on the AI Chat page
  if (location.pathname === '/dashboard/chat') {
    return null
  }

  return (
    <motion.button
      onClick={() => navigate('/dashboard/chat')}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-40 h-12 w-12 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:bg-primary/95 cursor-pointer border border-primary-foreground/10"
      title="Open AI Chat Assistant"
    >
      <MessageSquareText className="h-5.5 w-5.5" />
    </motion.button>
  )
}

export default FloatingAiButton
