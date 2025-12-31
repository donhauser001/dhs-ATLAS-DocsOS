import { create } from 'zustand'

interface PageState {
  title: string
  subtitle?: string
  
  setTitle: (title: string, subtitle?: string) => void
  reset: () => void
}

export const usePageStore = create<PageState>((set) => ({
  title: '',
  subtitle: undefined,
  
  setTitle: (title, subtitle) => set({ title, subtitle }),
  reset: () => set({ title: '', subtitle: undefined }),
}))
