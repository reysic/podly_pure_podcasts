"""add llm_github_model to llm_settings

Revision ID: 7598fce23984
Revises: a1b2c3d4e5f7
Create Date: 2026-02-20 15:12:39.116692

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7598fce23984"
down_revision = "a1b2c3d4e5f7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("llm_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("llm_github_model", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("llm_settings", schema=None) as batch_op:
        batch_op.drop_column("llm_github_model")
