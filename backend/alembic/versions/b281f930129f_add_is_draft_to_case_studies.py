"""add_is_draft_to_case_studies

Revision ID: b281f930129f
Revises: 4191a1c88000
Create Date: 2026-08-06 14:20:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b281f930129f'
down_revision: str | None = '4191a1c88000'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('case_studies', sa.Column('is_draft', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.create_index('ix_case_studies_is_draft', 'case_studies', ['is_draft'], unique=False)
    op.create_index('ix_case_studies_author_draft', 'case_studies', ['author_id', 'is_draft'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_case_studies_author_draft', table_name='case_studies')
    op.drop_index('ix_case_studies_is_draft', table_name='case_studies')
    op.drop_column('case_studies', 'is_draft')
