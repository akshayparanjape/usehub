"""add_trending_rich_profiles_pinned

Revision ID: c730a91e56b4
Revises: b281f930129f
Create Date: 2026-08-07 20:15:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c730a91e56b4'
down_revision: str | None = 'b281f930129f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Case Studies
    op.add_column('case_studies', sa.Column('views_count', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.add_column('case_studies', sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.create_index('ix_case_studies_is_pinned', 'case_studies', ['is_pinned'], unique=False)
    op.create_index('ix_case_studies_author_pinned', 'case_studies', ['author_id', 'is_pinned'], unique=False)

    # Profiles
    op.add_column('profiles', sa.Column('github_url', sa.String(length=255), nullable=True))
    op.add_column('profiles', sa.Column('linkedin_url', sa.String(length=255), nullable=True))
    op.add_column('profiles', sa.Column('portfolio_url', sa.String(length=255), nullable=True))
    op.add_column('profiles', sa.Column('skills', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('profiles', sa.Column('tech_stack', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('profiles', sa.Column('experience', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Profiles
    op.drop_column('profiles', 'experience')
    op.drop_column('profiles', 'tech_stack')
    op.drop_column('profiles', 'skills')
    op.drop_column('profiles', 'portfolio_url')
    op.drop_column('profiles', 'linkedin_url')
    op.drop_column('profiles', 'github_url')

    # Case Studies
    op.drop_index('ix_case_studies_author_pinned', table_name='case_studies')
    op.drop_index('ix_case_studies_is_pinned', table_name='case_studies')
    op.drop_column('case_studies', 'is_pinned')
    op.drop_column('case_studies', 'views_count')
