from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin, get_current_barbero
from app.schemas.pago import PagoCreate, PagoOut, ResumenQuincena, ResumenAdmin
from app.services import pago_service

router = APIRouter(tags=["pagos"])


@router.post("/admin/pagos", response_model=PagoOut, status_code=201)
async def registrar_pago(
    data: PagoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await pago_service.registrar_pago(data, db)


@router.get("/admin/pagos/resumen", response_model=ResumenAdmin)
async def resumen_admin(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    return await pago_service.get_resumen_admin(fecha_inicio, fecha_fin, db)


@router.get("/barbero/pagos/resumen", response_model=ResumenQuincena)
async def resumen_barbero(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: AsyncSession = Depends(get_db),
    barbero=Depends(get_current_barbero),
):
    return await pago_service.get_resumen_barbero(barbero.id, fecha_inicio, fecha_fin, db)
