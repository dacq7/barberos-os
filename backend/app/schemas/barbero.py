import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr


class BarberoCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    foto_url: Optional[str] = None


class BarberoUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    foto_url: Optional[str] = None
    activo: Optional[bool] = None


class BarberoOut(BaseModel):
    id: uuid.UUID
    nombre: str
    email: str
    telefono: Optional[str]
    foto_url: Optional[str]
    activo: bool

    model_config = {"from_attributes": True}
