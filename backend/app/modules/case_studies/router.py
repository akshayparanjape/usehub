from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.case_study import CaseStudy
from app.db.models.engagement import Report
from app.db.models.user import User
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.case_studies import service
from app.modules.case_studies.schemas import (
    AuthorOut,
    CaseStudyCreateIn,
    CaseStudyListOut,
    CaseStudyOut,
    CaseStudyUpdateIn,
    CaseStudyVersionDetailOut,
    CaseStudyVersionOut,
    RecentlyViewedOut,
    TagOut,
)

router = APIRouter(prefix="/case-studies", tags=["case-studies"])


def _cs_to_list_out(cs: CaseStudy) -> CaseStudyListOut:
    return CaseStudyListOut(
        id=cs.id,
        author=AuthorOut(
            id=cs.author.id,
            handle=cs.author.handle,
            name=cs.author.name,
            avatar_url=cs.author.avatar_url,
        ),
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        ai_model=cs.ai_model,
        visibility=cs.visibility,
        is_draft=cs.is_draft,
        is_pinned=getattr(cs, "is_pinned", False),
        views_count=getattr(cs, "views_count", 0),
        tags=[TagOut(id=t.tag.id, name=t.tag.name, slug=t.tag.slug) for t in (cs.tags or [])],
        likes_count=cs.likes_count,
        applause_count=cs.applause_count,
        aha_count=cs.aha_count,
        comments_count=cs.comments_count,
        published_at=cs.published_at,
        created_at=cs.created_at,
    )


async def _cs_to_full_out(cs: CaseStudy, db: AsyncSession) -> CaseStudyOut:
    version = await service.get_current_version(db, cs)
    rep_res = await db.execute(
        select(Report).where(
            Report.target_type == "case_study",
            Report.target_id == cs.id,
            Report.status == "pending",
        )
    )
    has_reports = rep_res.first() is not None

    return CaseStudyOut(
        id=cs.id,
        author=AuthorOut(
            id=cs.author.id,
            handle=cs.author.handle,
            name=cs.author.name,
            avatar_url=cs.author.avatar_url,
        ),
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        ai_model=cs.ai_model,
        ai_platform=cs.ai_platform,
        visibility=cs.visibility,
        is_draft=cs.is_draft,
        is_pinned=getattr(cs, "is_pinned", False),
        has_reports=has_reports,
        views_count=getattr(cs, "views_count", 0),
        content=version.content if version else None,
        tags=[TagOut(id=t.tag.id, name=t.tag.name, slug=t.tag.slug) for t in (cs.tags or [])],
        likes_count=cs.likes_count,
        applause_count=cs.applause_count,
        aha_count=cs.aha_count,
        comments_count=cs.comments_count,
        current_version_id=cs.current_version_id,
        published_at=cs.published_at,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@router.post("", response_model=CaseStudyOut, status_code=status.HTTP_201_CREATED)
async def create_case_study(
    data: CaseStudyCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.create_case_study(db, current_user, data)
    return await _cs_to_full_out(cs, db)


@router.get("", response_model=list[CaseStudyListOut])
async def list_public(
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None),
) -> list[CaseStudyListOut]:
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        items = await service.list_public_case_studies(db, limit, cursor)
    return [_cs_to_list_out(cs) for cs in items]


@router.get("/drafts/me", response_model=list[CaseStudyListOut])
async def list_my_drafts(
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CaseStudyListOut]:
    items = await service.list_user_drafts(db, current_user.id, limit, cursor)
    return [_cs_to_list_out(cs) for cs in items]


@router.get("/{case_study_id}", response_model=CaseStudyOut)
async def get_case_study(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(
        db, case_study_id, viewer_id=current_user.id if current_user else None
    )
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    await service.increment_views(db, case_study_id)
    return await _cs_to_full_out(cs, db)


@router.patch("/{case_study_id}", response_model=CaseStudyOut)
async def update_case_study(
    case_study_id: str,
    data: CaseStudyUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    cs = await service.update_case_study(db, cs, data)
    return await _cs_to_full_out(cs, db)


@router.post("/{case_study_id}/publish", response_model=CaseStudyOut)
async def publish_case_study(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    update_data = CaseStudyUpdateIn(is_draft=False, visibility="public")
    cs = await service.update_case_study(db, cs, update_data)
    return await _cs_to_full_out(cs, db)


@router.post("/{case_study_id}/pin", response_model=CaseStudyOut)
async def pin_case_study(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden to pin another user's case study")
    cs = await service.pin_case_study(db, cs)
    return await _cs_to_full_out(cs, db)


@router.post("/{case_study_id}/unpin", response_model=CaseStudyOut)
async def unpin_case_study(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden to unpin another user's case study")
    cs = await service.unpin_case_study(db, cs)
    return await _cs_to_full_out(cs, db)


@router.delete("/{case_study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    await service.soft_delete(db, cs)


@router.post("/{case_study_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def track_view(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> None:
    user_id = current_user.id if current_user else None
    await service.record_view(db, case_study_id, user_id)


@router.get("/recently-viewed/me", response_model=list[RecentlyViewedOut])
async def list_recently_viewed(
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RecentlyViewedOut]:
    items = await service.get_recently_viewed(db, current_user.id, limit)
    res = []
    for rv in items:
        res.append(
            RecentlyViewedOut(
                id=rv.id,
                case_study=_cs_to_list_out(rv.case_study),
                viewed_at=rv.viewed_at,
            )
        )
    return res


@router.get("/{case_study_id}/versions", response_model=list[CaseStudyVersionOut])
async def list_case_study_versions(
    case_study_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> list[CaseStudyVersionOut]:
    cs = await service.get_case_study(
        db, case_study_id, viewer_id=current_user.id if current_user else None
    )
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    versions = await service.list_versions(db, case_study_id)
    out = []
    for v in versions:
        edited_by_out = (
            AuthorOut(
                id=v.edited_by.id,
                handle=v.edited_by.handle,
                name=v.edited_by.name,
                avatar_url=v.edited_by.avatar_url,
            )
            if v.edited_by
            else None
        )
        out.append(
            CaseStudyVersionOut(
                id=v.id,
                version_number=v.version_number,
                title=v.title,
                change_message=v.change_message,
                created_at=v.created_at,
                edited_by=edited_by_out,
            )
        )
    return out


@router.get("/{case_study_id}/versions/{version_id}", response_model=CaseStudyVersionDetailOut)
async def get_case_study_version_detail(
    case_study_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> CaseStudyVersionDetailOut:
    cs = await service.get_case_study(
        db, case_study_id, viewer_id=current_user.id if current_user else None
    )
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    v = await service.get_version_detail(db, case_study_id, version_id)
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")

    edited_by_out = (
        AuthorOut(
            id=v.edited_by.id,
            handle=v.edited_by.handle,
            name=v.edited_by.name,
            avatar_url=v.edited_by.avatar_url,
        )
        if v.edited_by
        else None
    )
    return CaseStudyVersionDetailOut(
        id=v.id,
        version_number=v.version_number,
        title=v.title,
        change_message=v.change_message,
        created_at=v.created_at,
        edited_by=edited_by_out,
        content=v.content,
    )


@router.post("/{case_study_id}/versions/{version_id}/restore", response_model=CaseStudyOut)
async def restore_case_study_version(
    case_study_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CaseStudyOut:
    cs = await service.get_case_study(db, case_study_id, viewer_id=current_user.id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    if cs.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        updated_cs = await service.restore_version(db, cs, version_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    return await _cs_to_full_out(updated_cs, db)

