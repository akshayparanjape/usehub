"""
Postgres full-text search over case studies and users.
GIN index on the tsvector column is created via migration.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.case_study import CaseStudy, CaseStudyTag, Tag
from app.db.models.user import User
from app.db.session import get_db
from app.modules.case_studies.router import _cs_to_list_out
from app.modules.case_studies.schemas import TagOut
from app.modules.users.schemas import UserMinimalOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    type: str = Query(default="all", description="all | case_study | user | tag"),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if type not in ("case_study", "user", "tag", "all"):
        raise HTTPException(status_code=400, detail="type must be case_study, user, tag, or all")

    results: dict = {}

    if type in ("case_study", "all"):
        cs_result = await db.execute(
            select(CaseStudy)
            .where(
                CaseStudy.visibility == "public",
                CaseStudy.deleted_at == None,  # noqa: E711
                or_(
                    text(
                        "to_tsvector('english', case_studies.title || ' ' || "
                        "COALESCE(case_studies.summary, '')) @@ plainto_tsquery('english', :q)"
                    ),
                    CaseStudy.title.ilike(f"%{q}%"),
                ),
            )
            .options(
                selectinload(CaseStudy.author),
                selectinload(CaseStudy.tags).selectinload(CaseStudyTag.tag),
            )
            .order_by(CaseStudy.published_at.desc())
            .limit(limit)
            .offset(offset)
            .params(q=q)
        )
        case_studies = list(cs_result.scalars())
        results["case_studies"] = [_cs_to_list_out(cs) for cs in case_studies]

    if type in ("user", "all"):
        user_result = await db.execute(
            select(User)
            .where(
                User.is_active == True,  # noqa: E712
                or_(
                    User.name.ilike(f"%{q}%"),
                    User.handle.ilike(f"%{q}%"),
                ),
            )
            .limit(limit)
            .offset(offset)
        )
        users = list(user_result.scalars())
        results["users"] = [
            UserMinimalOut(id=u.id, handle=u.handle, name=u.name, avatar_url=u.avatar_url)
            for u in users
        ]

    if type in ("tag", "all"):
        tag_result = await db.execute(
            select(Tag)
            .where(
                or_(
                    Tag.name.ilike(f"%{q}%"),
                    Tag.slug.ilike(f"%{q}%"),
                )
            )
            .limit(limit)
            .offset(offset)
        )
        tags = list(tag_result.scalars())
        results["tags"] = [TagOut(id=t.id, name=t.name, slug=t.slug) for t in tags]

    return results


@router.get("/suggestions")
async def suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tag_res = await db.execute(
        select(Tag).where(Tag.name.ilike(f"%{q}%")).limit(5)
    )
    tags = list(tag_res.scalars())

    user_res = await db.execute(
        select(User)
        .where(
            User.is_active == True,  # noqa: E712
            or_(User.name.ilike(f"%{q}%"), User.handle.ilike(f"%{q}%")),
        )
        .limit(5)
    )
    users = list(user_res.scalars())

    cs_res = await db.execute(
        select(CaseStudy)
        .where(
            CaseStudy.visibility == "public",
            CaseStudy.is_draft == False,  # noqa: E712
            CaseStudy.deleted_at == None,  # noqa: E711
            CaseStudy.title.ilike(f"%{q}%"),
        )
        .limit(5)
    )
    case_studies = list(cs_res.scalars())

    return {
        "tags": [t.name for t in tags],
        "users": [{"handle": u.handle, "name": u.name} for u in users],
        "case_studies": [{"id": cs.id, "title": cs.title, "slug": cs.slug, "author_handle": cs.author_id} for cs in case_studies],
    }

