"""
Tests de HTTP para los endpoints de autenticación (/api/v1/auth/*).

Patrón: AsyncClient con BD en memoria vía fixture `client`. Cada test verifica
un comportamiento distinto del sistema de autenticación.
"""

import pytest
from httpx import AsyncClient

from app.db.models.admin import Admin
from app.db.models.barbero import Barbero


# ── Test 1 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_barbero_login_exitoso(client: AsyncClient, sample_barbero: Barbero):
    """Login de barbero con credenciales correctas → 200 con access_token.

    Verifica que el endpoint retorne un JWT usable y que el token_type sea
    'bearer', que es el estándar OAuth2.
    """
    response = await client.post(
        "/api/v1/auth/barbero/login",
        json={"email": "carlos@test.com", "password": "test1234"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # El token no debe estar vacío
    assert len(data["access_token"]) > 0


# ── Test 2 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_barbero_login_password_incorrecto(client: AsyncClient, sample_barbero: Barbero):
    """Login con contraseña equivocada → 401 Unauthorized.

    El servicio usa bcrypt para verificar; si el hash no coincide, rechaza
    la solicitud sin revelar si el email es válido o no.
    """
    response = await client.post(
        "/api/v1/auth/barbero/login",
        json={"email": "carlos@test.com", "password": "contraseña_incorrecta"},
    )

    assert response.status_code == 401


# ── Test 3 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_barbero_login_usuario_no_existe(client: AsyncClient):
    """Login con email inexistente → 401 Unauthorized.

    La respuesta debe ser idéntica al caso de contraseña incorrecta para no
    filtrar información sobre qué emails existen en el sistema.
    """
    response = await client.post(
        "/api/v1/auth/barbero/login",
        json={"email": "fantasma@noexiste.com", "password": "cualquier_cosa"},
    )

    assert response.status_code == 401


# ── Test 4 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_login_exitoso(client: AsyncClient, admin_user: Admin):
    """Login de admin con credenciales correctas → 200 con token.

    Comprueba que el endpoint /auth/admin/login funcione de forma análoga al
    de barbero pero contra la tabla de admins.
    """
    response = await client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@test.com", "password": "admin1234"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


# ── Test 5 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ruta_protegida_con_token_valido(
    client: AsyncClient,
    admin_user: Admin,
    admin_token: str,
):
    """GET /admin/citas con JWT válido → 200 y lista (puede estar vacía).

    Verifica que get_current_admin decodifique el token correctamente y
    permita el acceso al endpoint protegido.
    """
    response = await client.get(
        "/api/v1/admin/citas",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ── Test 6 ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ruta_protegida_sin_token(client: AsyncClient):
    """GET /admin/citas sin header Authorization → 401 o 403.

    FastAPI con OAuth2PasswordBearer devuelve 401 (Not Authenticated) cuando
    no se envía ningún token. Este comportamiento es estándar OAuth2.
    """
    response = await client.get("/api/v1/admin/citas")

    # OAuth2PasswordBearer retorna 401; algunos middlewares pueden retornar 403
    assert response.status_code in (401, 403)
