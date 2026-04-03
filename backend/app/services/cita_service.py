import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.db.models.cliente import Cliente
from app.db.models.cita import Cita, EstadoCita
from app.schemas.cita import CitaCreate, CitaOut, CitaDetalleOut, CambioEstadoRequest
from app.services.horario_service import get_disponibilidad


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(dt: datetime) -> datetime:
    """Devuelve el datetime con tzinfo=UTC si era naive."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def _load_cita(cita_id: uuid.UUID, db: AsyncSession) -> Cita:
    result = await db.execute(
        select(Cita)
        .where(Cita.id == cita_id)
        .options(
            selectinload(Cita.barbero),
            selectinload(Cita.servicio),
            selectinload(Cita.cliente),
        )
    )
    cita = result.scalar_one_or_none()
    if not cita:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
    return cita


async def crear_cita(data: CitaCreate, db: AsyncSession) -> CitaDetalleOut:
    fecha_hora = _as_aware(data.fecha_hora)

    # Validar mínimo 30 min en el futuro
    if fecha_hora < _now_utc() + timedelta(minutes=30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cita debe reservarse al menos 30 minutos antes",
        )

    # Validar que el slot esté disponible
    disponibilidad = await get_disponibilidad(data.barbero_id, data.fecha_hora.date(), db)
    slot_time = data.fecha_hora.time().replace(second=0, microsecond=0)
    slot_ok = any(
        s.hora == slot_time and s.disponible
        for s in disponibilidad.slots
    )
    if not slot_ok:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El slot solicitado no está disponible",
        )

    # Crear o reutilizar cliente por email
    result = await db.execute(
        select(Cliente).where(Cliente.email == data.cliente_email)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        cliente = Cliente(
            nombre=data.cliente_nombre,
            email=data.cliente_email,
            telefono=data.cliente_telefono,
        )
        db.add(cliente)
        await db.flush()  # obtener el id sin commitear aún

    cita = Cita(
        cliente_id=cliente.id,
        barbero_id=data.barbero_id,
        servicio_id=data.servicio_id,
        fecha_hora=fecha_hora,
        estado=EstadoCita.pendiente,
        notas=data.notas,
    )
    db.add(cita)
    await db.commit()
    await db.refresh(cita)

    return CitaDetalleOut.model_validate(await _load_cita(cita.id, db))


async def get_cita(cita_id: uuid.UUID, db: AsyncSession) -> CitaDetalleOut:
    return CitaDetalleOut.model_validate(await _load_cita(cita_id, db))


async def cancelar_cita(cita_id: uuid.UUID, db: AsyncSession) -> CitaOut:
    cita = await _load_cita(cita_id, db)

    if cita.estado == EstadoCita.cancelada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cita ya está cancelada",
        )

    fecha_hora = _as_aware(cita.fecha_hora)
    if fecha_hora - _now_utc() < timedelta(hours=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede cancelar con al menos 1 hora de anticipación",
        )

    cita.estado = EstadoCita.cancelada
    await db.commit()
    await db.refresh(cita)
    return CitaOut.model_validate(cita)


async def cambiar_estado_cita(
    cita_id: uuid.UUID, data: CambioEstadoRequest, db: AsyncSession
) -> CitaOut:
    result = await db.execute(select(Cita).where(Cita.id == cita_id))
    cita = result.scalar_one_or_none()
    if not cita:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")

    cita.estado = data.estado
    await db.commit()
    await db.refresh(cita)
    return CitaOut.model_validate(cita)


async def listar_citas_admin(db: AsyncSession) -> list[CitaDetalleOut]:
    result = await db.execute(
        select(Cita)
        .options(
            selectinload(Cita.barbero),
            selectinload(Cita.servicio),
            selectinload(Cita.cliente),
        )
        .order_by(Cita.fecha_hora.desc())
    )
    return [CitaDetalleOut.model_validate(c) for c in result.scalars().all()]


async def listar_citas_barbero(barbero_id: uuid.UUID, db: AsyncSession) -> list[CitaDetalleOut]:
    result = await db.execute(
        select(Cita)
        .where(Cita.barbero_id == barbero_id)
        .options(
            selectinload(Cita.barbero),
            selectinload(Cita.servicio),
            selectinload(Cita.cliente),
        )
        .order_by(Cita.fecha_hora.desc())
    )
    return [CitaDetalleOut.model_validate(c) for c in result.scalars().all()]
