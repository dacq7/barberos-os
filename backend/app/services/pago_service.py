import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.db.models.pago import Pago
from app.db.models.cita import Cita, EstadoCita
from app.db.models.barbero import Barbero
from app.schemas.pago import PagoCreate, PagoOut, ResumenQuincena, ResumenAdmin

_COMISION_BARBERO = Decimal("0.40")
_COMISION_BARBERIA = Decimal("0.60")


def _redondear(valor: Decimal) -> Decimal:
    return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def registrar_pago(data: PagoCreate, db: AsyncSession) -> PagoOut:
    # Verificar que la cita exista y esté completada
    result = await db.execute(
        select(Cita).where(Cita.id == data.cita_id)
    )
    cita = result.scalar_one_or_none()
    if not cita:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
    if cita.estado != EstadoCita.completada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden registrar pagos de citas completadas",
        )

    # Verificar que no exista ya un pago para esta cita
    existing = await db.execute(select(Pago).where(Pago.cita_id == data.cita_id))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un pago registrado para esta cita",
        )

    monto_barbero = _redondear(data.monto_total * _COMISION_BARBERO)
    monto_barberia = _redondear(data.monto_total * _COMISION_BARBERIA)

    pago = Pago(
        cita_id=data.cita_id,
        monto_total=data.monto_total,
        monto_barbero=monto_barbero,
        monto_barberia=monto_barberia,
    )
    db.add(pago)
    await db.commit()
    await db.refresh(pago)
    return PagoOut.model_validate(pago)


async def get_resumen_barbero(
    barbero_id: uuid.UUID, fecha_inicio: date, fecha_fin: date, db: AsyncSession
) -> ResumenQuincena:
    # Nombre del barbero
    res_barbero = await db.execute(select(Barbero).where(Barbero.id == barbero_id))
    barbero = res_barbero.scalar_one_or_none()
    if not barbero:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barbero no encontrado")

    inicio_dt = datetime(fecha_inicio.year, fecha_inicio.month, fecha_inicio.day, tzinfo=timezone.utc)
    fin_dt = datetime(fecha_fin.year, fecha_fin.month, fecha_fin.day, 23, 59, 59, tzinfo=timezone.utc)

    result = await db.execute(
        select(Pago)
        .join(Pago.cita)
        .where(
            and_(
                Cita.barbero_id == barbero_id,
                Cita.estado == EstadoCita.completada,
                Cita.fecha_hora >= inicio_dt,
                Cita.fecha_hora <= fin_dt,
            )
        )
    )
    pagos = result.scalars().all()

    total_ganado = _redondear(sum((p.monto_barbero for p in pagos), Decimal("0")))

    return ResumenQuincena(
        barbero_id=barbero_id,
        barbero_nombre=barbero.nombre,
        periodo_inicio=fecha_inicio,
        periodo_fin=fecha_fin,
        total_servicios=len(pagos),
        total_ganado=total_ganado,
    )


async def get_resumen_admin(
    fecha_inicio: date, fecha_fin: date, db: AsyncSession
) -> ResumenAdmin:
    inicio_dt = datetime(fecha_inicio.year, fecha_inicio.month, fecha_inicio.day, tzinfo=timezone.utc)
    fin_dt = datetime(fecha_fin.year, fecha_fin.month, fecha_fin.day, 23, 59, 59, tzinfo=timezone.utc)

    result = await db.execute(
        select(Pago)
        .join(Pago.cita)
        .options(selectinload(Pago.cita).selectinload(Cita.barbero))
        .where(
            and_(
                Cita.estado == EstadoCita.completada,
                Cita.fecha_hora >= inicio_dt,
                Cita.fecha_hora <= fin_dt,
            )
        )
    )
    pagos = result.scalars().all()

    total_ingresos = _redondear(sum((p.monto_total for p in pagos), Decimal("0")))
    total_comisiones = _redondear(sum((p.monto_barbero for p in pagos), Decimal("0")))
    total_barberia = _redondear(sum((p.monto_barberia for p in pagos), Decimal("0")))

    # Agrupar por barbero
    por_barbero: dict[uuid.UUID, list[Pago]] = {}
    for pago in pagos:
        bid = pago.cita.barbero_id
        por_barbero.setdefault(bid, []).append(pago)

    desglose: list[ResumenQuincena] = []
    for bid, b_pagos in por_barbero.items():
        barbero = b_pagos[0].cita.barbero
        desglose.append(
            ResumenQuincena(
                barbero_id=bid,
                barbero_nombre=barbero.nombre,
                periodo_inicio=fecha_inicio,
                periodo_fin=fecha_fin,
                total_servicios=len(b_pagos),
                total_ganado=_redondear(sum((p.monto_barbero for p in b_pagos), Decimal("0"))),
            )
        )

    return ResumenAdmin(
        periodo_inicio=fecha_inicio,
        periodo_fin=fecha_fin,
        total_ingresos=total_ingresos,
        total_comisiones_barberos=total_comisiones,
        total_barberia=total_barberia,
        citas_completadas=len(pagos),
        desglose_por_barbero=desglose,
    )
