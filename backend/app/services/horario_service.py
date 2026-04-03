import uuid
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.models.horario import Horario
from app.db.models.barbero_bloqueo import BarberoBloqueo
from app.db.models.bloqueo_general import BloqueoGeneral
from app.db.models.cita import Cita, EstadoCita
from app.schemas.horario import (
    HorarioCreate,
    HorarioOut,
    BarberoBloqueoCreate,
    BarberoBloqueoOut,
    BloqueoGeneralCreate,
    SlotDisponible,
    DisponibilidadResponse,
)


async def get_horario_barberia(db: AsyncSession) -> list[HorarioOut]:
    result = await db.execute(
        select(Horario).where(Horario.activo == True).order_by(Horario.dia_semana)
    )
    return [HorarioOut.model_validate(h) for h in result.scalars().all()]


async def set_horario(data: HorarioCreate, db: AsyncSession) -> HorarioOut:
    result = await db.execute(
        select(Horario).where(Horario.dia_semana == data.dia_semana)
    )
    horario = result.scalar_one_or_none()

    if horario:
        horario.hora_inicio = data.hora_inicio
        horario.hora_fin = data.hora_fin
        horario.activo = data.activo
    else:
        horario = Horario(
            dia_semana=data.dia_semana,
            hora_inicio=data.hora_inicio,
            hora_fin=data.hora_fin,
            activo=data.activo,
        )
        db.add(horario)

    await db.commit()
    await db.refresh(horario)
    return HorarioOut.model_validate(horario)


async def crear_bloqueo_barbero(data: BarberoBloqueoCreate, db: AsyncSession) -> BarberoBloqueoOut:
    bloqueo = BarberoBloqueo(
        barbero_id=data.barbero_id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        motivo=data.motivo,
    )
    db.add(bloqueo)
    await db.commit()
    await db.refresh(bloqueo)
    return BarberoBloqueoOut.model_validate(bloqueo)


async def crear_bloqueo_general(data: BloqueoGeneralCreate, db: AsyncSession) -> dict:
    bloqueo = BloqueoGeneral(
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        motivo=data.motivo,
    )
    db.add(bloqueo)
    await db.commit()
    await db.refresh(bloqueo)
    return {"id": str(bloqueo.id), "fecha_inicio": bloqueo.fecha_inicio, "fecha_fin": bloqueo.fecha_fin, "motivo": bloqueo.motivo}


def _generate_slots(hora_inicio: time, hora_fin: time) -> list[time]:
    slots = []
    current = datetime.combine(date.today(), hora_inicio)
    end = datetime.combine(date.today(), hora_fin)
    step = timedelta(minutes=30)
    while current + step <= end:
        slots.append(current.time())
        current += step
    return slots


async def get_disponibilidad(
    barbero_id: uuid.UUID, fecha: date, db: AsyncSession
) -> DisponibilidadResponse:
    # 1. Horario de la barbería para ese día
    dia_semana = fecha.weekday()  # 0=lunes, 6=domingo
    result = await db.execute(
        select(Horario).where(
            and_(Horario.dia_semana == dia_semana, Horario.activo == True)
        )
    )
    horario = result.scalar_one_or_none()

    if not horario:
        return DisponibilidadResponse(fecha=fecha, barbero_id=barbero_id, slots=[])

    slots = _generate_slots(horario.hora_inicio, horario.hora_fin)

    # 2. Verificar bloqueos del barbero
    res_bb = await db.execute(
        select(BarberoBloqueo).where(
            and_(
                BarberoBloqueo.barbero_id == barbero_id,
                BarberoBloqueo.fecha_inicio <= fecha,
                BarberoBloqueo.fecha_fin >= fecha,
            )
        )
    )
    barbero_bloqueado = res_bb.scalar_one_or_none() is not None

    # 3. Verificar bloqueos generales
    res_bg = await db.execute(
        select(BloqueoGeneral).where(
            and_(
                BloqueoGeneral.fecha_inicio <= fecha,
                BloqueoGeneral.fecha_fin >= fecha,
            )
        )
    )
    dia_bloqueado = res_bg.scalar_one_or_none() is not None

    if barbero_bloqueado or dia_bloqueado:
        return DisponibilidadResponse(
            fecha=fecha,
            barbero_id=barbero_id,
            slots=[SlotDisponible(hora=s, disponible=False) for s in slots],
        )

    # 4. Citas existentes del barbero en esa fecha (estado != cancelada)
    fecha_inicio_dt = datetime.combine(fecha, time.min)
    fecha_fin_dt = datetime.combine(fecha, time.max)
    res_citas = await db.execute(
        select(Cita.fecha_hora).where(
            and_(
                Cita.barbero_id == barbero_id,
                Cita.fecha_hora >= fecha_inicio_dt,
                Cita.fecha_hora <= fecha_fin_dt,
                Cita.estado != EstadoCita.cancelada,
            )
        )
    )
    horas_ocupadas: set[time] = {
        row.astimezone(timezone.utc).replace(tzinfo=None).time()
        if row.tzinfo
        else row.time()
        for row in res_citas.scalars().all()
    }

    # 5. Slots pasados si es hoy (mínimo 30 min desde ahora)
    ahora = datetime.now()
    minimo_dt = ahora + timedelta(minutes=30) if fecha == date.today() else None

    resultado = []
    for slot in slots:
        if slot in horas_ocupadas:
            resultado.append(SlotDisponible(hora=slot, disponible=False))
            continue
        if minimo_dt and datetime.combine(fecha, slot) < minimo_dt:
            resultado.append(SlotDisponible(hora=slot, disponible=False))
            continue
        resultado.append(SlotDisponible(hora=slot, disponible=True))

    return DisponibilidadResponse(fecha=fecha, barbero_id=barbero_id, slots=resultado)
