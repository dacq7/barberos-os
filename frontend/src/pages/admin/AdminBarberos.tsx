import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createBarbero, getAdminBarberos } from '../../services/admin.service'
import type { BarberoCreateRequest } from '../../types'

// ── Avatar ────────────────────────────────────────────────────────────────────

function BarberoAvatar({ id, nombre, fotoUrl }: { id: string; nombre: string; fotoUrl: string | null }) {
  const [err, setErr] = useState(false)
  const src = fotoUrl ?? `/images/barbers/${id}.png`

  if (err) {
    return (
      <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
        {nombre[0].toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={nombre}
      onError={() => setErr(true)}
      className="w-14 h-14 rounded-full object-cover bg-neutral-700 shrink-0"
    />
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function AgregarBarberoModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BarberoCreateRequest>()

  const mutation = useMutation({
    mutationFn: createBarbero,
    onSuccess,
  })

  function onSubmit(data: BarberoCreateRequest) {
    mutation.mutate(data)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Agregar barbero</h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Nombre *</label>
            <input
              {...register('nombre', { required: 'Obligatorio' })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder="Nombre completo"
            />
            {errors.nombre && (
              <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Email *</label>
            <input
              {...register('email', {
                required: 'Obligatorio',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
              })}
              type="email"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder="barbero@email.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Contraseña *</label>
            <input
              {...register('password', {
                required: 'Obligatorio',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              type="password"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder="Contraseña de acceso"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Teléfono</label>
            <input
              {...register('telefono')}
              type="tel"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder="300 000 0000"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              No se pudo crear el barbero. Verifica que el email no esté en uso.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {mutation.isPending ? 'Creando…' : 'Crear barbero'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminBarberos() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: barberos, isLoading } = useQuery({
    queryKey: ['admin-barberos'],
    queryFn: getAdminBarberos,
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['admin-barberos'] })
    setShowModal(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Barberos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Agregar barbero
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!barberos || barberos.length === 0) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">No hay barberos registrados</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-[#c9a84c] text-sm hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      )}

      {!isLoading && barberos && barberos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barberos.map((b) => (
            <div
              key={b.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4"
            >
              <BarberoAvatar id={b.id} nombre={b.nombre} fotoUrl={b.foto_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold truncate">{b.nombre}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      b.activo
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {b.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-neutral-400 text-sm truncate">{b.email}</p>
                {b.telefono && (
                  <p className="text-neutral-500 text-xs mt-0.5">{b.telefono}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AgregarBarberoModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
