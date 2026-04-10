from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.barbero import Barbero
from app.db.models.cita import Cita, EstadoCita
from app.db.models.cliente import Cliente
from app.db.models.servicio import Servicio
from app.schemas.pago import PagoCreate
from app.services.pago_service import get_resumen_barbero, registrar_pago


# ── Test 1 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_registrar_pago_calcula_comisiones_correctamente(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """40% barbero / 60% barbería sobre monto_total=25000."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() - timedelta(hours=1),
        estado=EstadoCita.completada,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    data = PagoCreate(cita_id=cita.id, monto_total=Decimal("25000"))
    pago = await registrar_pago(data, db)

    assert pago.monto_barbero == Decimal("10000")
    assert pago.monto_barberia == Decimal("15000")


# ── Test 2 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_registrar_pago_falla_si_cita_no_completada(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """Registrar pago de una cita pendiente debe fallar con 400."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(hours=2),
        estado=EstadoCita.pendiente,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    data = PagoCreate(cita_id=cita.id, monto_total=Decimal("25000"))
    with pytest.raises(HTTPException) as exc:
        await registrar_pago(data, db)
    assert exc.value.status_code == 400


# ── Test 3 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_registrar_pago_falla_si_ya_existe_pago(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """Un segundo pago para la misma cita debe fallar con 409."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() - timedelta(hours=1),
        estado=EstadoCita.completada,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    data = PagoCreate(cita_id=cita.id, monto_total=Decimal("25000"))
    await registrar_pago(data, db)

    with pytest.raises(HTTPException) as exc:
        await registrar_pago(data, db)
    assert exc.value.status_code == 409


# ── Test 4 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_resumen_barbero_calcula_total_correcto(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """total_ganado = 40% de 25000 + 40% de 35000 = 10000 + 14000 = 24000."""
    fecha_cita = datetime(2025, 6, 15, 10, 0)

    for monto in (Decimal("25000"), Decimal("35000")):
        cita = Cita(
            cliente_id=sample_cliente.id,
            barbero_id=sample_barbero.id,
            servicio_id=sample_servicio.id,
            fecha_hora=fecha_cita,
            estado=EstadoCita.completada,
        )
        db.add(cita)
        await db.commit()
        await db.refresh(cita)

        data = PagoCreate(cita_id=cita.id, monto_total=monto)
        await registrar_pago(data, db)

    resumen = await get_resumen_barbero(
        barbero_id=sample_barbero.id,
        fecha_inicio=date(2025, 6, 1),
        fecha_fin=date(2025, 6, 30),
        db=db,
    )

    assert resumen.total_ganado == Decimal("24000")
    assert resumen.total_servicios == 2
