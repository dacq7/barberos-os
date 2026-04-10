# IMPORTANT: environment variables must be set before any app.* import.
# pydantic-settings v2 gives env vars higher priority than .env files,
# so these override the real DATABASE_URL / SECRET_KEY in backend/.env.
import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["RESEND_API_KEY"] = "test-resend-key"

from datetime import time
from decimal import Decimal

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Importing models.__init__ registers every ORM class with Base.metadata
# so that create_all() creates all tables (including FK targets).
import app.db.models  # noqa: F401

from app.db.database import Base
from app.db.models.barbero import Barbero
from app.db.models.cliente import Cliente
from app.db.models.horario import Horario
from app.db.models.servicio import Servicio
from app.core.security import hash_password

_TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db():
    """Fresh isolated in-memory SQLite session per test function."""
    engine = create_async_engine(_TEST_DB_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def sample_barbero(db: AsyncSession) -> Barbero:
    barbero = Barbero(
        nombre="Carlos Prueba",
        email="carlos@test.com",
        password_hash=hash_password("test1234"),
        activo=True,
    )
    db.add(barbero)
    await db.commit()
    await db.refresh(barbero)
    return barbero


@pytest_asyncio.fixture
async def sample_servicio(db: AsyncSession) -> Servicio:
    servicio = Servicio(
        nombre="Corte de prueba",
        precio=Decimal("25000"),
    )
    db.add(servicio)
    await db.commit()
    await db.refresh(servicio)
    return servicio


@pytest_asyncio.fixture
async def sample_cliente(db: AsyncSession) -> Cliente:
    cliente = Cliente(
        nombre="Juan Test",
        email="juan@test.com",
        telefono="3001234567",
    )
    db.add(cliente)
    await db.commit()
    await db.refresh(cliente)
    return cliente


@pytest_asyncio.fixture
async def sample_horario(db: AsyncSession) -> list[Horario]:
    """Horario general de la barbería: lunes(0) a sábado(5), 9 am – 6 pm."""
    horarios: list[Horario] = []
    for dia in range(6):
        h = Horario(
            dia_semana=dia,
            hora_inicio=time(9, 0),
            hora_fin=time(18, 0),
            activo=True,
        )
        db.add(h)
        horarios.append(h)
    await db.commit()
    for h in horarios:
        await db.refresh(h)
    return horarios
