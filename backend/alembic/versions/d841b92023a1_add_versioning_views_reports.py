"""add_versioning_views_reports

Revision ID: d841b92023a1
Revises: c730a91e56b4
Create Date: 2026-08-08 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd841b92023a1'
down_revision: str | None = 'c730a91e56b4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update case_study_versions
    op.add_column('case_study_versions', sa.Column('title', sa.String(length=300), nullable=True))
    op.add_column('case_study_versions', sa.Column('edited_by_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_case_study_versions_edited_by', 'case_study_versions', 'users', ['edited_by_id'], ['id'], ondelete='SET NULL')

    # 2. Recently Viewed table
    op.create_table(
        'recently_viewed',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('case_study_id', sa.String(length=36), nullable=False),
        sa.Column('viewed_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['case_study_id'], ['case_studies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'case_study_id', name='uq_recently_viewed')
    )
    op.create_index('ix_recently_viewed_user_id', 'recently_viewed', ['user_id'], unique=False)
    op.create_index('ix_recently_viewed_case_study_id', 'recently_viewed', ['case_study_id'], unique=False)

    # 3. Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('reporter_id', sa.String(length=36), nullable=False),
        sa.Column('target_type', sa.String(length=20), nullable=False),
        sa.Column('target_id', sa.String(length=36), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_reports_reporter_id', 'reports', ['reporter_id'], unique=False)
    op.create_index('ix_reports_target_id', 'reports', ['target_id'], unique=False)
    op.create_index('ix_reports_status', 'reports', ['status'], unique=False)


def downgrade() -> None:
    # Reports
    op.drop_index('ix_reports_status', table_name='reports')
    op.drop_index('ix_reports_target_id', table_name='reports')
    op.drop_index('ix_reports_reporter_id', table_name='reports')
    op.drop_table('reports')

    # Recently Viewed
    op.drop_index('ix_recently_viewed_case_study_id', table_name='recently_viewed')
    op.drop_index('ix_recently_viewed_user_id', table_name='recently_viewed')
    op.drop_table('recently_viewed')

    # case_study_versions
    op.drop_constraint('fk_case_study_versions_edited_by', 'case_study_versions', type_='foreignkey')
    op.drop_column('case_study_versions', 'edited_by_id')
    op.drop_column('case_study_versions', 'title')
