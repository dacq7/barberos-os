import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelarCita, getCita, getDisponibilidad, reagendarCita } from '../../services/public.service'
import { brand } from '../../config/brand'
import { formatFecha, formatHora } from '../../utils/date'
import type { EstadoCita } from '../../types'

const today = new Date().toISOString().split('T')[0]
const maxDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
})()

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCOP(value: string | number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

const ESTADO_BADGE: Record<EstadoCita, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',      cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  confirmada: { label: 'Confirmada',     cls: 'bg-green-500/15  text-green-400  border-green-500/30'  },
  completada: { label: 'Completada',     cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30'   },
  cancelada:  { label: 'Cancelada',      cls: 'bg-red-500/15    text-red-400    border-red-500/30'    },
  no_show:    { label: 'No presentado',  cls: 'bg-neutral-700   text-neutral-400 border-neutral-600'  },
}

function EstadoBadge({ estado }: { estado: EstadoCita }) {
  const { label, cls } = ESTADO_BADGE[estado]
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-400 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CitaPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()

  const isNuevo = location.state?.nuevo === true

  const {
    data: cita,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['cita', id],
    queryFn: () => getCita(id!),
    enabled: !!id,
  })

  const [showReagendar, setShowReagendar] = useState(false)
  const [reagFecha, setReagFecha] = useState('')
  const [reagSlot, setReagSlot] = useState<string | null>(null)

  const cancelMutation = useMutation({
    mutationFn: () => cancelarCita(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cita', id] })
    },
  })

  const { data: disponibilidad, isLoading: loadingSlots } = useQuery({
    queryKey: ['disponibilidad', cita?.barbero_id, reagFecha],
    queryFn: () => getDisponibilidad(cita!.barbero_id, reagFecha),
    enabled: showReagendar && !!reagFecha && !!cita,
  })
  const availableSlots = disponibilidad?.slots.filter((s) => s.disponible) ?? []

  const reagendarMutation = useMutation({
    mutationFn: () => reagendarCita(id!, `${reagFecha}T${reagSlot}:00`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cita', id] })
      setShowReagendar(false)
      setReagFecha('')
      setReagSlot(null)
    },
  })

  const canCancel = cita?.estado === 'pendiente' || cita?.estado === 'confirmada'
  const canReagendar = cita?.estado !== 'cancelada' && cita?.estado !== 'completada'

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/brand/logo.png" alt={brand.nombre} className="h-8 w-auto" />
          </Link>
          <span className="text-neutral-400 text-sm">Tu cita</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Confirmación nueva */}
        {isNuevo && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <p className="text-green-400 font-semibold">¡Reserva confirmada!</p>
            <p className="text-neutral-400 text-sm mt-1">
              Guarda esta página para consultar o cancelar tu cita.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[80, 64, 48].map((h) => (
              <div
                key={h}
                style={{ height: h }}
                className="bg-neutral-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">Cita no encontrada</p>
            <Link
              to="/"
              className="text-[#c9a84c] text-sm mt-4 inline-block hover:underline"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        {/* Contenido */}
        {cita && (() => {
          const fecha = formatFecha(cita.fecha_hora)
          const hora = formatHora(cita.fecha_hora)
          return (
            <>
              {/* Detalle */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
                {/* Header card */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">
                      Código de cita
                    </p>
                    <p className="text-neutral-400 text-xs font-mono break-all">{cita.id}</p>
                  </div>
                  <EstadoBadge estado={cita.estado} />
                </div>

                <hr className="border-neutral-800" />

                {/* Info del servicio */}
                <div className="space-y-3">
                  <Row label="Servicio" value={cita.servicio.nombre} />
                  <Row label="Barbero" value={cita.barbero.nombre} />
                  <Row label="Precio" value={formatCOP(cita.servicio.precio)} />
                  <Row label="Fecha" value={fecha} />
                  <Row label="Hora" value={hora} />
                  {cita.notas && <Row label="Notas" value={cita.notas} />}
                </div>

                <hr className="border-neutral-800" />

                {/* Info del cliente */}
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Cliente</p>
                  <Row label="Nombre" value={cita.cliente.nombre} />
                  {cita.cliente.email && <Row label="Email" value={cita.cliente.email} />}
                  {cita.cliente.telefono && (
                    <Row label="Teléfono" value={cita.cliente.telefono} />
                  )}
                </div>
              </div>

              {/* Cancelar */}
              {canCancel && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-1">Cancelar cita</h3>
                  <p className="text-neutral-400 text-sm mb-4">
                    Puedes cancelar hasta 1 hora antes de tu cita.
                  </p>

                  {cancelMutation.isError && (
                    <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      No se pudo cancelar. Es posible que el tiempo mínimo de cancelación haya pasado.
                    </p>
                  )}

                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="w-full border border-red-500/50 hover:bg-red-500/10 text-red-400 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar cita'}
                  </button>
                </div>
              )}

              {/* Reagendar */}
              {canReagendar && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-1">Reagendar cita</h3>
                  <p className="text-neutral-400 text-sm mb-4">
                    Elige una nueva fecha y hora para tu cita.
                  </p>

                  {!showReagendar ? (
                    <button
                      onClick={() => setShowReagendar(true)}
                      className="w-full bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold py-3 rounded-xl transition-colors"
                    >
                      Reagendar cita
                    </button>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm text-neutral-400 mb-2">Nueva fecha</label>
                        <input
                          type="date"
                          min={today}
                          max={maxDate}
                          value={reagFecha}
                          onChange={(e) => {
                            setReagFecha(e.target.value)
                            setReagSlot(null)
                          }}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] [color-scheme:dark]"
                        />
                      </div>

                      {reagFecha && (
                        <div>
                          <label className="block text-sm text-neutral-400 mb-3">
                            Horarios disponibles
                          </label>

                          {loadingSlots && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-10 bg-neutral-800 rounded-lg animate-pulse" />
                              ))}
                            </div>
                          )}

                          {!loadingSlots && availableSlots.length === 0 && (
                            <p className="text-neutral-500 text-center py-6">
                              No hay disponibilidad ese día
                            </p>
                          )}

                          {!loadingSlots && availableSlots.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot.hora}
                                  onClick={() => setReagSlot(slot.hora)}
                                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                                    reagSlot === slot.hora
                                      ? 'bg-[#c9a84c] text-black'
                                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                  }`}
                                >
                                  {slot.hora.slice(0, 5)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {reagendarMutation.isError && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                          No se pudo reagendar. El slot puede ya no estar disponible.
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowReagendar(false)
                            setReagFecha('')
                            setReagSlot(null)
                          }}
                          className="flex-1 border border-neutral-700 hover:border-neutral-500 text-white py-3 rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          disabled={!reagSlot || reagendarMutation.isPending}
                          onClick={() => reagendarMutation.mutate()}
                          className="flex-1 bg-[#c9a84c] hover:bg-[#b8973e] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition-colors"
                        >
                          {reagendarMutation.isPending ? 'Reagendando...' : 'Confirmar reagendado'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pb-4">
                <Link to="/" className="text-neutral-500 text-sm hover:text-white transition-colors">
                  Volver al inicio
                </Link>
              </div>
            </>
          )
        })()}
      </main>
    </div>
  )
}
