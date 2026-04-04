import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoCita,
  getAdminCitas,
  registrarPago,
} from '../../services/admin.service'
import { formatFechaHora } from '../../utils/date'
import type { CitaDetalle, EstadoCita } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

const ESTADO_BADGE: Record<EstadoCita, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',     cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  confirmada: { label: 'Confirmada',    cls: 'bg-green-500/15  text-green-400  border-green-500/30'  },
  completada: { label: 'Completada',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30'   },
  cancelada:  { label: 'Cancelada',     cls: 'bg-red-500/15    text-red-400    border-red-500/30'    },
  no_show:    { label: 'No presentado', cls: 'bg-neutral-700   text-neutral-400 border-neutral-600'  },
}

const ESTADOS: EstadoCita[] = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_show']

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalState {
  cita: CitaDetalle
  nuevoEstado: EstadoCita
  monto: string
}

function CambiarEstadoModal({
  state,
  onEstadoChange,
  onMontoChange,
  onConfirm,
  onClose,
  isPending,
  error,
}: {
  state: ModalState
  onEstadoChange: (e: EstadoCita) => void
  onMontoChange: (m: string) => void
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
  error: boolean
}) {
  const { cita, nuevoEstado, monto } = state
  const needsPago = nuevoEstado === 'completada'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold">Cambiar estado</h3>
            <p className="text-neutral-400 text-sm mt-0.5">
              {cita.cliente.nombre} · {cita.servicio.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-2">Nuevo estado</label>
          <select
            value={nuevoEstado}
            onChange={(e) => onEstadoChange(e.target.value as EstadoCita)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
          >
            {ESTADOS.filter((e) => e !== cita.estado).map((e) => (
              <option key={e} value={e}>
                {ESTADO_BADGE[e].label}
              </option>
            ))}
          </select>
        </div>

        {needsPago && (
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Monto total del servicio (COP)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={monto}
              onChange={(e) => onMontoChange(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              placeholder={String(cita.servicio.precio)}
            />
            <p className="text-neutral-500 text-xs mt-1">
              Precio del servicio: {formatCOP(cita.servicio.precio)}
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            No se pudo actualizar. Intenta de nuevo.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending || (needsPago && !monto)}
            className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {isPending ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCitas() {
  const queryClient = useQueryClient()

  const [filterEstado, setFilterEstado] = useState<EstadoCita | ''>('')
  const [filterFecha, setFilterFecha] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [mutError, setMutError] = useState(false)

  const { data: citas, isLoading } = useQuery({
    queryKey: ['admin-citas'],
    queryFn: getAdminCitas,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCita }) =>
      cambiarEstadoCita(id, estado),
    onSuccess: (_, vars) => {
      if (vars.estado === 'completada' && modal && modal.monto) {
        pagoMutation.mutate({
          citaId: modal.cita.id,
          monto: Number(modal.monto),
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-citas'] })
        setModal(null)
      }
    },
    onError: () => setMutError(true),
  })

  const pagoMutation = useMutation({
    mutationFn: ({ citaId, monto }: { citaId: string; monto: number }) =>
      registrarPago({ cita_id: citaId, monto_total: monto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-citas'] })
      setModal(null)
    },
    onError: () => setMutError(true),
  })

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = (citas ?? []).filter((c) => {
    if (filterEstado && c.estado !== filterEstado) return false
    if (filterFecha) {
      const citaDate = new Date(c.fecha_hora).toLocaleDateString('en-CA') // YYYY-MM-DD
      if (citaDate !== filterFecha) return false
    }
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime(),
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openModal(cita: CitaDetalle) {
    const nextEstado = ESTADOS.find((e) => e !== cita.estado) ?? 'confirmada'
    setMutError(false)
    setModal({
      cita,
      nuevoEstado: nextEstado,
      monto: String(cita.servicio.precio),
    })
  }

  function handleConfirm() {
    if (!modal) return
    estadoMutation.mutate({ id: modal.cita.id, estado: modal.nuevoEstado })
  }

  const isPending = estadoMutation.isPending || pagoMutation.isPending

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Citas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value as EstadoCita | '')}
          className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c]"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_BADGE[e].label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterFecha}
          onChange={(e) => setFilterFecha(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
        />

        {(filterEstado || filterFecha) && (
          <button
            onClick={() => { setFilterEstado(''); setFilterFecha('') }}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
          >
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto text-neutral-500 text-sm self-center">
          {sorted.length} {sorted.length === 1 ? 'cita' : 'citas'}
        </span>
      </div>

      {/* Tabla */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">No hay citas que coincidan con los filtros</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Cliente</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3 hidden md:table-cell">
                  Servicio
                </th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3 hidden lg:table-cell">
                  Barbero
                </th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Fecha</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Estado</th>
                <th className="text-right text-neutral-400 font-medium px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {sorted.map((c) => {
                const { label, cls } = ESTADO_BADGE[c.estado]
                const isDone = c.estado === 'completada' || c.estado === 'cancelada' || c.estado === 'no_show'
                return (
                  <tr key={c.id} className="bg-neutral-900 hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.cliente.nombre}</p>
                      {c.cliente.email && (
                        <p className="text-neutral-500 text-xs truncate max-w-[160px]">
                          {c.cliente.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-white">{c.servicio.nombre}</p>
                      <p className="text-[#c9a84c] text-xs">{formatCOP(c.servicio.precio)}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-neutral-300">
                      {c.barbero.nombre}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                      {formatFechaHora(c.fecha_hora)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isDone && (
                        <button
                          onClick={() => openModal(c)}
                          className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cambiar estado
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CambiarEstadoModal
          state={modal}
          onEstadoChange={(e) => setModal({ ...modal, nuevoEstado: e })}
          onMontoChange={(m) => setModal({ ...modal, monto: m })}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
          isPending={isPending}
          error={mutError}
        />
      )}
    </div>
  )
}
