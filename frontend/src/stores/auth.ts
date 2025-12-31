import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  name: string
  email: string
  phone?: string
  id_card?: string           // 身份证号码
  emergency_contact?: string // 紧急联系人
  emergency_phone?: string   // 紧急联系人电话
  department?: string
  position?: string          // 职位
  bio?: string               // 个人简介
  avatar?: string
  role: 'admin' | 'member'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  last_login?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'atlas-auth',
    }
  )
)

