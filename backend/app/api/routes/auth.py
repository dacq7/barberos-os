from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import login_admin, login_barbero

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_admin(data, db)


@router.post("/barbero/login", response_model=TokenResponse)
async def barbero_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_barbero(data, db)
