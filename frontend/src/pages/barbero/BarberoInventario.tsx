import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { getBarberoInventario, reportarAgotamiento } from '../../services/barbero.service'
import type { Inventario } from '../../types'

// ── Modal ─────────────────────────────────────────────────────────────────────

interface AlertaForm {
  mensaje: string
}

function ReportarModal({
  producto,
  onClose,
  onSuccess,
}: {
  producto: Inventario
  onClose: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit } = useForm<AlertaForm>()

  const mutation = useMutation({
    mutationFn: ({ mensaje }: AlertaForm) =>
      reportarAgotamiento({
        inventario_id: producto.id,
        mensaje: mensaje || undefined,
      }),
    onSuccess,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Reportar agotamiento</h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-neutral-400 text-sm mb-4">
          Producto:{' '}
          <span className="text-white font-medium">{producto.nombre}</span>
        </p>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">
              Mensaje (opcional)
            </label>
            <textarea
              {...register('mensaje')}
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c] resize-none"
              placeholder="Ej. Se acabó completamente, hay que pedir urgente"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              No se pudo enviar el reporte. Intenta de nuevo.
            </p>
          )}

          <div className="flex gap-3">
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
              {mutation.isPending ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bajo stock badge ──────────────────────────────────────────────────────────

function StockBadge({ producto }: { producto: Inventario }) {
  const isBajo =
    producto.umbral_minimo !== null && producto.cantidad <= producto.umbral_minimo

  if (!isBajo) return null

  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
      Bajo stock
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BarberoInventario() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<Inventario | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const { data: inventario, isLoading } = useQuery({
    queryKey: ['barbero-inventario'],
    queryFn: getBarberoInventario,
  })

  function handleSuccess() {
    if (modal) setSuccessId(modal.id)
    setModal(null)
    queryClient.invalidateQueries({ queryKey: ['barbero-inventario'] })
    setTimeout(() => setSuccessId(null), 3000)
  }

  const bajosDeStock = (inventario ?? []).filter(
    (p) => p.umbral_minimo !== null && p.cantidad <= p.umbral_minimo,
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Inventario</h1>

      {/* Alerta resumen */}
      {bajosDeStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {bajosDeStock.length}{' '}
          {bajosDeStock.length === 1 ? 'producto está' : 'productos están'} bajo el
          nivel mínimo de stock.
        </div>
      )}

      {/* Toast de éxito */}
      {successId && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          Reporte enviado correctamente.
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!inventario || inventario.length === 0) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">No hay productos en inventario</p>
        </div>
      )}

      {!isLoading && inventario && inventario.length > 0 && (
        <div className="space-y-2">
          {inventario.map((p) => {
            const isBajo =
              p.umbral_minimo !== null && p.cantidad <= p.umbral_minimo

            return (
              <div
                key={p.id}
                className={`bg-neutral-900 border rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                  isBajo ? 'border-red-500/30' : 'border-neutral-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium">{p.nombre}</p>
                    <StockBadge producto={p} />
                  </div>
                  <p className="text-neutral-400 text-sm mt-0.5">
                    <span
                      className={`font-semibold tabular-nums ${
                        isBajo ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      {p.cantidad}
                    </span>
                    {p.unidad && (
                      <span className="text-neutral-500 ml-1">{p.unidad}</span>
                    )}
                    {p.umbral_minimo !== null && (
                      <span className="text-neutral-600 ml-2">
                        mín. {p.umbral_minimo}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setModal(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                    isBajo
                      ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
                  }`}
                >
                  Reportar
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ReportarModal
          producto={modal}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
