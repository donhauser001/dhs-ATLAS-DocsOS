import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatStore, type ChatMessage } from '@/stores/chat'
import { cn } from '@/lib/utils'
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  MoreHorizontal,
  Loader2,
  Copy,
  Check,
  GripVertical,
} from 'lucide-react'

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 360

export function ChatPanel() {
  const {
    isOpen,
    messages,
    inputValue,
    isLoading,
    closePanel,
    setInputValue,
    addMessage,
    clearMessages,
    setLoading,
  } = useChatStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('chat-panel-width')
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // 保存宽度
  useEffect(() => {
    localStorage.setItem('chat-panel-width', String(width))
  }, [width])

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return
      const rect = panelRef.current.getBoundingClientRect()
      const newWidth = rect.right - e.clientX
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isLoading) return

    addMessage({ role: 'user', content })
    setInputValue('')
    setLoading(true)

    // 模拟 AI 回复（后续接入真实 API）
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `收到您的消息：「${content}」\n\n我是 ATLAS AI 助手，目前正在开发中。后续我将能够：\n- 帮您查询项目和任务状态\n- 辅助创建和管理服务定价\n- 回答关于系统使用的问题\n- 执行各种自动化操作`,
      })
      setLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="relative flex rounded-2xl bg-background border shadow-sm overflow-hidden"
      style={{ width }}
    >
      {/* 拖拽手柄 */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10',
          'flex items-center justify-center',
          'hover:bg-accent/50 transition-colors',
          isDragging && 'bg-accent'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>

      {/* 主内容 */}
      <div className="flex flex-col flex-1 ml-3">
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none">AI 助手</h3>
              <p className="text-xs text-muted-foreground mt-0.5">随时为您服务</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border bg-popover shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        clearMessages()
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      清空对话
                    </button>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closePanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopy={handleCopy}
                  copied={copiedId === message.id}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">思考中...</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="flex-1 h-9 bg-muted/50 border-transparent focus:border-border"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 拖拽时的遮罩，防止选中文字 */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Bot className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-sm mb-1">有什么可以帮您？</h4>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        我可以帮您查询信息、创建内容、执行操作
      </p>
      <div className="mt-4 space-y-1.5 w-full max-w-[200px]">
        <SuggestionButton text="查看今日待办" />
        <SuggestionButton text="新建服务定价" />
        <SuggestionButton text="使用帮助" />
      </div>
    </div>
  )
}

function SuggestionButton({ text }: { text: string }) {
  const { setInputValue } = useChatStore()

  return (
    <button
      onClick={() => setInputValue(text)}
      className="w-full px-4 py-2 text-xs text-left rounded-full border bg-background hover:bg-accent transition-colors"
    >
      {text}
    </button>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  onCopy: (id: string, content: string) => void
  copied: boolean
}

function MessageBubble({ message, onCopy, copied }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn('flex-1 min-w-0', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block max-w-full rounded-xl px-3 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && (
            <button
              onClick={() => onCopy(message.id, message.content)}
              className="p-0.5 rounded hover:bg-accent transition-colors"
              title="复制"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
