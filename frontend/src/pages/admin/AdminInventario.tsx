import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  getAdminInventario,
  crearProducto,
  actualizarProducto,
  getAlertasInventario,
} from '../../services/admin.service'
import type { Inventario, InventarioCreate, InventarioUpdate } from '../../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBajoStock(p: Inventario): boolean {
  return p.umbral_minimo !== null && p.cantidad <= p.umbral_minimo
}

function formatFechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ProductoForm {
  nombre: string
  cantidad: number
  unidad: string
  umbral_minimo: number
}

function ProductoModal({
  producto,
  onClose,
}: {
  producto: Inventario | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = producto !== null

  const { register, handleSubmit, formState: { errors } } = useForm<ProductoForm>({
    defaultValues: producto
      ? {
          nombre:         producto.nombre,
          cantidad:       producto.cantidad,
          unidad:         producto.unidad ?? '',
          umbral_minimo:  producto.umbral_minimo ?? 0,
        }
      : { nombre: '', cantidad: 0, unidad: '', umbral_minimo: 0 },
  })

  const crearMutation = useMutation({
    mutationFn: (data: ProductoForm) => {
      const payload: InventarioCreate = {
        nombre:        data.nombre,
        cantidad:      Number(data.cantidad),
        unidad:        data.unidad || undefined,
        umbral_minimo: Number(data.umbral_minimo),
      }
      return crearProducto(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventario'] })
      onClose()
    },
  })

  const editarMutation = useMutation({
    mutationFn: (data: ProductoForm) => {
      const payload: InventarioUpdate = {
        nombre:        data.nombre,
        cantidad:      Number(data.cantidad),
        unidad:        data.unidad || undefined,
        umbral_minimo: Number(data.umbral_minimo),
      }
      return actualizarProducto(producto!.id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventario'] })
      onClose()
    },
  })

  const mutation = isEditing ? editarMutation : crearMutation
  const isError  = crearMutation.isError || editarMutation.isError

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {isEditing ? 'Editar producto' : 'Agregar producto'}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Nombre</label>
            <input
              type="text"
              {...register('nombre', { required: true })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c]"
              placeholder="Ej. Pomada fijadora"
            />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">Requerido</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Cantidad</label>
              <input
                type="number"
                min="0"
                {...register('cantidad', { required: true, min: 0 })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Unidad</label>
              <input
                type="text"
                {...register('unidad')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c9a84c]"
                placeholder="frascos"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-1.5">Umbral mínimo</label>
            <input
              type="number"
              min="0"
              {...register('umbral_minimo', { required: true, min: 0 })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c9a84c]"
            />
            <p className="text-neutral-500 text-xs mt-1">
              Se mostrará alerta cuando la cantidad llegue a este valor
            </p>
          </div>

          {isError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              No se pudo guardar. Intenta de nuevo.
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
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ModalTarget = 'nuevo' | Inventario

export default function AdminInventario() {
  const [modal, setModal] = useState<ModalTarget | null>(null)

  const { data: inventario, isLoading: loadingInv } = useQuery({
    queryKey: ['admin-inventario'],
    queryFn: getAdminInventario,
  })

  const { data: alertas, isLoading: loadingAlertas } = useQuery({
    queryKey: ['admin-inventario-alertas'],
    queryFn: getAlertasInventario,
  })

  const bajoStock = (inventario ?? []).filter(isBajoStock)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <button
          onClick={() => setModal('nuevo')}
          className="bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Agregar producto
        </button>
      </div>

      {/* Alertas de stock */}
      {bajoStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          {bajoStock.length}{' '}
          {bajoStock.length === 1 ? 'producto está' : 'productos están'} bajo el nivel mínimo:{' '}
          {bajoStock.map((p) => p.nombre).join(', ')}
        </div>
      )}

      {/* Tabla de productos */}
      {loadingInv && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loadingInv && (!inventario || inventario.length === 0) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-14 text-center">
          <p className="text-neutral-500">No hay productos registrados</p>
        </div>
      )}

      {!loadingInv && inventario && inventario.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Producto</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Cantidad</th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3 hidden sm:table-cell">
                  Unidad
                </th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3 hidden md:table-cell">
                  Umbral mín.
                </th>
                <th className="text-left text-neutral-400 font-medium px-4 py-3">Stock</th>
                <th className="text-right text-neutral-400 font-medium px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {inventario.map((p) => {
                const bajo = isBajoStock(p)
                return (
                  <tr
                    key={p.id}
                    className={`bg-neutral-900 hover:bg-neutral-800/50 transition-colors ${
                      bajo ? 'border-l-2 border-red-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-medium">{p.nombre}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${bajo ? 'text-red-400' : 'text-white'}`}>
                      {p.cantidad}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 hidden sm:table-cell">
                      {p.unidad ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 hidden md:table-cell">
                      {p.umbral_minimo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {bajo ? (
                        <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-500/15 text-red-400 border-red-500/30">
                          Bajo stock
                        </span>
                      ) : (
                        <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-500/15 text-green-400 border-green-500/30">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setModal(p)}
                        className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Alertas reportadas por barberos */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Alertas de agotamiento</h2>

        {loadingAlertas && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-neutral-900 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loadingAlertas && (!alertas || alertas.length === 0) && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl py-10 text-center">
            <p className="text-neutral-500 text-sm">No hay alertas pendientes</p>
          </div>
        )}

        {!loadingAlertas && alertas && alertas.length > 0 && (
          <div className="space-y-2">
            {alertas.map((a) => (
              <div
                key={a.id}
                className="bg-neutral-900 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-start gap-3"
              >
                <span className="text-yellow-400 text-base mt-0.5 shrink-0">⚠</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium">{a.producto_nombre}</p>
                  {a.mensaje && (
                    <p className="text-neutral-400 text-xs mt-0.5">{a.mensaje}</p>
                  )}
                </div>
                <span className="text-neutral-500 text-xs shrink-0">
                  {formatFechaCorta(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {modal !== null && (
        <ProductoModal
          producto={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
