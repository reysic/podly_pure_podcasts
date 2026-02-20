"""Utility functions for feed route handlers."""

import logging

from app.jobs_manager import get_jobs_manager
from app.models import Feed
from app.writer.client import writer_client

logger = logging.getLogger("global_logger")


def whitelist_latest_for_first_member(
    feed: Feed, requested_by_user_id: int | None
) -> None:
    """When a feed goes from 0→1 members, whitelist and process the latest post.

    Respects global/per-feed whitelist settings; skips if auto-whitelist is disabled.
    """
    # Respect global/per-feed whitelist settings; skip if auto-whitelist is disabled.
    from app.feeds import (  # pylint: disable=import-outside-toplevel
        _should_auto_whitelist_new_posts,
    )

    if not _should_auto_whitelist_new_posts(feed):
        return

    try:
        result = writer_client.action(
            "whitelist_latest_post_for_feed", {"feed_id": feed.id}, wait=True
        )
        if not result or not result.success or not isinstance(result.data, dict):
            return
        post_guid = result.data.get("post_guid")
        updated = bool(result.data.get("updated"))
        if not updated or not post_guid:
            return
    except Exception:  # pylint: disable=broad-except
        return
    try:
        get_jobs_manager().start_post_processing(
            str(post_guid),
            priority="interactive",
            requested_by_user_id=requested_by_user_id,
            billing_user_id=requested_by_user_id,
        )
    except Exception as exc:  # pylint: disable=broad-except
        logger.error(
            "Failed to enqueue processing for latest post %s: %s", post_guid, exc
        )
