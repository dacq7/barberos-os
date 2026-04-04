import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  createServicio,
  getAdminServicios,
  updateServicio,
} from '../../services/admin.service'
import type { Servicio } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

// ── Form types ────────────────────────────────────────────────────────────────

interface ServicioForm {
  nombre: string
  descripcion: string
  precio: number
  activo: boolean
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ServicioModal({
  servicio,
  onClose,
  onSuccess,
}: {
  servicio: Servicio | null // null = crear nuevo
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = servicio !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServicioForm>({
    defaultValues: {
      nombre: servicio?.nombre ?? '',
      descripcion: servicio?.descripcion ?? '',
      precio: servicio ? Number(servicio.precio) : 0,
      activo: servicio?.activo ?? true,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ServicioForm) =>
      createServicio({
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        precio: data.precio,
      }),
    onSuccess,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ServicioForm) =>
      updateServicio(servicio!.id, {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        precio: data.precio,
        activo: data.activo,
      }),
    onSuccess,
  })

  const mutation = isEdit ? updateMutation : createMutation
  const isPending = mutation.isPending

  function onSubmit(data: ServicioForm) {
    mutation.mutate(data)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">
            {isEdit ? 'Editar servicio' : 'Agregar servicio'}
          </h3>
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
              placeholder="Ej. Corte + Arreglo de barba"
            />
            {errors.nombre && (
              <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={2}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c] resize-none"
              placeholder="Descripción breve del servicio"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Precio (COP) *</label>
            <input
              {...register('precio', {
                required: 'Obligatorio',
                min: { value: 1000, message: 'Precio mínimo $1.000' },
                valueAsNumber: true,
              })}
              type="number"
              min="0"
              step="1000"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder="35000"
            />
            {errors.precio && (
              <p className="text-red-400 text-xs mt-1">{errors.precio.message}</p>
            )}
          </div>

          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...register('activo')}
                type="checkbox"
                className="w-4 h-4 accent-[#c9a84c]"
              />
              <span className="text-sm text-neutral-300">Servicio activo</span>
            </label>
          )}

          {mutation.isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              No se pudo guardar el servicio. Intenta de nuevo.
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
              disabled={isPending}
              className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminServicios() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ open: boolean; servicio: Servicio | null }>({
    open: false,
    servicio: null,
  })

  const { data: servicios, isLoading } = useQuery({
    queryKey: ['admin-servicios'],
    queryFn: getAdminServicios,
  })

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['admin-servicios'] })
    setModal({ open: false, servicio: null })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Servicios</h1>
        <button
          onClick={() => setModal({ open: true, servicio: null })}
          className="bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Agregar servicio
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!servicios || servicios.length === 0) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">No hay servicios registrados</p>
          <button
            onClick={() => setModal({ open: true, servicio: null })}
            className="mt-4 text-[#c9a84c] text-sm hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      )}

      {!isLoading && servicios && servicios.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Servicio</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3 hidden sm:table-cell">
                  Descripción
                </th>
                <th className="text-right text-neutral-400 font-medium px-4 py-3">Precio</th>
                <th className="text-center text-neutral-400 font-medium px-4 py-3">Estado</th>
                <th className="text-right text-neutral-400 font-medium px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {servicios.map((s) => (
                <tr
                  key={s.id}
                  className="bg-neutral-900 hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{s.nombre}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-neutral-400 text-xs line-clamp-2 max-w-xs">
                      {s.descripcion ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[#c9a84c] font-semibold">
                      {formatCOP(s.precio)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        s.activo
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal({ open: true, servicio: s })}
                      className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <ServicioModal
          servicio={modal.servicio}
          onClose={() => setModal({ open: false, servicio: null })}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
