import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { loginAdmin } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import type { Admin } from '../../types'

interface FormValues {
  email: string
  password: string
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const tokenRes = await loginAdmin(values.email, values.password)
      const payload = decodeJwtPayload(tokenRes.access_token)
      const user: Admin = {
        id: String(payload.sub ?? ''),
        nombre: values.email,
        email: values.email,
        activo: true,
      }
      login(tokenRes.access_token, 'admin', user)
      navigate('/admin/dashboard')
    } catch {
      setServerError('Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-bold tracking-tight text-[#c9a84c]">
            Barber<span className="text-white">OS</span>
          </span>
          <p className="mt-2 text-neutral-400 text-sm">Panel de administración</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm text-neutral-300 mb-1.5" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition"
                placeholder="admin@barberos.com"
                {...register('email', {
                  required: 'El correo es obligatorio',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-neutral-300 mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition"
                placeholder="••••••••"
                {...register('password', { required: 'La contraseña es obligatoria' })}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-2.5">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg px-4 py-2.5 transition"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
