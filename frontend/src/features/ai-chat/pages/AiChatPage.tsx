import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  Mic,
  Paperclip,
  Plus,
  Copy,
  Check,
  Brain,
  File,
  X,
  VolumeX,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

// Dummy Data types
interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  isStreaming?: boolean
  attachment?: {
    name: string
    size: string
  }
}

interface ChatSession {
  id: string
  title: string
  snippet: string
}

const mockSessions: ChatSession[] = [
  { id: 's1', title: 'Pitch Deck Draft outline', snippet: 'Let\'s outline the business value...' },
  { id: 's2', title: 'Database migration planning', snippet: 'Reviewing SQL indexing queries...' },
  { id: 's3', title: 'Sprint planning optimization', snippet: 'Coaching recommendations list...' },
]

export const AiChatPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Sessions and Active State
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions)
  const [activeSession, setActiveSession] = useState('s1')

  // Messages list state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I\'m your **AI Productivity Coach**. Ready to timeblock, draft code, or optimize your deadlines? Ask me anything.',
    },
  ])

  const [promptInput, setPromptInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Voice/Mic state
  const [micActive, setMicActive] = useState(false)

  // Attachment state
  const [stagedAttachment, setStagedAttachment] = useState<{ name: string; size: string } | null>(null)

  // Thinking State & Streaming text
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  // Suggested Prompts
  const suggestedPrompts = [
    'Write a quick SQL script to index tasks by date.',
    'Draft a team email asking for feedback on Component UX.',
    'Analyze my workload and suggest a Pomodoro schedule.',
  ]

  const handleSuggestionClick = (prompt: string) => {
    setPromptInput(prompt)
  }

  // Handle Attach file mock
  const handleAttachMockFile = () => {
    const files = [
      { name: 'schema.sql', size: '2.5 KB' },
      { name: 'pitch_deck_v1.pdf', size: '12.0 MB' },
      { name: 'work_telemetry.json', size: '150 KB' },
    ]
    const randomFile = files[Math.floor(Math.random() * files.length)]
    setStagedAttachment(randomFile)
    addToast({
      type: 'info',
      title: 'File Staged',
      message: `"${randomFile.name}" ready to upload.`,
    })
  }

  const handleRemoveAttachment = () => {
    setStagedAttachment(null)
  }

  // Trigger Voice Input simulation
  const handleToggleMic = () => {
    if (micActive) {
      setMicActive(false)
      return
    }

    setMicActive(true)
    addToast({
      type: 'info',
      title: 'Voice Activated',
      message: 'Listening... (Speak your request)',
    })

    // Simulate voice transcript injection
    setTimeout(() => {
      setPromptInput('Optimize my weekly schedule to prepare for pitch review.')
      setMicActive(false)
      addToast({
        type: 'success',
        title: 'Voice Transcript Received',
        message: 'Text generated from voice input.',
      })
    }, 3000)
  }

  // Copy code blocks helper
  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText)
    setCopiedId(blockId)
    addToast({
      type: 'info',
      title: 'Code Copied',
      message: 'Source code copied to clipboard.',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Parse markdown for bold, lists, and code blocks
  const renderMessageContent = (text: string, msgId: string) => {
    // If it contains a code block
    if (text.includes('```')) {
      const parts = text.split('```')
      return parts.map((part, idx) => {
        // Code block is always odd index
        if (idx % 2 === 1) {
          const lines = part.split('\n')
          const language = lines[0] || 'typescript'
          const codeContent = lines.slice(1).join('\n').trim()
          const blockId = `${msgId}-${idx}`

          return (
            <div key={idx} className="my-3 rounded-lg overflow-hidden border border-border bg-black text-emerald-400 font-mono text-xs text-left">
              <div className="flex justify-between items-center bg-secondary/15 px-4 py-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                <span>{language}</span>
                <button
                  onClick={() => handleCopyCode(codeContent, blockId)}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                >
                  {copiedId === blockId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedId === blockId ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code>{codeContent}</code>
              </pre>
            </div>
          )
        }

        return <span key={idx} dangerouslySetInnerHTML={{ __html: parseTextFormatting(part) }} />
      })
    }

    return <span dangerouslySetInnerHTML={{ __html: parseTextFormatting(text) }} />
  }

  const parseTextFormatting = (text: string) => {
    let html = text
    // Replace **bold** with <strong>tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace *italic* with <em>tags
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Replace newlines with <br />
    html = html.replace(/\n/g, '<br />')
    return html
  }

  const handleSendPrompt = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!promptInput.trim() && !stagedAttachment) return

    const userText = promptInput
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText || `Staged file: ${stagedAttachment?.name}`,
    }

    if (stagedAttachment) {
      userMsg.attachment = stagedAttachment
      setStagedAttachment(null)
    }

    setMessages((prev) => [...prev, userMsg])
    setPromptInput('')
    setIsThinking(true)

    // Simulate AI response delay
    setTimeout(() => {
      setIsThinking(false)

      let replyTemplate = "No problem! I've analyzed your project parameters. What should we execute next?"
      if (userText.toLowerCase().includes('sql') || userText.toLowerCase().includes('index')) {
        replyTemplate = "Here is the optimized indexing schema for tasks:\n```sql\nCREATE INDEX idx_tasks_due_date ON tasks (due_date);\nCREATE INDEX idx_tasks_status ON tasks (status);\n```\nLet me know if you'd like me to draft query templates!"
      } else if (userText.toLowerCase().includes('email') || userText.toLowerCase().includes('draft')) {
        replyTemplate = "Here is the email draft for Component UX:\n```markdown\nSubject: Request for Feedback: Components UX Update\n\nHi Team,\nWe've completed the baseline layout. Please review component states and let me know if they align with guidelines.\n\nBest,\nCoach\n```\nShall I add anything else to the subject?"
      } else if (userText.toLowerCase().includes('optimize') || userText.toLowerCase().includes('schedule')) {
        replyTemplate = "Got it. I've rescheduled your morning focus slots. Check out the updated **AI Planner** or **Calendar** tab to preview changes."
      }

      // Simulate Token Streaming typewriter effect
      const streamId = `ai-${Date.now()}`
      const newAiMsg: ChatMessage = {
        id: streamId,
        sender: 'ai',
        text: '',
        isStreaming: true,
      }

      setMessages((prev) => [...prev, newAiMsg])

      let currentText = ''
      let charIdx = 0

      const interval = setInterval(() => {
        if (charIdx < replyTemplate.length) {
          currentText += replyTemplate[charIdx]
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamId ? { ...msg, text: currentText } : msg))
          )
          charIdx += 2 // Print 2 characters at a time for speed
        } else {
          clearInterval(interval)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamId ? { ...msg, isStreaming: false } : msg))
          )
        }
      }, 25)
    }, 1500)
  }

  const handleStartNewChat = () => {
    setMessages([
      {
        id: `m-${Date.now()}`,
        sender: 'ai',
        text: 'Started a fresh session. Ready to optimize schedules or review mock logs?',
      },
    ])
    const newSessionId = `s-${Date.now()}`
    setSessions((prev) => [
      { id: newSessionId, title: 'New Conversation', snippet: 'Empty chat session...' },
      ...prev,
    ])
    setActiveSession(newSessionId)
    addToast({
      type: 'success',
      title: 'New Chat Session',
      message: 'Context cleared for a new topic.',
    })
  }

  return (
    <div className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
      {/* 1. Left Sidebar: Sessions list history */}
      <Card className="hidden lg:flex flex-col h-full bg-secondary/10 border border-border">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-primary" /> Sessions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleStartNewChat} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map((ses) => (
            <div
              key={ses.id}
              onClick={() => {
                setActiveSession(ses.id)
                addToast({ type: 'info', title: 'Session Swapped', message: `Swapped to "${ses.title}"` })
              }}
              className={cn(
                'p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-secondary/40 cursor-pointer text-left space-y-1 transition-all',
                activeSession === ses.id ? 'bg-card border-border shadow-sm font-semibold' : ''
              )}
            >
              <h5 className="text-xs text-foreground truncate">{ses.title}</h5>
              <p className="text-[10px] text-muted-foreground truncate">{ses.snippet}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. Main Column: Chat Screen */}
      <div className="lg:col-span-3 flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
        {/* Top bar info */}
        <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h4 className="font-semibold text-xs leading-none">Last Minute Coach</h4>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online telemetry active</span>
            </div>
          </div>
        </div>

        {/* Scrollable messages pane */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-xl px-4 py-3 text-xs leading-relaxed space-y-2 text-left',
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-foreground border border-border'
                )}
              >
                {/* Text render */}
                <div className="text-xs">
                  {renderMessageContent(msg.text, msg.id)}
                </div>

                {/* Staged Attachment render */}
                {msg.attachment && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded bg-black/10 border border-current/10">
                    <File className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-grow">
                      <div className="font-semibold truncate text-[10px]">{msg.attachment.name}</div>
                      <div className="opacity-80 text-[8px]">{msg.attachment.size}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Bouncing Thinking Animation */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground border border-border rounded-xl px-4 py-3 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom bar options */}
        <div className="p-4 border-t border-border bg-secondary/10 space-y-4">
          {/* Staged attachment display */}
          {stagedAttachment && (
            <div className="flex items-center justify-between p-2 rounded border border-primary/20 bg-primary/5 text-xs max-w-sm">
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold truncate text-[10px]">{stagedAttachment.name}</span>
              </div>
              <button onClick={handleRemoveAttachment} className="p-1 rounded-full hover:bg-secondary text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Suggestions Pills (only visible when prompt input is empty) */}
          {!promptInput && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(p)}
                  className="text-[10px] px-2.5 py-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Form Actions */}
          <form onSubmit={handleSendPrompt} className="flex gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttachMockFile}
              className="h-10 w-10 p-0 shrink-0 border-border"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ask coach for code snippets, schedule shifts, or updates..."
              className="flex-grow h-10 px-4 py-2 rounded-lg border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleMic}
              className={cn(
                'h-10 w-10 p-0 shrink-0 border-border',
                micActive && 'border-red-500 bg-red-500/10 text-red-500 animate-pulse'
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button type="submit" variant="primary" size="sm" className="h-10 px-4 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AiChatPage
