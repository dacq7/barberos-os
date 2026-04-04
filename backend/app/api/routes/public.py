from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.barbero import BarberoOut
from app.schemas.servicio import ServicioOut
from app.services import admin_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/servicios", response_model=list[ServicioOut])
async def listar_servicios_publico(db: AsyncSession = Depends(get_db)):
    return await admin_service.listar_servicios(db)


@router.get("/barberos", response_model=list[BarberoOut])
async def listar_barberos_publico(db: AsyncSession = Depends(get_db)):
    return await admin_service.listar_barberos(db)
