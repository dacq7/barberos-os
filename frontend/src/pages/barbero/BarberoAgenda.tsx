import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cambiarEstadoCitaBarbero, getCitasBarbero } from '../../services/barbero.service'
import type { CitaDetalle, EstadoCita } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

function toDateKey(fechaHora: string): string {
  return new Date(fechaHora).toLocaleDateString('en-CA') // YYYY-MM-DD
}

function toHora(fechaHora: string): string {
  return new Date(fechaHora).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ESTADO_BADGE: Record<EstadoCita, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',     cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  confirmada: { label: 'Confirmada',    cls: 'bg-green-500/15  text-green-400  border-green-500/30'  },
  completada: { label: 'Completada',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30'   },
  cancelada:  { label: 'Cancelada',     cls: 'bg-red-500/15    text-red-400    border-red-500/30'    },
  no_show:    { label: 'No presentado', cls: 'bg-neutral-700   text-neutral-400 border-neutral-600'  },
}

// ── Cita card (timeline item) ─────────────────────────────────────────────────

function CitaCard({
  cita,
  onCompletar,
  onNoShow,
  isLoading,
}: {
  cita: CitaDetalle
  onCompletar: () => void
  onNoShow: () => void
  isLoading: boolean
}) {
  const { label, cls } = ESTADO_BADGE[cita.estado]
  const canComplete = cita.estado === 'confirmada'
  const canNoShow = cita.estado === 'pendiente' || cita.estado === 'confirmada'

  return (
    <div className="flex gap-4">
      {/* Timeline rail */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-3 h-3 rounded-full border-2 mt-1 ${
            cita.estado === 'completada'
              ? 'bg-blue-400 border-blue-400'
              : cita.estado === 'cancelada' || cita.estado === 'no_show'
              ? 'bg-neutral-600 border-neutral-600'
              : 'bg-[#c9a84c] border-[#c9a84c]'
          }`}
        />
        <div className="w-px flex-1 bg-neutral-800 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#c9a84c] font-mono text-sm font-semibold">
                  {toHora(cita.fecha_hora)}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                  {label}
                </span>
              </div>
              <p className="text-white font-semibold mt-1">{cita.cliente.nombre}</p>
              {cita.cliente.telefono && (
                <p className="text-neutral-500 text-xs">{cita.cliente.telefono}</p>
              )}
            </div>
          </div>

          {/* Servicio */}
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 text-sm">{cita.servicio.nombre}</span>
          </div>

          {/* Notas */}
          {cita.notas && (
            <p className="text-neutral-500 text-xs bg-neutral-800 rounded-lg px-3 py-2">
              {cita.notas}
            </p>
          )}

          {/* Acciones */}
          {(canComplete || canNoShow) && (
            <div className="flex gap-2 pt-1">
              {canComplete && (
                <button
                  onClick={onCompletar}
                  disabled={isLoading}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Marcar completada
                </button>
              )}
              {canNoShow && (
                <button
                  onClick={onNoShow}
                  disabled={isLoading}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  No show
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BarberoAgenda() {
  const queryClient = useQueryClient()
  const [fecha, setFecha] = useState(today)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: citas, isLoading } = useQuery({
    queryKey: ['barbero-citas'],
    queryFn: getCitasBarbero,
  })

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCita }) =>
      cambiarEstadoCitaBarbero(id, estado),
    onMutate: ({ id }) => setLoadingId(id),
    onSettled: () => {
      setLoadingId(null)
      queryClient.invalidateQueries({ queryKey: ['barbero-citas'] })
    },
  })

  const citasDelDia = (citas ?? [])
    .filter((c) => toDateKey(c.fecha_hora) === fecha)
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))

  const fechaLabel = new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Agenda</h1>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
        />
      </div>

      <p className="text-neutral-400 text-sm capitalize">{fechaLabel}</p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && citasDelDia.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-16 text-center">
          <p className="text-neutral-500">No hay citas para este día</p>
        </div>
      )}

      {!isLoading && citasDelDia.length > 0 && (
        <div className="space-y-0">
          {citasDelDia.map((c) => (
            <CitaCard
              key={c.id}
              cita={c}
              isLoading={loadingId === c.id}
              onCompletar={() => estadoMutation.mutate({ id: c.id, estado: 'completada' })}
              onNoShow={() => estadoMutation.mutate({ id: c.id, estado: 'no_show' })}
            />
          ))}
          {/* End of timeline */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-neutral-700 mt-1" />
            </div>
            <div className="pb-2" />
          </div>
        </div>
      )}

      {/* Resumen del día */}
      {!isLoading && citasDelDia.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { label: 'Total', count: citasDelDia.length, cls: 'text-white' },
              { label: 'Confirmadas', count: citasDelDia.filter((c) => c.estado === 'confirmada' || c.estado === 'completada').length, cls: 'text-[#c9a84c]' },
              { label: 'Pendientes', count: citasDelDia.filter((c) => c.estado === 'pendiente').length, cls: 'text-yellow-400' },
            ] as const
          ).map(({ label, count, cls }) => (
            <div
              key={label}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-center"
            >
              <p className={`text-xl font-bold ${cls}`}>{count}</p>
              <p className="text-neutral-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
