import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatState {
  // 面板状态
  isOpen: boolean
  
  // 消息
  messages: ChatMessage[]
  
  // 输入
  inputValue: string
  isLoading: boolean
  
  // Actions
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  
  setInputValue: (value: string) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      inputValue: '',
      isLoading: false,

      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
      openPanel: () => set({ isOpen: true }),
      closePanel: () => set({ isOpen: false }),

      setInputValue: (value) => set({ inputValue: value }),

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
        }
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
      },

      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'atlas-chat',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // 只保留最近50条
      }),
    }
  )
)
