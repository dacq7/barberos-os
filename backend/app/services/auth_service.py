from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.admin import Admin
from app.db.models.barbero import Barbero
from app.core.security import verify_password, create_access_token, create_refresh_token, _decode_token
from app.schemas.auth import LoginRequest, TokenResponse


async def login_admin(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(Admin).where(Admin.email == data.email))
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta desactivada",
        )

    token_data = {"sub": str(admin.id), "role": "admin"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


async def login_barbero(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(Barbero).where(Barbero.email == data.email))
    barbero = result.scalar_one_or_none()

    if not barbero or not verify_password(data.password, barbero.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not barbero.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta desactivada",
        )

    token_data = {"sub": str(barbero.id), "role": "barbero"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> TokenResponse:
    payload = _decode_token(refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido",
        )

    role = payload.get("role")
    user_id = payload.get("sub")

    if role == "admin":
        result = await db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalar_one_or_none()
    elif role == "barbero":
        result = await db.execute(select(Barbero).where(Barbero.id == user_id))
        user = result.scalar_one_or_none()
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if not user or not user.activo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")

    token_data = {"sub": str(user.id), "role": role}
    return TokenResponse(access_token=create_access_token(token_data))
