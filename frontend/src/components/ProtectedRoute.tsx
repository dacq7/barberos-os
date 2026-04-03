import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../types'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  requiredRole: UserRole
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={`/${requiredRole}/login`} replace />
  }

  if (role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
