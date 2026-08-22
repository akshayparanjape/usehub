from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import new_uuid
from app.db.models.case_study import CaseStudy
from app.db.models.engagement import Report
from app.db.models.notification import Notification
from app.db.models.user import User
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.case_studies.schemas import (
    AuthorOut,
    ReportCreateIn,
    ReportOut,
    ReportUpdateIn,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportOut:
    report = Report(
        id=new_uuid(),
        reporter_id=current_user.id,
        target_type=data.target_type,
        target_id=data.target_id,
        reason=data.reason,
        details=data.details,
        status="pending",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db.add(report)

    # Notify author if a case study was reported
    if data.target_type == "case_study":
        cs_res = await db.execute(select(CaseStudy).where(CaseStudy.id == data.target_id))
        cs = cs_res.scalar_one_or_none()
        if cs and cs.author_id != current_user.id:
            notification = Notification(
                id=new_uuid(),
                recipient_id=cs.author_id,
                type="case_study_reported",
                payload={
                    "actor_handle": current_user.handle,
                    "actor_name": current_user.name,
                    "case_study_id": cs.id,
                    "case_study_title": cs.title,
                    "case_study_slug": cs.slug,
                    "reason": data.reason,
                    "details": data.details,
                },
                created_at=datetime.now(UTC),
            )
            db.add(notification)

    await db.flush()

    res = await db.execute(
        select(Report).where(Report.id == report.id).options(selectinload(Report.reporter))
    )
    rep = res.scalar_one()

    return ReportOut(
        id=rep.id,
        reporter=AuthorOut(
            id=rep.reporter.id,
            handle=rep.reporter.handle,
            name=rep.reporter.name,
            avatar_url=rep.reporter.avatar_url,
        ),
        target_type=rep.target_type,
        target_id=rep.target_id,
        reason=rep.reason,
        details=rep.details,
        status=rep.status,
        created_at=rep.created_at,
        updated_at=rep.updated_at,
    )


@router.get("", response_model=list[ReportOut])
async def list_reports(
    status_filter: str | None = Query(default=None, alias="status"),
    target_type: str | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReportOut]:
    query = select(Report).options(selectinload(Report.reporter)).order_by(Report.created_at.desc())

    if status_filter:
        query = query.where(Report.status == status_filter)
    if target_type:
        query = query.where(Report.target_type == target_type)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    reports = list(result.scalars())

    return [
        ReportOut(
            id=rep.id,
            reporter=AuthorOut(
                id=rep.reporter.id,
                handle=rep.reporter.handle,
                name=rep.reporter.name,
                avatar_url=rep.reporter.avatar_url,
            ),
            target_type=rep.target_type,
            target_id=rep.target_id,
            reason=rep.reason,
            details=rep.details,
            status=rep.status,
            created_at=rep.created_at,
            updated_at=rep.updated_at,
        )
        for rep in reports
    ]


@router.patch("/{report_id}", response_model=ReportOut)
async def update_report_status(
    report_id: str,
    data: ReportUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportOut:
    result = await db.execute(
        select(Report).where(Report.id == report_id).options(selectinload(Report.reporter))
    )
    rep = result.scalar_one_or_none()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    rep.status = data.status
    rep.updated_at = datetime.now(UTC)
    await db.flush()

    return ReportOut(
        id=rep.id,
        reporter=AuthorOut(
            id=rep.reporter.id,
            handle=rep.reporter.handle,
            name=rep.reporter.name,
            avatar_url=rep.reporter.avatar_url,
        ),
        target_type=rep.target_type,
        target_id=rep.target_id,
        reason=rep.reason,
        details=rep.details,
        status=rep.status,
        created_at=rep.created_at,
        updated_at=rep.updated_at,
    )
