"""add recordatorio flags to citas

Revision ID: b3c7e9f21a04
Revises: 985c21c565bb
Create Date: 2026-04-03 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3c7e9f21a04'
down_revision: Union[str, Sequence[str], None] = '985c21c565bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'citas',
        sa.Column('recordatorio_24h_enviado', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column(
        'citas',
        sa.Column('recordatorio_2h_enviado', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('citas', 'recordatorio_2h_enviado')
    op.drop_column('citas', 'recordatorio_24h_enviado')
