from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.services.auth_service import login_admin, login_barbero, refresh_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_admin(data, db)


@router.post("/barbero/login", response_model=TokenResponse)
async def barbero_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_barbero(data, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await refresh_access_token(data.refresh_token, db)
