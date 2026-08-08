"""Redis-based sliding window rate limiter."""

import logging

from fastapi import HTTPException, Request, status
from redis.asyncio import Redis

from app.config import get_settings
from app.db.redis import get_redis_client

logger = logging.getLogger(__name__)
settings = get_settings()


async def _check_limit(redis: Redis, key: str, limit: int, window: int = 3600) -> None:
    pipe = redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    results = await pipe.execute()
    count = results[0]
    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": str(window)},
        )


async def rate_limit_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    method = request.method

    try:
        redis = get_redis_client()
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            # Per-user limit for write operations
            session_cookie = request.cookies.get(settings.session_cookie_name)
            if session_cookie:
                key = f"ratelimit:write:{session_cookie[:16]}"
                await _check_limit(redis, key, settings.rate_limit_post_per_hour)
        else:
            # Per-IP limit for read operations
            client_ip = request.client.host if request.client else "unknown"
            key = f"ratelimit:read:{client_ip}"
            await _check_limit(redis, key, settings.rate_limit_get_per_hour)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Rate limiting skipped due to Redis error: %s", exc)

    return await call_next(request)
