import uuid
from datetime import time
from sqlalchemy import Integer, Boolean, Time
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Horario(Base):
    __tablename__ = "horarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dia_semana: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=lunes, 6=domingo
    hora_inicio: Mapped[time] = mapped_column(Time, nullable=False)
    hora_fin: Mapped[time] = mapped_column(Time, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
