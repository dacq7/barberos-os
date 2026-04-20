"""
Tests unitarios de validación de schemas Pydantic.

Estos tests son completamente síncronos: no necesitan base de datos ni
servidor HTTP. Validan que los schemas acepten datos correctos y rechacen
datos incorrectos antes de que lleguen a cualquier lógica de negocio.

Concepto clave: Pydantic v2 lanza `ValidationError` (no HTTPException) cuando
los datos no cumplen el schema. FastAPI lo atrapa y lo convierte en 422.
"""

import uuid
from datetime import datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.cita import CitaCreate


# ── Tests de LoginRequest ──────────────────────────────────────────────────────

def test_login_schema_email_valido():
    """LoginRequest con email RFC-válido → instancia creada sin errores."""
    schema = LoginRequest(email="usuario@barberia.com", password="mi_clave_segura")

    assert schema.email == "usuario@barberia.com"
    assert schema.password == "mi_clave_segura"


def test_login_schema_email_invalido():
    """LoginRequest con email sin '@' → ValidationError en el campo 'email'.

    EmailStr de Pydantic v2 usa email-validator internamente; cualquier string
    que no cumpla la sintaxis básica de email es rechazado.
    """
    with pytest.raises(ValidationError) as exc:
        LoginRequest(email="esto-no-es-un-email", password="clave")

    # Verificar que el error apunta específicamente al campo email
    campos_con_error = {e["loc"][0] for e in exc.value.errors()}
    assert "email" in campos_con_error


def test_login_schema_email_sin_dominio():
    """LoginRequest con email que no tiene dominio (ej: 'user@') → ValidationError."""
    with pytest.raises(ValidationError):
        LoginRequest(email="usuario@", password="clave")


def test_login_schema_sin_password():
    """LoginRequest sin el campo password → ValidationError porque es requerido."""
    with pytest.raises(ValidationError) as exc:
        LoginRequest(email="usuario@test.com")  # type: ignore[call-arg]

    campos_con_error = {e["loc"][0] for e in exc.value.errors()}
    assert "password" in campos_con_error


# ── Tests de CitaCreate ────────────────────────────────────────────────────────

def test_cita_schema_todos_los_campos():
    """CitaCreate con todos los campos requeridos y opcionales → instancia válida."""
    barbero_id = uuid.uuid4()
    servicio_id = uuid.uuid4()
    fecha = datetime.now() + timedelta(hours=2)

    schema = CitaCreate(
        cliente_nombre="Ana López",
        cliente_email="ana@test.com",
        cliente_telefono="3001234567",
        barbero_id=barbero_id,
        servicio_id=servicio_id,
        fecha_hora=fecha,
        notas="Traer imagen de referencia",
    )

    assert schema.barbero_id == barbero_id
    assert schema.servicio_id == servicio_id
    assert schema.cliente_nombre == "Ana López"
    assert schema.notas == "Traer imagen de referencia"


def test_cita_schema_solo_campos_requeridos():
    """CitaCreate con solo los campos obligatorios (opcionales en None) → válido."""
    schema = CitaCreate(
        cliente_nombre="Luis Pérez",
        cliente_email="luis@test.com",
        barbero_id=uuid.uuid4(),
        servicio_id=uuid.uuid4(),
        fecha_hora=datetime.now() + timedelta(hours=3),
    )

    # Campos opcionales deben tener su valor por defecto
    assert schema.cliente_telefono is None
    assert schema.notas is None


def test_cita_schema_sin_campos_requeridos():
    """CitaCreate vacío → ValidationError listando todos los campos faltantes.

    Pydantic v2 reporta todos los errores de una vez (no se detiene en el primero),
    lo que permite al frontend mostrar todos los campos inválidos simultáneamente.
    """
    with pytest.raises(ValidationError) as exc:
        CitaCreate()  # type: ignore[call-arg]

    campos_faltantes = {e["loc"][0] for e in exc.value.errors() if e["type"] == "missing"}

    assert "cliente_nombre" in campos_faltantes
    assert "cliente_email" in campos_faltantes
    assert "barbero_id" in campos_faltantes
    assert "servicio_id" in campos_faltantes
    assert "fecha_hora" in campos_faltantes


def test_cita_schema_email_cliente_invalido():
    """CitaCreate con cliente_email inválido → ValidationError en ese campo específico."""
    with pytest.raises(ValidationError) as exc:
        CitaCreate(
            cliente_nombre="Pedro",
            cliente_email="no-es-un-email-valido",
            barbero_id=uuid.uuid4(),
            servicio_id=uuid.uuid4(),
            fecha_hora=datetime.now() + timedelta(hours=2),
        )

    campos_con_error = {e["loc"][0] for e in exc.value.errors()}
    assert "cliente_email" in campos_con_error


def test_cita_schema_barbero_id_no_uuid():
    """CitaCreate con barbero_id que no es UUID → ValidationError en ese campo."""
    with pytest.raises(ValidationError) as exc:
        CitaCreate(
            cliente_nombre="Sofía",
            cliente_email="sofia@test.com",
            barbero_id="esto-no-es-un-uuid",  # type: ignore[arg-type]
            servicio_id=uuid.uuid4(),
            fecha_hora=datetime.now() + timedelta(hours=2),
        )

    campos_con_error = {e["loc"][0] for e in exc.value.errors()}
    assert "barbero_id" in campos_con_error


# ── Tests de TokenResponse ────────────────────────────────────────────────────

def test_token_response_solo_access_token():
    """TokenResponse con solo access_token → refresh_token es None por defecto."""
    token = TokenResponse(access_token="eyJhbGciOiJIUzI1NiJ9.payload.signature")

    assert token.access_token == "eyJhbGciOiJIUzI1NiJ9.payload.signature"
    assert token.refresh_token is None
    # token_type tiene valor por defecto definido en el schema
    assert token.token_type == "bearer"


def test_token_response_con_refresh_token():
    """TokenResponse con ambos tokens → ambos campos presentes."""
    token = TokenResponse(
        access_token="access.jwt.token",
        refresh_token="refresh.jwt.token",
    )

    assert token.access_token == "access.jwt.token"
    assert token.refresh_token == "refresh.jwt.token"
