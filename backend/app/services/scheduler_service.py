import logging
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.db.database import SessionLocal
from app.db.models.cita import Cita, EstadoCita
from app.schemas.cita import CitaDetalleOut
from app.services.email_service import send_recordatorio

logger = logging.getLogger(__name__)


async def check_recordatorios() -> None:
    ahora = datetime.now(timezone.utc)

    async with SessionLocal() as db:
        try:
            # Recordatorios 24h
            ventana_24h_inicio = ahora + timedelta(hours=23, minutes=45)
            ventana_24h_fin = ahora + timedelta(hours=24, minutes=15)

            res_24h = await db.execute(
                select(Cita)
                .where(
                    and_(
                        Cita.estado == EstadoCita.confirmada,
                        Cita.fecha_hora >= ventana_24h_inicio,
                        Cita.fecha_hora <= ventana_24h_fin,
                        Cita.recordatorio_24h_enviado == False,
                    )
                )
                .options(
                    selectinload(Cita.barbero),
                    selectinload(Cita.servicio),
                    selectinload(Cita.cliente),
                )
            )
            citas_24h = res_24h.scalars().all()

            for cita in citas_24h:
                try:
                    detalle = CitaDetalleOut.model_validate(cita)
                    if detalle.cliente.email:
                        send_recordatorio(detalle, horas_antes=24)
                    cita.recordatorio_24h_enviado = True
                except Exception:
                    logger.exception("Error enviando recordatorio 24h para cita %s", cita.id)

            # Recordatorios 2h
            ventana_2h_inicio = ahora + timedelta(hours=1, minutes=45)
            ventana_2h_fin = ahora + timedelta(hours=2, minutes=15)

            res_2h = await db.execute(
                select(Cita)
                .where(
                    and_(
                        Cita.estado == EstadoCita.confirmada,
                        Cita.fecha_hora >= ventana_2h_inicio,
                        Cita.fecha_hora <= ventana_2h_fin,
                        Cita.recordatorio_2h_enviado == False,
                    )
                )
                .options(
                    selectinload(Cita.barbero),
                    selectinload(Cita.servicio),
                    selectinload(Cita.cliente),
                )
            )
            citas_2h = res_2h.scalars().all()

            for cita in citas_2h:
                try:
                    detalle = CitaDetalleOut.model_validate(cita)
                    if detalle.cliente.email:
                        send_recordatorio(detalle, horas_antes=2)
                    cita.recordatorio_2h_enviado = True
                except Exception:
                    logger.exception("Error enviando recordatorio 2h para cita %s", cita.id)

            await db.commit()

        except Exception:
            logger.exception("Error en check_recordatorios")
            await db.rollback()


def setup_scheduler(app) -> None:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(check_recordatorios, trigger="interval", minutes=15, id="check_recordatorios")

    @app.on_event("startup")
    async def start_scheduler():
        scheduler.start()
        logger.info("Scheduler iniciado")

    @app.on_event("shutdown")
    async def stop_scheduler():
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido")
