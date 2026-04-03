import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.db.models.barbero import Barbero
from app.db.models.servicio import Servicio
from app.core.security import hash_password
from app.schemas.barbero import BarberoCreate, BarberoOut
from app.schemas.servicio import ServicioCreate, ServicioUpdate, ServicioOut


async def crear_barbero(data: BarberoCreate, db: AsyncSession) -> BarberoOut:
    result = await db.execute(select(Barbero).where(Barbero.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")

    barbero = Barbero(
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        telefono=data.telefono,
        foto_url=data.foto_url,
    )
    db.add(barbero)
    await db.commit()
    await db.refresh(barbero)
    return BarberoOut.model_validate(barbero)


async def listar_barberos(db: AsyncSession) -> list[BarberoOut]:
    result = await db.execute(select(Barbero).where(Barbero.activo == True))
    barberos = result.scalars().all()
    return [BarberoOut.model_validate(b) for b in barberos]


async def crear_servicio(data: ServicioCreate, db: AsyncSession) -> ServicioOut:
    servicio = Servicio(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        activo=data.activo,
    )
    db.add(servicio)
    await db.commit()
    await db.refresh(servicio)
    return ServicioOut.model_validate(servicio)


async def listar_servicios(db: AsyncSession) -> list[ServicioOut]:
    result = await db.execute(select(Servicio).where(Servicio.activo == True))
    servicios = result.scalars().all()
    return [ServicioOut.model_validate(s) for s in servicios]


async def actualizar_servicio(servicio_id: uuid.UUID, data: ServicioUpdate, db: AsyncSession) -> ServicioOut:
    result = await db.execute(select(Servicio).where(Servicio.id == servicio_id))
    servicio = result.scalar_one_or_none()
    if not servicio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(servicio, field, value)

    await db.commit()
    await db.refresh(servicio)
    return ServicioOut.model_validate(servicio)
