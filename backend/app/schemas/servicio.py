import uuid
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class ServicioCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    activo: bool = True


class ServicioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[Decimal] = None
    activo: Optional[bool] = None


class ServicioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    descripcion: Optional[str]
    precio: Decimal
    activo: bool

    model_config = {"from_attributes": True}
