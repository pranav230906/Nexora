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
  Volume2,
  Loader2,
  Trash2,
  Archive,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'
import { apiClient } from '@/services/apiClient'

// Type definitions matching Django models
interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  isStreaming?: boolean
  toolCalls?: string[]
  attachment?: {
    name: string
    size: string
  }
}

interface ChatSession {
  id: string
  title: string
  is_archived: boolean
  snippet?: string
}

export const AiChatPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Sessions and Active State
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Messages list state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [promptInput, setPromptInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Voice/Mic state
  const [micActive, setMicActive] = useState(false)

  // Speech Text-to-Speech state
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null)

  // Attachment state
  const [stagedAttachment, setStagedAttachment] = useState<{ name: string; size: string } | null>(null)

  // Thinking State & Streaming text
  const [isThinking, setIsThinking] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)

  // Suggested Prompts
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Write a quick SQL script to index tasks by date.',
    'Draft a team email asking for feedback on Component UX.',
    'Analyze my workload and suggest a Pomodoro schedule.',
  ])

  // Clean up recognition and speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking, activeTools])

  // 1. Load chat sessions from API
  const fetchSessions = async (selectFirst = true) => {
    try {
      setLoadingSessions(true)
      const res = await apiClient.get<ChatSession[]>('/chatbot/session/?archived=false')
      setSessions(res.data)
      if (selectFirst && res.data.length > 0 && !activeSession) {
        setActiveSession(res.data[0].id)
      }
    } catch (err: any) {
      addToast({
        type: 'destructive',
        title: 'Error loading sessions',
        message: err.message || 'Failed to fetch conversations.',
      })
    } finally {
      setLoadingSessions(false)
    }
  }

  // 2. Load active session message history
  const fetchHistory = async (sessionId: string) => {
    try {
      setLoadingHistory(true)
      const res = await apiClient.get<any[]>(`/chatbot/session/${sessionId}/history/`)
      const formatted = res.data.map((msg) => ({
        id: String(msg.id),
        sender: msg.sender.toLowerCase() === 'user' ? 'user' : 'ai',
        text: msg.content,
        toolCalls: msg.tool_calls ? Object.keys(msg.tool_calls) : [],
      }))
      setMessages(formatted)
    } catch (err: any) {
      addToast({
        type: 'destructive',
        title: 'Error loading history',
        message: err.message || 'Failed to load conversation history.',
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  // 3. Load suggested prompts dynamically
  const fetchSuggestedPrompts = async () => {
    try {
      const res = await apiClient.get<{ suggested_prompts: string[] }>('/chatbot/session/suggested_prompts/')
      if (res.data && res.data.suggested_prompts) {
        setSuggestedPrompts(res.data.suggested_prompts)
      }
    } catch (err) {
      // Best-effort; fall back to static list if endpoint fails
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchSessions()
    fetchSuggestedPrompts()
  }, [])

  // Manage WebSocket connection when active session changes
  useEffect(() => {
    if (!activeSession) return

    // Load conversation history first
    fetchHistory(activeSession)

    // Close existing WebSocket if open
    if (wsRef.current) {
      wsRef.current.close()
    }

    const token = localStorage.getItem('auth_token')
    if (!token) return

    // Build WS path based on current API path
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsHost = apiBaseUrl.replace(/^https?:\/\//, '').split('/')[0]
    const wsUrl = `${wsScheme}://${wsHost}/ws/chat/${activeSession}/?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Chat WebSocket connected.')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'tool_call') {
          // LLM is calling tasks/goals tools
          setActiveTools(data.tools || [])
          setIsThinking(true)
        } else if (data.type === 'chat_chunk') {
          setIsThinking(false)
          setActiveTools([])

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.sender === 'ai' && last.isStreaming) {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + data.chunk },
              ]
            } else {
              return [
                ...prev,
                { id: `stream-${Date.now()}`, sender: 'ai', text: data.chunk, isStreaming: true },
              ]
            }
          })
        } else if (data.type === 'chat_done') {
          setIsThinking(false)
          setActiveTools([])
          setMessages((prev) =>
            prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
          )
          // Refresh sessions in background to pull any updated titles
          fetchSessions(false)
        }
      } catch (err) {
        console.error('Error parsing WS message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('Chat WebSocket error:', err)
    }

    ws.onclose = () => {
      console.log('Chat WebSocket closed.')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [activeSession])

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

  // Trigger Speech-to-Text SpeechRecognition
  const handleToggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      addToast({
        type: 'warning',
        title: 'Speech Recognition Unsupported',
        message: 'Your browser does not support native speech recognition. Please use Google Chrome or Microsoft Edge.',
      })
      return
    }

    if (micActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setMicActive(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setMicActive(true)
        addToast({
          type: 'info',
          title: 'Microphone Active',
          message: 'Listening... Speak your request now.',
        })
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setPromptInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
          addToast({
            type: 'success',
            title: 'Speech Transcribed',
            message: `"${transcript}" added to input.`,
          })
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        let errorMsg = 'Could not capture speech.'
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Enable mic access in your browser settings.'
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech was detected. Please try again.'
        }
        addToast({
          type: 'destructive',
          title: 'Speech Error',
          message: errorMsg,
        })
        setMicActive(false)
      }

      recognition.onend = () => {
        setMicActive(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err)
      setMicActive(false)
    }
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

  // Copy complete assistant response helper
  const handleCopyMessage = (messageText: string, msgId: string) => {
    navigator.clipboard.writeText(messageText)
    setCopiedId(msgId)
    addToast({
      type: 'info',
      title: 'Response Copied',
      message: 'Full response copied to clipboard.',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Client-side text-to-speech speaker handler
  const handleSpeak = (text: string, msgId: string) => {
    if (!synthRef.current) return

    if (activeSpeechId === msgId) {
      synthRef.current.cancel()
      setActiveSpeechId(null)
      return
    }

    synthRef.current.cancel()

    // Clean text by stripping markdown codes and tags
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]+)`/g, '$1')   // remove inline code blocks
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold formatting
      .replace(/\*([^*]+)\*/g, '$1')    // remove italic formatting

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.onend = () => {
      setActiveSpeechId(null)
    }
    utterance.onerror = () => {
      setActiveSpeechId(null)
    }

    setActiveSpeechId(msgId)
    synthRef.current.speak(utterance)
  }

  // Parse markdown for bold, lists, inline code, and code blocks
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
            <div key={idx} className="my-4 rounded-xl overflow-hidden border border-border/80 bg-black/90 shadow-2xl text-emerald-400 font-mono text-[11px] text-left max-w-full">
              <div className="flex justify-between items-center bg-white/5 px-4 py-2.5 border-b border-border/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-primary" /> {language}</span>
                <button
                  onClick={() => handleCopyCode(codeContent, blockId)}
                  className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                >
                  {copiedId === blockId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedId === blockId ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto leading-relaxed">
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
    
    // Simple sanitization/escaping
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h4 class="text-xs font-bold text-foreground mt-3 mb-1.5">$1</h4>')
    html = html.replace(/^## (.*?)$/gm, '<h3 class="text-sm font-bold text-foreground mt-4 mb-2">$1</h3>')
    html = html.replace(/^# (.*?)$/gm, '<h2 class="text-base font-bold text-foreground mt-4 mb-2">$1</h2>')

    // Blockquotes: lines starting with &gt;
    html = html.replace(/^\s*&gt;\s+(.*?)$/gm, '<blockquote class="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground/80 italic bg-primary/5 py-1 pr-2 rounded-r">$1</blockquote>')

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground/90">$1</em>')

    // Inline Code: `code`
    html = html.replace(/`(.*?)`/g, '<code class="bg-primary/10 border border-primary/15 text-primary px-1.5 py-0.5 rounded font-mono text-[10px]">$1</code>')

    // Numbered lists: lines starting with number
    html = html.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li class="list-decimal ml-5 my-1 text-[11px] text-foreground/90 leading-relaxed">$2</li>')

    // Bullets starting with '-' or '*'
    html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="list-disc ml-5 my-1 text-[11px] text-foreground/90 leading-relaxed">$1</li>')

    // Replace newlines with breaks
    html = html.replace(/\n/g, '<br />')

    // Clean extra spacing around tags
    html = html.replace(/(<\/li>|<\/blockquote>|<\/h\d>)<br \/>/g, '$1')

    return html
  }

  const handleSendPrompt = async (e?: React.FormEvent) => {
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

    // Append user message immediately
    setMessages((prev) => [...prev, userMsg])
    setPromptInput('')
    setIsThinking(true)

    // Ensure session exists. If not, create one first.
    let currentSessionId = activeSession
    if (!currentSessionId) {
      try {
        const createRes = await apiClient.post<ChatSession>('/chatbot/session/', {
          title: userText.slice(0, 40) || 'New Conversation'
        })
        currentSessionId = createRes.data.id
        setActiveSession(currentSessionId)
        setSessions((prev) => [createRes.data, ...prev])
      } catch (err: any) {
        setIsThinking(false)
        addToast({
          type: 'destructive',
          title: 'Failed to initialize session',
          message: err.message || 'Please try again.',
        })
        return
      }
    }

    // Try sending via WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: userText }))
    } else {
      // Fallback: use non-streaming HTTP POST
      try {
        const response = await apiClient.post(`/chatbot/session/${currentSessionId}/message/`, {
          message: userText
        })
        setIsThinking(false)
        setMessages((prev) => [
          ...prev,
          {
            id: String(response.data.id),
            sender: 'ai',
            text: response.data.content,
            toolCalls: response.data.tool_calls,
          }
        ])
        fetchSessions(false)
      } catch (err: any) {
        setIsThinking(false)
        addToast({
          type: 'destructive',
          title: 'Failed to send message',
          message: err.message || 'The server could not process your message.',
        })
      }
    }
  }

  const handleStartNewChat = async () => {
    try {
      const res = await apiClient.post<ChatSession>('/chatbot/session/', {
        title: 'New Chat'
      })
      setSessions((prev) => [res.data, ...prev])
      setActiveSession(res.data.id)
      setMessages([])
      addToast({
        type: 'success',
        title: 'New Chat Session',
        message: 'Context cleared for a new topic.',
      })
    } catch (err: any) {
      addToast({
        type: 'destructive',
        title: 'Could not create session',
        message: err.message || 'Please try again.',
      })
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await apiClient.delete(`/chatbot/session/${sessionId}/`)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSession === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
      addToast({
        type: 'success',
        title: 'Session Deleted',
        message: 'The chat history has been cleared.',
      })
    } catch (err: any) {
      addToast({
        type: 'destructive',
        title: 'Error deleting session',
        message: err.message || 'Failed to remove conversation.',
      })
    }
  }

  const handleArchiveSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await apiClient.post(`/chatbot/session/${sessionId}/archive/`)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSession === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
      addToast({
        type: 'success',
        title: 'Session Archived',
        message: 'Conversation archived successfully.',
      })
    } catch (err: any) {
      addToast({
        type: 'destructive',
        title: 'Error archiving session',
        message: err.message || 'Failed to archive conversation.',
      })
    }
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
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">No active conversations.</p>
          ) : (
            sessions.map((ses) => (
              <div
                key={ses.id}
                onClick={() => {
                  setActiveSession(ses.id)
                  addToast({ type: 'info', title: 'Session Swapped', message: `Swapped to "${ses.title}"` })
                }}
                className={cn(
                  'group p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-secondary/40 cursor-pointer text-left space-y-1 transition-all flex justify-between items-start',
                  activeSession === ses.id ? 'bg-card border-border shadow-sm font-semibold' : ''
                )}
              >
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs text-foreground truncate">{ses.title}</h5>
                  <p className="text-[10px] text-muted-foreground truncate">{ses.snippet || 'Click to resume conversation'}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button
                    onClick={(e) => handleArchiveSession(ses.id, e)}
                    className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded"
                    title="Archive Session"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(ses.id, e)}
                    className="p-1 hover:bg-secondary text-muted-foreground hover:text-red-500 rounded"
                    title="Delete Session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 2. Main Column: Chat Screen */}
      <div className="lg:col-span-3 flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
        {/* Top bar info */}
        <div className="p-4 border-b border-border/40 bg-secondary/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                Last Minute Coach <Sparkles className="h-3.5 w-3.5 text-primary fill-primary animate-pulse" />
              </h4>
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> Live context synced
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable messages pane */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground tracking-wider">Loading conversation history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl shadow-xl shadow-primary/5">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">Meet your Intelligent Productivity Coach</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Ask questions about code, ask to schedule focus blocks, or inspect your tasks, goals, and habits. Let's get things shipped!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                {/* AI Avatar */}
                {msg.sender === 'ai' && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm mt-0.5 animate-in zoom-in duration-200">
                    <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4.5 py-3 text-[13px] leading-relaxed space-y-3 text-left transition-all duration-250 relative group/msg shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground shadow-md font-medium rounded-tr-none border border-primary-foreground/5'
                      : 'bg-secondary/35 text-foreground/95 border border-border/70 rounded-tl-none backdrop-blur-sm hover:border-primary/20 hover:shadow-md'
                  )}
                >
                  {/* Message hover toolbar */}
                  {msg.sender === 'ai' && !msg.isStreaming && (
                    <div className="absolute right-3 -bottom-7 opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 shadow-md transition-all duration-200 z-10">
                      <button
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleSpeak(msg.text, msg.id)}
                        className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors"
                        title={activeSpeechId === msg.id ? 'Stop Reading' : 'Read Aloud'}
                      >
                        {activeSpeechId === msg.id ? <VolumeX className="h-3 w-3 text-primary animate-pulse" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                    </div>
                  )}

                  {/* Tool execution notice */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border/30 text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                      <span>Refreshed Context:</span>
                      {msg.toolCalls.map((t) => (
                        <Badge key={t} variant="outline" className="text-[8px] bg-background/50 border-border px-1.5 py-0.5">
                          {t.replace('get_', '')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Text render */}
                  <div className="text-[13px] space-y-1">
                    {renderMessageContent(msg.text, msg.id)}
                  </div>

                  {/* Staged Attachment render */}
                  {msg.attachment && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-black/10 border border-current/10">
                      <File className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-grow">
                        <div className="font-semibold truncate text-[10px]">{msg.attachment.name}</div>
                        <div className="opacity-80 text-[8px]">{msg.attachment.size}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-primary border border-primary-foreground/10 flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-[10px] font-bold text-primary-foreground animate-in zoom-in duration-200">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {/* Active Tool Calls status display */}
          {activeTools.length > 0 && (
            <div className="flex items-start gap-3 justify-start">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              </div>
              <div className="bg-secondary/30 text-foreground/80 border border-border/40 rounded-2xl rounded-tl-none px-4 py-3 flex flex-col gap-1.5 text-[10px] shadow-sm max-w-sm">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> Consulting Database...
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeTools.map(t => (
                    <Badge key={t} variant="secondary" className="text-[8px] px-1.5 py-0">
                      fetching {t.replace('get_', '')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Premium Skeleton/Pulse Typing State */}
          {isThinking && activeTools.length === 0 && (
            <div className="flex items-start gap-3 justify-start animate-pulse">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
              </div>
              <div className="bg-secondary/40 text-foreground border border-border/80 rounded-2xl rounded-tl-none px-5 py-4 flex flex-col gap-2 shadow-sm min-w-[200px] max-w-[280px]">
                <div className="h-2 w-3/4 bg-muted-foreground/15 rounded-full" />
                <div className="h-2 w-full bg-muted-foreground/15 rounded-full" />
                <div className="h-2 w-5/6 bg-muted-foreground/15 rounded-full" />
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
