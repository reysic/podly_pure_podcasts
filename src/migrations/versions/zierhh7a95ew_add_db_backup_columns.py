"""add db backup columns to app_settings

Revision ID: zierhh7a95ew
Revises: 7598fce23984
Create Date: 2025-01-01 00:00:00.000000

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "zierhh7a95ew"
down_revision: str | None = "7598fce23984"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "app_settings",
        sa.Column(
            "db_backup_enabled",
            sa.Boolean(),
            nullable=True,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "app_settings",
        sa.Column(
            "db_backup_interval_hours",
            sa.Integer(),
            nullable=True,
            server_default=sa.text("24"),
        ),
    )
    op.add_column(
        "app_settings",
        sa.Column(
            "db_backup_last_success_at",
            sa.DateTime(),
            nullable=True,
        ),
    )
    op.add_column(
        "app_settings",
        sa.Column(
            "db_backup_retention_count",
            sa.Integer(),
            nullable=True,
            server_default=sa.text("7"),
        ),
    )


def downgrade() -> None:
    op.drop_column("app_settings", "db_backup_retention_count")
    op.drop_column("app_settings", "db_backup_last_success_at")
    op.drop_column("app_settings", "db_backup_interval_hours")
    op.drop_column("app_settings", "db_backup_enabled")
