import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, BrainCircuit, Terminal } from 'lucide-react'
import { Button } from './Button'
import { InputField } from '../form/InputField'

export const FloatingAiButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Panic mode? I can draft drafts, generate outlines, or organize your list. What are we saving today?' },
  ])
  const [inputVal, setInputVal] = useState('')

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputVal.trim()) return

    const userText = inputVal
    setMessages((prev) => [...prev, { sender: 'user', text: userText }])
    setInputVal('')

    // Simulated AI reaction
    setTimeout(() => {
      let reply = "I'm analyzing your workload. Let's start by breaking down your next step into 3 quick sub-tasks to keep you moving."
      if (userText.toLowerCase().includes('email')) {
        reply = "Here is a draft: 'Hi Team, here is the update you needed for the project. Let me know if you need any adjustments before shipping.' Let's hit send!"
      } else if (userText.toLowerCase().includes('write') || userText.toLowerCase().includes('draft')) {
        reply = "I've generated a draft outline and written the key points. Review it and let's check this task off!"
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }])
    }, 1000)
  }

  const handleSuggestion = (suggestion: string) => {
    setInputVal(suggestion)
    // Small delay to make it feel natural
    setTimeout(() => handleSend(), 50)
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 h-12 px-4 bg-primary text-primary-foreground font-semibold rounded-full shadow-2xl flex items-center gap-2 hover:bg-primary/95 cursor-pointer"
      >
        <Sparkles className="h-5 w-5 animate-pulse text-amber-300 fill-amber-300" />
        <span>Ask AI Coach</span>
      </motion.button>

      {/* Slide-over chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-semibold text-sm leading-none">Last Minute Coach</h4>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active Assistant</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground border border-border'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer suggest & Inputs */}
              <div className="p-4 border-t border-border space-y-3 bg-secondary/10">
                {/* Suggestions Pills */}
                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleSuggestion('Draft client email update')}
                      className="text-xs px-2.5 py-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      ✉️ Draft Client Email
                    </button>
                    <button
                      onClick={() => handleSuggestion('Break down task: Database Migration')}
                      className="text-xs px-2.5 py-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      ⚡ Break Down Task
                    </button>
                  </div>
                )}

                {/* Text input */}
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Type AI prompt here..."
                    className="flex-grow h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="submit" variant="primary" size="sm" className="h-10 w-10 p-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingAiButton
