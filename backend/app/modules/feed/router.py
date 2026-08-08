"""
Feed module — Postgres-based cursor-paginated feed for v1.
Redis fan-out is intentionally deferred until measurements demand it.
"""

import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.case_study import CaseStudy, CaseStudyTag
from app.db.models.social import Follow
from app.db.models.user import User
from app.db.redis import get_redis_client
from app.db.session import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.case_studies.router import _cs_to_list_out
from app.modules.case_studies.schemas import CaseStudyListOut

router = APIRouter(tags=["feed"])

TRENDING_CACHE_KEY_PREFIX = "feed:trending"
TRENDING_TTL = 600  # 10 minutes


@router.get("/feed", response_model=list[CaseStudyListOut])
async def get_feed(
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None, description="ISO datetime cursor for pagination"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CaseStudyListOut]:
    """
    Home feed: case studies from users the current user follows.
    Cursor-paginated by published_at DESC.
    """
    query = (
        select(CaseStudy)
        .join(Follow, Follow.followee_id == CaseStudy.author_id)
        .where(
            Follow.follower_id == current_user.id,
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
    items = list(result.scalars())
    return [_cs_to_list_out(cs) for cs in items]


@router.get("/discover", response_model=list[CaseStudyListOut])
async def get_trending(
    timeframe: str = Query(default="week", pattern="^(today|week|month|all)$"),
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[CaseStudyListOut]:
    """
    Trending discovery feed — cached in Redis for 10 minutes.
    Timeframe options: today (24h), week (7d), month (30d), all.
    Score formula: (likes * 3 + applause * 2 + aha * 2 + comments * 5 + views * 1)
    """
    cache_key = f"{TRENDING_CACHE_KEY_PREFIX}:{timeframe}"
    redis = get_redis_client()
    try:
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return [CaseStudyListOut(**item) for item in data[:limit]]
    except Exception:
        pass

    interval_clause = None
    if timeframe == "today":
        interval_clause = text("case_studies.published_at > NOW() - INTERVAL '1 day'")
    elif timeframe == "week":
        interval_clause = text("case_studies.published_at > NOW() - INTERVAL '7 days'")
    elif timeframe == "month":
        interval_clause = text("case_studies.published_at > NOW() - INTERVAL '30 days'")

    query = select(CaseStudy).where(
        CaseStudy.visibility == "public",
        CaseStudy.is_draft == False,  # noqa: E712
        CaseStudy.deleted_at == None,  # noqa: E711
    )
    if interval_clause is not None:
        query = query.where(interval_clause)

    query = query.options(
        selectinload(CaseStudy.author),
        selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
    ).order_by(
        text(
            "(case_studies.likes_count * 3 + case_studies.applause_count * 2 + "
            "case_studies.aha_count * 2 + case_studies.comments_count * 5 + "
            "case_studies.views_count * 1) DESC, case_studies.published_at DESC"
        )
    ).limit(50)

    result = await db.execute(query)
    items = list(result.scalars())

    # Fallback to all-time if no recent items exist for the chosen timeframe
    if not items and timeframe != "all":
        fallback_query = (
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
            .order_by(
                text(
                    "(case_studies.likes_count * 3 + case_studies.applause_count * 2 + "
                    "case_studies.aha_count * 2 + case_studies.comments_count * 5 + "
                    "case_studies.views_count * 1) DESC, case_studies.published_at DESC"
                )
            )
            .limit(50)
        )
        fallback_res = await db.execute(fallback_query)
        items = list(fallback_res.scalars())

    out = [_cs_to_list_out(cs) for cs in items]

    try:
        serialized = json.dumps([item.model_dump(mode="json") for item in out])
        await redis.setex(cache_key, TRENDING_TTL, serialized)
    except Exception:
        pass

    return out[:limit]
