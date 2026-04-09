import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class AdminOut(BaseModel):
    id: uuid.UUID
    nombre: str
    email: EmailStr
    activo: bool

    model_config = {"from_attributes": True}


class BarberoOut(BaseModel):
    id: uuid.UUID
    nombre: str
    email: EmailStr
    telefono: Optional[str]
    foto_url: Optional[str]
    activo: bool

    model_config = {"from_attributes": True}
