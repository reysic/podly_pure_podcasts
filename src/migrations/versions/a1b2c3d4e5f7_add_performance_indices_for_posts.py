"""add_performance_indices_for_posts

Revision ID: a1b2c3d4e5f7
Revises: 3d75ed7cb11a
Create Date: 2026-02-18 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f7"
down_revision = "3d75ed7cb11a"
branch_labels = None
depends_on = None


def upgrade():
    """Add indices to optimize feed list and episode list queries."""
    # Add index on feed_id for faster filtering of posts by feed
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.create_index(
            "ix_post_feed_id",
            ["feed_id"],
            unique=False,
        )
    
    # Add index on whitelisted for faster filtering
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.create_index(
            "ix_post_whitelisted",
            ["whitelisted"],
            unique=False,
        )
    
    # Add composite index on feed_id and whitelisted for optimal query performance
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.create_index(
            "ix_post_feed_id_whitelisted",
            ["feed_id", "whitelisted"],
            unique=False,
        )


def downgrade():
    """Remove performance indices."""
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.drop_index("ix_post_feed_id_whitelisted")
    
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.drop_index("ix_post_whitelisted")
    
    with op.batch_alter_table("post", schema=None) as batch_op:
        batch_op.drop_index("ix_post_feed_id")
