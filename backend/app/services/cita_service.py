import uuid
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.db.models.cliente import Cliente
from app.db.models.cita import Cita, EstadoCita
from app.schemas.cita import CitaCreate, CitaOut, CitaDetalleOut, CambioEstadoRequest, ReagendarRequest
from app.services.horario_service import get_disponibilidad


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
    fecha_hora: datetime = data.fecha_hora  # naive, sin zona horaria

    # Validar mínimo 30 min en el futuro
    if fecha_hora < datetime.now() + timedelta(minutes=30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cita debe reservarse al menos 30 minutos antes",
        )

    # Validar que el slot esté disponible
    disponibilidad = await get_disponibilidad(data.barbero_id, fecha_hora.date(), db)
    slot_str = fecha_hora.strftime("%H:%M")
    slot_ok = any(
        s.hora == slot_str
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


async def reagendar_cita(
    cita_id: uuid.UUID, data: ReagendarRequest, db: AsyncSession
) -> CitaDetalleOut:
    cita = await _load_cita(cita_id, db)

    if cita.estado == EstadoCita.cancelada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede reagendar una cita cancelada",
        )

    nueva_fecha_hora: datetime = data.nueva_fecha_hora
    if nueva_fecha_hora < datetime.now() + timedelta(minutes=30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva fecha debe ser al menos 30 minutos en el futuro",
        )

    disponibilidad = await get_disponibilidad(cita.barbero_id, nueva_fecha_hora.date(), db)
    slot_str = nueva_fecha_hora.strftime("%H:%M")
    slot_ok = any(s.hora == slot_str for s in disponibilidad.slots)
    if not slot_ok:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El slot solicitado no está disponible",
        )

    cita.fecha_hora = nueva_fecha_hora
    cita.recordatorio_24h_enviado = False
    cita.recordatorio_2h_enviado = False
    await db.commit()

    return CitaDetalleOut.model_validate(await _load_cita(cita_id, db))


async def get_cita(cita_id: uuid.UUID, db: AsyncSession) -> CitaDetalleOut:
    return CitaDetalleOut.model_validate(await _load_cita(cita_id, db))


async def cancelar_cita(cita_id: uuid.UUID, db: AsyncSession) -> CitaOut:
    cita = await _load_cita(cita_id, db)

    if cita.estado == EstadoCita.cancelada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cita ya está cancelada",
        )

    if cita.fecha_hora - datetime.now() < timedelta(hours=1):
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
