"""
Tests de HTTP para los endpoints de citas (/api/v1/citas/*).

Los tests de creación de citas exitosa requieren la fixture `sample_horario`
porque el servicio valida que el slot exista en el horario de la barbería.
"""

from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient

from app.db.models.barbero import Barbero
from app.db.models.horario import Horario
from app.db.models.servicio import Servicio


def _proxima_fecha_habil(dias_minimos: int = 30) -> str:
    """Fecha futura en día hábil (lunes–sábado) a las 10:00, en formato ISO.

    Usamos 30 días en el futuro para estar muy por encima del mínimo de
    30 minutos que exige el servicio, y esquivar domingos que no tienen horario.
    """
    fecha = datetime.now() + timedelta(days=dias_minimos)
    while fecha.weekday() == 6:  # 6 = domingo, sin horario en sample_horario
        fecha += timedelta(days=1)
    return fecha.replace(hour=10, minute=0, second=0, microsecond=0).isoformat()


# ── Test 1 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_datos_validos(
    client: AsyncClient,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    sample_horario: list[Horario],
):
    """POST /citas con datos completos y slot disponible → 201 Created.

    Necesita `sample_horario` para que get_disponibilidad encuentre el horario
    del día y genere el slot "10:00" como disponible.
    """
    response = await client.post(
        "/api/v1/citas",
        json={
            "cliente_nombre": "María Gómez",
            "cliente_email": "maria@test.com",
            "barbero_id": str(sample_barbero.id),
            "servicio_id": str(sample_servicio.id),
            "fecha_hora": _proxima_fecha_habil(),
        },
    )

    assert response.status_code == 201
    data = response.json()
    # La respuesta debe incluir el id de la cita creada
    assert "id" in data
    assert data["barbero_id"] == str(sample_barbero.id)
    assert data["servicio_id"] == str(sample_servicio.id)


# ── Test 2 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_datos_incompletos(client: AsyncClient):
    """POST /citas sin campos requeridos → 422 Unprocessable Entity.

    Pydantic valida el body antes de ejecutar el handler; si faltan campos
    obligatorios (barbero_id, servicio_id, fecha_hora, cliente_email) devuelve
    422 con detalles de cada campo inválido.
    """
    response = await client.post(
        "/api/v1/citas",
        json={"cliente_nombre": "Solo el nombre"},
    )

    assert response.status_code == 422
    # FastAPI retorna una lista de errores bajo la clave "detail"
    errors = response.json()["detail"]
    assert isinstance(errors, list)
    assert len(errors) > 0


# ── Test 3 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_listar_citas_admin(
    client: AsyncClient,
    admin_user,
    admin_token: str,
):
    """GET /admin/citas con token de admin → 200 con lista (vacía o con datos).

    Verifica que la ruta protegida sea accesible con credenciales válidas y
    que la respuesta sea siempre una lista JSON.
    """
    response = await client.get(
        "/api/v1/admin/citas",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ── Test 4 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_fecha_formato_invalido(
    client: AsyncClient,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
):
    """POST /citas con fecha en formato de texto libre → 422 Unprocessable Entity.

    Pydantic no puede parsear 'mañana a las 10' a datetime, por lo que
    rechaza el request antes de que llegue al servicio de negocio.
    """
    response = await client.post(
        "/api/v1/citas",
        json={
            "cliente_nombre": "Pedro Test",
            "cliente_email": "pedro@test.com",
            "barbero_id": str(sample_barbero.id),
            "servicio_id": str(sample_servicio.id),
            "fecha_hora": "mañana a las 10",  # No es un datetime ISO válido
        },
    )

    assert response.status_code == 422


# ── Test 5 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crear_cita_sin_horario_retorna_409(
    client: AsyncClient,
    sample_barbero: Barbero,
    sample_servicio: Servicio,
    # Nota: NO usamos sample_horario aquí a propósito
):
    """POST /citas cuando no hay horario configurado → 409 Conflict.

    Sin horario en la BD, get_disponibilidad devuelve slots vacíos, por lo
    que el servicio rechaza la cita indicando que el slot no está disponible.
    """
    response = await client.post(
        "/api/v1/citas",
        json={
            "cliente_nombre": "Laura Test",
            "cliente_email": "laura@test.com",
            "barbero_id": str(sample_barbero.id),
            "servicio_id": str(sample_servicio.id),
            "fecha_hora": _proxima_fecha_habil(),
        },
    )

    assert response.status_code == 409
