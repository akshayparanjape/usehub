"""Case study CRUD and versioning logic."""

from datetime import UTC, datetime

from slugify import slugify
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import new_uuid
from app.db.models.case_study import CaseStudy, CaseStudyTag, CaseStudyVersion, Tag
from app.db.models.engagement import RecentlyViewed
from app.db.models.user import User
from app.db.redis import get_redis_client
from app.modules.case_studies.schemas import CaseStudyCreateIn, CaseStudyUpdateIn

STREAM_KEY = "stream:events"


async def _get_or_create_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
    tags = []
    for name in tag_names:
        slug = slugify(name, separator="-")
        result = await db.execute(select(Tag).where(Tag.slug == slug))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(id=new_uuid(), name=name, slug=slug)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags


async def _generate_slug(db: AsyncSession, title: str, author_id: str) -> str:
    base = slugify(title, max_length=100) or "case-study"
    slug = base
    counter = 1
    while True:
        result = await db.execute(
            select(CaseStudy).where(
                CaseStudy.author_id == author_id,
                CaseStudy.slug == slug,
            )
        )
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


async def create_case_study(db: AsyncSession, author: User, data: CaseStudyCreateIn) -> CaseStudy:
    slug = await _generate_slug(db, data.title, author.id)
    case_study = CaseStudy(
        id=new_uuid(),
        author_id=author.id,
        title=data.title,
        slug=slug,
        summary=data.summary,
        ai_model=data.ai_model,
        ai_platform=data.ai_platform,
        visibility=data.visibility,
        is_draft=data.is_draft,
    )
    db.add(case_study)
    await db.flush()

    version = CaseStudyVersion(
        id=new_uuid(),
        case_study_id=case_study.id,
        version_number=1,
        title=data.title,
        edited_by_id=author.id,
        content=data.content.model_dump(),
        change_message=data.change_message or "Initial version",
        created_at=datetime.now(UTC),
    )
    db.add(version)
    await db.flush()

    case_study.current_version_id = version.id

    tags = await _get_or_create_tags(db, data.tags)
    for tag in tags:
        db.add(CaseStudyTag(id=new_uuid(), case_study_id=case_study.id, tag_id=tag.id))

    if not data.is_draft or data.visibility == "public":
        case_study.is_draft = False
        case_study.published_at = datetime.now(UTC)
        await _emit_event(
            "case_study.published", {"case_study_id": case_study.id, "author_id": author.id}
        )

    await db.flush()
    result = await db.execute(
        select(CaseStudy)
        .where(CaseStudy.id == case_study.id)
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
    )
    return result.scalar_one()


async def update_case_study(
    db: AsyncSession, case_study: CaseStudy, data: CaseStudyUpdateIn, user: User | None = None
) -> CaseStudy:
    if data.title is not None:
        case_study.title = data.title
    if data.summary is not None:
        case_study.summary = data.summary
    if data.ai_model is not None:
        case_study.ai_model = data.ai_model
    if data.ai_platform is not None:
        case_study.ai_platform = data.ai_platform

    was_draft = case_study.is_draft
    if data.is_draft is not None:
        case_study.is_draft = data.is_draft

    if data.visibility is not None:
        case_study.visibility = data.visibility

    # If transitioning from draft to published (or visibility becomes public)
    if (was_draft and not case_study.is_draft) or (case_study.visibility == "public" and was_draft):
        case_study.is_draft = False
        if not case_study.published_at:
            case_study.published_at = datetime.now(UTC)
        await _emit_event(
            "case_study.published",
            {"case_study_id": case_study.id, "author_id": case_study.author_id},
        )

    if data.content is not None or data.title is not None:
        result = await db.execute(
            select(CaseStudyVersion)
            .where(CaseStudyVersion.case_study_id == case_study.id)
            .order_by(CaseStudyVersion.version_number.desc())
            .limit(1)
        )
        last = result.scalar_one_or_none()
        current_num = last.version_number if last else 0
        content_dict = (
            data.content.model_dump()
            if data.content is not None
            else (last.content if last else {})
        )
        version = CaseStudyVersion(
            id=new_uuid(),
            case_study_id=case_study.id,
            version_number=current_num + 1,
            title=case_study.title,
            edited_by_id=user.id if user else case_study.author_id,
            content=content_dict,
            change_message=data.change_message or "Updated",
            created_at=datetime.now(UTC),
        )
        db.add(version)
        await db.flush()
        case_study.current_version_id = version.id

    if data.tags is not None:
        await db.execute(delete(CaseStudyTag).where(CaseStudyTag.case_study_id == case_study.id))
        tags = await _get_or_create_tags(db, data.tags)
        for tag in tags:
            db.add(CaseStudyTag(id=new_uuid(), case_study_id=case_study.id, tag_id=tag.id))

    await db.flush()
    result = await db.execute(
        select(CaseStudy)
        .where(CaseStudy.id == case_study.id)
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
    )
    return result.scalar_one()


async def get_case_study(
    db: AsyncSession, case_study_id: str, viewer_id: str | None = None
) -> CaseStudy | None:
    result = await db.execute(
        select(CaseStudy)
        .where(CaseStudy.id == case_study_id, CaseStudy.deleted_at == None)  # noqa: E711
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
    )
    cs = result.scalar_one_or_none()
    if not cs:
        return None
    if (cs.is_draft or cs.visibility == "private") and cs.author_id != viewer_id:
        return None
    return cs


async def get_current_version(db: AsyncSession, case_study: CaseStudy) -> CaseStudyVersion | None:
    if not case_study.current_version_id:
        return None
    result = await db.execute(
        select(CaseStudyVersion).where(CaseStudyVersion.id == case_study.current_version_id)
    )
    return result.scalar_one_or_none()


async def list_user_case_studies(
    db: AsyncSession,
    author_id: str,
    viewer_id: str | None,
    limit: int = 20,
    cursor: str | None = None,
) -> list[CaseStudy]:
    query = (
        select(CaseStudy)
        .where(
            CaseStudy.author_id == author_id,
            CaseStudy.deleted_at == None,  # noqa: E711
        )
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
        .order_by(CaseStudy.published_at.desc().nulls_last(), CaseStudy.created_at.desc())
        .limit(limit)
    )
    if viewer_id != author_id:
        query = query.where(CaseStudy.visibility == "public", CaseStudy.is_draft == False)  # noqa: E712
    if cursor:
        query = query.where(CaseStudy.id < cursor)

    result = await db.execute(query)
    return list(result.scalars())


async def list_user_drafts(
    db: AsyncSession,
    author_id: str,
    limit: int = 20,
    cursor: str | None = None,
) -> list[CaseStudy]:
    query = (
        select(CaseStudy)
        .where(
            CaseStudy.author_id == author_id,
            CaseStudy.is_draft == True,  # noqa: E712
            CaseStudy.deleted_at == None,  # noqa: E711
        )
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
        .order_by(CaseStudy.created_at.desc())
        .limit(limit)
    )
    if cursor:
        query = query.where(CaseStudy.id < cursor)

    result = await db.execute(query)
    return list(result.scalars())


async def list_public_case_studies(
    db: AsyncSession,
    limit: int = 20,
    cursor: str | None = None,
) -> list[CaseStudy]:
    query = (
        select(CaseStudy)
        .where(
            CaseStudy.visibility == "public",
            CaseStudy.is_draft == False,  # noqa: E712
            CaseStudy.deleted_at == None,  # noqa: E711
        )
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
        .order_by(CaseStudy.published_at.desc())
        .limit(limit)
    )
    if cursor:
        query = query.where(CaseStudy.published_at < cursor)

    result = await db.execute(query)
    return list(result.scalars())


async def soft_delete(db: AsyncSession, case_study: CaseStudy) -> None:
    case_study.deleted_at = datetime.now(UTC)
    await db.flush()


async def pin_case_study(db: AsyncSession, case_study: CaseStudy) -> CaseStudy:
    await db.execute(
        text(
            "UPDATE case_studies SET is_pinned = False WHERE author_id = :author_id AND is_pinned = True"
        ),
        {"author_id": case_study.author_id},
    )
    case_study.is_pinned = True
    await db.flush()
    return case_study


async def unpin_case_study(db: AsyncSession, case_study: CaseStudy) -> CaseStudy:
    case_study.is_pinned = False
    await db.flush()
    return case_study


async def increment_views(db: AsyncSession, case_study_id: str) -> None:
    await db.execute(
        text("UPDATE case_studies SET views_count = views_count + 1 WHERE id = :id"),
        {"id": case_study_id},
    )
    await db.flush()


async def _emit_event(event_type: str, payload: dict) -> None:
    try:
        redis = get_redis_client()
        await redis.xadd(
            STREAM_KEY, {"type": event_type, **{str(k): str(v) for k, v in payload.items()}}
        )
    except Exception:
        pass  # Non-critical — events are best-effort


async def list_versions(db: AsyncSession, case_study_id: str) -> list[CaseStudyVersion]:
    result = await db.execute(
        select(CaseStudyVersion)
        .where(CaseStudyVersion.case_study_id == case_study_id)
        .options(selectinload(CaseStudyVersion.edited_by))
        .order_by(CaseStudyVersion.version_number.desc())
    )
    return list(result.scalars())


async def get_version_detail(
    db: AsyncSession, case_study_id: str, version_id: str
) -> CaseStudyVersion | None:
    result = await db.execute(
        select(CaseStudyVersion)
        .where(
            CaseStudyVersion.id == version_id,
            CaseStudyVersion.case_study_id == case_study_id,
        )
        .options(selectinload(CaseStudyVersion.edited_by))
    )
    return result.scalar_one_or_none()


async def restore_version(
    db: AsyncSession, case_study: CaseStudy, version_id: str, user: User
) -> CaseStudy:
    target_version = await get_version_detail(db, case_study.id, version_id)
    if not target_version:
        raise ValueError("Version not found")

    if target_version.title:
        case_study.title = target_version.title

    result = await db.execute(
        select(CaseStudyVersion)
        .where(CaseStudyVersion.case_study_id == case_study.id)
        .order_by(CaseStudyVersion.version_number.desc())
        .limit(1)
    )
    last = result.scalar_one()

    new_version = CaseStudyVersion(
        id=new_uuid(),
        case_study_id=case_study.id,
        version_number=last.version_number + 1,
        title=case_study.title,
        edited_by_id=user.id,
        content=target_version.content,
        change_message=f"Restored from Version {target_version.version_number}",
        created_at=datetime.now(UTC),
    )
    db.add(new_version)
    await db.flush()

    case_study.current_version_id = new_version.id
    await db.flush()

    res = await db.execute(
        select(CaseStudy)
        .where(CaseStudy.id == case_study.id)
        .options(
            selectinload(CaseStudy.author),
            selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
        )
    )
    return res.scalar_one()


async def record_view(db: AsyncSession, case_study_id: str, user_id: str | None = None) -> None:
    await db.execute(
        text("UPDATE case_studies SET views_count = views_count + 1 WHERE id = :id"),
        {"id": case_study_id},
    )

    if user_id:
        result = await db.execute(
            select(RecentlyViewed).where(
                RecentlyViewed.user_id == user_id,
                RecentlyViewed.case_study_id == case_study_id,
            )
        )
        rv = result.scalar_one_or_none()
        if rv:
            rv.viewed_at = datetime.now(UTC)
        else:
            rv = RecentlyViewed(
                id=new_uuid(),
                user_id=user_id,
                case_study_id=case_study_id,
                viewed_at=datetime.now(UTC),
            )
            db.add(rv)

    await db.flush()


async def get_recently_viewed(
    db: AsyncSession, user_id: str, limit: int = 10
) -> list[RecentlyViewed]:
    result = await db.execute(
        select(RecentlyViewed)
        .where(RecentlyViewed.user_id == user_id)
        .options(
            selectinload(RecentlyViewed.case_study).selectinload(CaseStudy.author),
            selectinload(RecentlyViewed.case_study)
            .selectinload(CaseStudy.tags)
            .selectinload(CaseStudyTag.tag),
        )
        .order_by(RecentlyViewed.viewed_at.desc())
        .limit(limit)
    )
    return list(result.scalars())
