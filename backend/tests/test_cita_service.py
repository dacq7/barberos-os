from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.barbero import Barbero
from app.db.models.cita import Cita, EstadoCita
from app.db.models.cliente import Cliente
from app.db.models.servicio import Servicio
from app.schemas.cita import CitaCreate, CambioEstadoRequest
from app.services.cita_service import cambiar_estado_cita, cancelar_cita, crear_cita


# ── Test 1 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_falla_fecha_menos_30_min(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
):
    """Crear una cita con menos de 30 minutos de anticipación debe fallar con 400."""
    data = CitaCreate(
        cliente_nombre="Test Cliente",
        cliente_email="cliente@test.com",
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(minutes=10),  # < 30 min
    )
    with pytest.raises(HTTPException) as exc:
        await crear_cita(data, db)
    assert exc.value.status_code == 400


# ── Test 2 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_falla_slot_no_disponible(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
):
    """Sin horarios en la BD ningún slot está disponible → debe fallar con 409.

    Nota: no se usa la fixture sample_horario deliberadamente.
    """
    data = CitaCreate(
        cliente_nombre="Test Cliente",
        cliente_email="cliente@test.com",
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(days=1, hours=2),  # > 30 min
    )
    with pytest.raises(HTTPException) as exc:
        await crear_cita(data, db)
    assert exc.value.status_code == 409


# ── Test 3 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancelar_cita_cambia_estado(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """Cancelar una cita válida debe cambiar su estado a 'cancelada'."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(hours=3),  # > 1h de anticipación
        estado=EstadoCita.confirmada,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    result = await cancelar_cita(cita.id, db)

    assert result.estado == EstadoCita.cancelada


# ── Test 4 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancelar_cita_falla_si_ya_cancelada(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """Intentar cancelar una cita ya cancelada debe fallar con 400."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(hours=3),
        estado=EstadoCita.cancelada,  # ya cancelada
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    with pytest.raises(HTTPException) as exc:
        await cancelar_cita(cita.id, db)
    assert exc.value.status_code == 400


# ── Test 5 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancelar_cita_falla_menos_de_1_hora(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """Cancelar con menos de 1 hora de anticipación debe fallar con 400."""
    cita = Cita(
        cliente_id=sample_cliente.id,
        barbero_id=sample_barbero.id,
        servicio_id=sample_servicio.id,
        fecha_hora=datetime.now() + timedelta(minutes=45),  # < 1 hora
        estado=EstadoCita.confirmada,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    with pytest.raises(HTTPException) as exc:
        await cancelar_cita(cita.id, db)
    assert exc.value.status_code == 400


# ── Test 6 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cambiar_estado_cita_actualiza_correctamente(
    db: AsyncSession,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_cliente: Cliente,
):
    """cambiar_estado_cita debe persistir el nuevo estado."""
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

    data = CambioEstadoRequest(estado=EstadoCita.completada)
    result = await cambiar_estado_cita(cita.id, data, db)

    assert result.estado == EstadoCita.completada
