"""Shared pytest fixtures for the backend test suite.

All ASGI tests import the FastAPI `app` object, which mounts rate-limit
middleware that calls `get_redis_client()` on every non-OPTIONS request.
The health endpoint also pings Redis directly.  Without mocking, these
tests depend on a live Redis connection and can fail with
`RuntimeError: Event loop is closed` when the singleton client is created
in one event-loop and reused in another.

The `mock_redis` autouse fixture patches every module that imported
`get_redis_client` so no real network call is attempted.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _make_redis_mock() -> AsyncMock:
    """Return an AsyncMock that satisfies the Redis API surface used in tests."""
    redis = AsyncMock()

    # pipeline() is synchronous; execute() is async
    pipe = AsyncMock()
    pipe.incr = MagicMock(return_value=pipe)
    pipe.expire = MagicMock(return_value=pipe)
    pipe.execute = AsyncMock(return_value=[1, True])  # count=1 → never rate-limited
    redis.pipeline = MagicMock(return_value=pipe)

    # Health endpoint
    redis.ping = AsyncMock(return_value=True)

    # Auth session / OAuth state
    redis.setex = AsyncMock(return_value=True)
    redis.get = AsyncMock(return_value=None)
    redis.expire = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)

    # Notification stream
    redis.xadd = AsyncMock(return_value=b"0-0")

    return redis


@pytest.fixture(autouse=True)
def mock_redis():
    """Patch get_redis_client() everywhere it was imported so no real Redis is needed."""
    redis_mock = _make_redis_mock()

    # Patch the canonical source plus every module that did
    # `from app.db.redis import get_redis_client` (each gets its own binding).
    targets = [
        "app.db.redis.get_redis_client",
        "app.middleware.rate_limit.get_redis_client",
        "app.modules.auth.router.get_redis_client",
        "app.modules.auth.dependencies.get_redis_client",
        "app.modules.case_studies.service.get_redis_client",
        "app.modules.engagement.service.get_redis_client",
        "app.modules.notifications.consumer.get_redis_client",
        "app.modules.feed.router.get_redis_client",
    ]

    patches = [patch(t, return_value=redis_mock) for t in targets]
    for p in patches:
        p.start()

    yield redis_mock

    for p in patches:
        p.stop()
