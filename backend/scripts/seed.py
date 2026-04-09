"""
Seed script — pobla la base de datos con datos demo para BarberOS.

Uso (desde backend/):
    python3 scripts/seed.py

El script es idempotente: puede correrse varias veces sin duplicar datos.
"""

import asyncio
import sys
from datetime import datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

# ── Path setup ────────────────────────────────────────────────────────────────
# Permite importar `app.*` cuando se ejecuta desde backend/
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Carga backend/.env antes de que Settings() sea instanciado
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

# ── Imports de la app ─────────────────────────────────────────────────────────
# Importar models.__init__ registra todas las clases en la metadata de SQLAlchemy
# y garantiza que las relaciones (back_populates, etc.) se resuelvan correctamente.
import app.db.models  # noqa: F401  — registra todos los modelos

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models.admin import Admin
from app.db.models.barbero import Barbero
from app.db.models.barbero_servicio import BarberoServicio
from app.db.models.cita import Cita, EstadoCita
from app.db.models.cliente import Cliente
from app.db.models.horario import Horario
from app.db.models.inventario import Inventario
from app.db.models.pago import Pago
from app.db.models.servicio import Servicio
from app.core.security import hash_password

# ── Constantes de comisión (espejo de pago_service.py) ───────────────────────
_COMISION_BARBERO = Decimal("0.40")
_COMISION_BARBERIA = Decimal("0.60")


def _redondear(valor: Decimal) -> Decimal:
    return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ── Seed ──────────────────────────────────────────────────────────────────────

async def seed() -> None:
    async with SessionLocal() as db:

        # ── 1. Admin ──────────────────────────────────────────────────────────
        res = await db.execute(select(Admin).where(Admin.email == "admin@barberos.com"))
        if not res.scalar_one_or_none():
            db.add(Admin(
                nombre="Admin Demo",
                email="admin@barberos.com",
                password_hash=hash_password("demo1234"),
            ))
            await db.flush()

        # ── 2. Barberos ───────────────────────────────────────────────────────
        barberos_data = [
            ("Carlos Mendoza", "carlos@barberos.com"),
            ("Miguel Torres",  "miguel@barberos.com"),
            ("Andrés López",   "andres@barberos.com"),
        ]
        barberos: list[Barbero] = []
        for nombre, email in barberos_data:
            res = await db.execute(select(Barbero).where(Barbero.email == email))
            b = res.scalar_one_or_none()
            if not b:
                b = Barbero(
                    nombre=nombre,
                    email=email,
                    password_hash=hash_password("demo1234"),
                    activo=True,
                )
                db.add(b)
                await db.flush()
            barberos.append(b)

        # ── 3. Servicios ──────────────────────────────────────────────────────
        # duracion_minutos vive en BarberoServicio, no en Servicio
        servicios_data: list[tuple[str, int, int]] = [
            ("Corte clásico",    25_000, 30),
            ("Arreglo de barba", 15_000, 20),
            ("Corte + barba",    35_000, 50),
            ("Degradado",        30_000, 30),
            ("Arreglo de cejas", 10_000, 15),
        ]
        # Lista de (Servicio ORM, duracion_minutos)
        servicios: list[tuple[Servicio, int]] = []
        for nombre, precio, duracion in servicios_data:
            res = await db.execute(select(Servicio).where(Servicio.nombre == nombre))
            s = res.scalar_one_or_none()
            if not s:
                s = Servicio(
                    nombre=nombre,
                    precio=Decimal(str(precio)),
                )
                db.add(s)
                await db.flush()
            servicios.append((s, duracion))

        # ── 4. BarberoServicio (cada barbero ofrece todos los servicios) ──────
        for barbero in barberos:
            for servicio, duracion in servicios:
                res = await db.execute(
                    select(BarberoServicio).where(
                        BarberoServicio.barbero_id == barbero.id,
                        BarberoServicio.servicio_id == servicio.id,
                    )
                )
                if not res.scalar_one_or_none():
                    db.add(BarberoServicio(
                        barbero_id=barbero.id,
                        servicio_id=servicio.id,
                        duracion_minutos=duracion,
                    ))
        await db.flush()

        # ── 5. Horarios generales de la barbería (lunes–sábado) ───────────────
        for dia in range(6):  # 0=lunes … 5=sábado
            res = await db.execute(select(Horario).where(Horario.dia_semana == dia))
            if not res.scalar_one_or_none():
                db.add(Horario(
                    dia_semana=dia,
                    hora_inicio=time(9, 0),
                    hora_fin=time(18, 0),
                    activo=True,
                ))
        await db.flush()

        # ── 6. Clientes ───────────────────────────────────────────────────────
        clientes_data = [
            ("Juan Pérez",    "juan@demo.com",  "3001234567"),
            ("María García",  "maria@demo.com", "3009876543"),
        ]
        clientes: list[Cliente] = []
        for nombre, email, telefono in clientes_data:
            res = await db.execute(select(Cliente).where(Cliente.email == email))
            c = res.scalar_one_or_none()
            if not c:
                c = Cliente(nombre=nombre, email=email, telefono=telefono)
                db.add(c)
                await db.flush()
            clientes.append(c)

        # ── 7. Citas ──────────────────────────────────────────────────────────
        # Referencia temporal: hoy a las 10:00 (naive, sin TZ, igual que el modelo)
        hoy = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)

        # (idx_cliente, idx_barbero, idx_servicio, delta_días, estado, hora)
        citas_def: list[tuple[int, int, int, int, EstadoCita, int]] = [
            # 2 pendientes — futuras
            (0, 0, 0, +2, EstadoCita.pendiente,  10),
            (1, 1, 1, +4, EstadoCita.pendiente,  14),
            # 2 confirmadas — futuras
            (0, 2, 2, +1, EstadoCita.confirmada, 11),
            (1, 0, 3, +3, EstadoCita.confirmada, 15),
            # 3 completadas — pasadas
            (0, 1, 0, -1, EstadoCita.completada, 10),
            (1, 2, 1, -3, EstadoCita.completada, 11),
            (0, 0, 2, -5, EstadoCita.completada, 12),
            # 1 cancelada — pasada
            (1, 1, 3, -2, EstadoCita.cancelada,   9),
        ]

        # Lista de (Cita ORM, Servicio ORM, estado) para crear pagos después
        citas_creadas: list[tuple[Cita, Servicio, EstadoCita]] = []

        for cli_i, bar_i, svc_i, delta, estado, hora in citas_def:
            cliente = clientes[cli_i]
            barbero = barberos[bar_i]
            servicio, _ = servicios[svc_i]
            fecha_hora = (hoy + timedelta(days=delta)).replace(hour=hora)

            # Idempotencia: misma combinación barbero + servicio + datetime
            res = await db.execute(
                select(Cita).where(
                    Cita.barbero_id == barbero.id,
                    Cita.servicio_id == servicio.id,
                    Cita.fecha_hora == fecha_hora,
                )
            )
            cita = res.scalar_one_or_none()
            if not cita:
                cita = Cita(
                    cliente_id=cliente.id,
                    barbero_id=barbero.id,
                    servicio_id=servicio.id,
                    fecha_hora=fecha_hora,
                    estado=estado,
                )
                db.add(cita)
                await db.flush()
            citas_creadas.append((cita, servicio, estado))

        # ── 8. Pagos para las 3 citas completadas ─────────────────────────────
        pagos_count = 0
        for cita, servicio, estado in citas_creadas:
            if estado != EstadoCita.completada:
                continue
            res = await db.execute(select(Pago).where(Pago.cita_id == cita.id))
            if res.scalar_one_or_none():
                continue  # ya existe
            monto_total = Decimal(str(servicio.precio))
            db.add(Pago(
                cita_id=cita.id,
                monto_total=monto_total,
                monto_barbero=_redondear(monto_total * _COMISION_BARBERO),
                monto_barberia=_redondear(monto_total * _COMISION_BARBERIA),
            ))
            pagos_count += 1

        # ── 9. Inventario ─────────────────────────────────────────────────────
        # Nota: Inventario no tiene precio_unitario en el modelo; campos: cantidad, umbral_minimo
        inventario_data: list[tuple[str, int, int]] = [
            ("Pomada para cabello",          5,  3),
            ("Shampoo profesional",          8,  4),
            ("Aceite para barba",            2,  3),  # bajo stock
            ("Cera moldeadora",              6,  2),
            ("Aftershave",                   1,  2),  # bajo stock
            ("Toallas desechables (paquete)", 15, 5),
        ]
        for nombre, cantidad, umbral_minimo in inventario_data:
            res = await db.execute(select(Inventario).where(Inventario.nombre == nombre))
            if not res.scalar_one_or_none():
                db.add(Inventario(
                    nombre=nombre,
                    cantidad=cantidad,
                    umbral_minimo=umbral_minimo,
                ))
        await db.flush()

        await db.commit()

    # ── Resumen ───────────────────────────────────────────────────────────────
    print()
    print("✓ Admin: admin@barberos.com / demo1234")
    print("✓ Barberos: carlos@barberos.com, miguel@barberos.com, andres@barberos.com / demo1234")
    print(f"✓ {len(servicios)} servicios creados")
    print("✓ Horarios configurados (lun-sáb 9am-6pm)")
    print("✓ 8 citas seeded (2 pendientes, 2 confirmadas, 3 completadas, 1 cancelada)")
    print(f"✓ {pagos_count} pagos registrados")
    print("✓ 6 productos de inventario (2 con stock bajo)")
    print()
    print("Seed completo. Login: localhost:3000/admin/login")
    print()


if __name__ == "__main__":
    asyncio.run(seed())
