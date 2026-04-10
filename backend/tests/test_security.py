from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


def test_hash_password_difiere_del_texto_plano():
    hashed = hash_password("mipassword")
    assert hashed != "mipassword"


def test_verify_password_correcto():
    hashed = hash_password("mipassword")
    assert verify_password("mipassword", hashed) is True


def test_verify_password_incorrecto():
    hashed = hash_password("mipassword")
    assert verify_password("password_incorrecta", hashed) is False


def test_create_access_token_genera_jwt_valido():
    data = {"sub": "user-id-123", "role": "admin"}
    token = create_access_token(data)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "user-id-123"
    assert payload["role"] == "admin"
    assert "exp" in payload
    assert "jti" in payload


def test_create_refresh_token_incluye_type_refresh():
    data = {"sub": "user-id-456", "role": "barbero"}
    token = create_refresh_token(data)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["type"] == "refresh"
    assert payload["sub"] == "user-id-456"
    assert payload["role"] == "barbero"
