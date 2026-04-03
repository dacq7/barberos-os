import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole, Admin, Barbero } from '../types'
import { TOKEN_KEY } from '../services/api'

type AuthUser = Admin | Barbero

interface AuthState {
  token: string | null
  role: UserRole | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string, role: UserRole, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      isAuthenticated: false,

      login: (token, role, user) => {
        localStorage.setItem(TOKEN_KEY, token)
        set({ token, role, user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        set({ token: null, role: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'barber_auth',
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
