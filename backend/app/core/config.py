from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESEND_API_KEY: str
    ALLOWED_ORIGINS_STR: str = "http://localhost:5173"
    BASE_URL: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        raw = self.ALLOWED_ORIGINS_STR.strip().strip('"').strip("'")
        return [o.strip().strip('"').strip("'") for o in raw.split(",") if o.strip()]


settings = Settings()
