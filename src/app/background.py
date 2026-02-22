from datetime import datetime, timedelta

from app.extensions import scheduler
from app.jobs_manager import (
    scheduled_refresh_all_feeds,
)
from app.post_cleanup import scheduled_cleanup_processed_posts


def add_background_job(minutes: int) -> None:
    """Add the recurring background job for refreshing feeds.

    minutes: interval in minutes; must be a positive integer.
    """

    scheduler.add_job(
        id="refresh_all_feeds",
        func=scheduled_refresh_all_feeds,
        trigger="interval",
        minutes=minutes,
        replace_existing=True,
    )


def schedule_cleanup_job(retention_days: int | None) -> None:
    """Ensure the periodic cleanup job is scheduled or disabled as needed."""
    job_id = "cleanup_processed_posts"
    if retention_days is None or retention_days <= 0:
        try:
            scheduler.remove_job(job_id)
        except Exception:
            # Job may not be scheduled; ignore.
            pass
        return

    # Run daily; allow scheduler to coalesce missed runs.
    scheduler.add_job(
        id=job_id,
        func=scheduled_cleanup_processed_posts,
        trigger="interval",
        hours=24,
        next_run_time=datetime.utcnow() + timedelta(minutes=15),
        replace_existing=True,
    )


def schedule_db_backup_job(hours: int = 24, enabled: bool = False) -> None:
    """Ensure the periodic DB backup job is scheduled or disabled as needed."""
    from app.db_backup import (
        scheduled_db_backup,  # pylint: disable=import-outside-toplevel
    )

    job_id = "db_backup"
    if not enabled or hours <= 0:
        try:
            scheduler.remove_job(job_id)
        except Exception:
            # Job may not be scheduled; ignore.
            pass
        return

    scheduler.add_job(
        id=job_id,
        func=scheduled_db_backup,
        trigger="interval",
        hours=hours,
        next_run_time=datetime.utcnow() + timedelta(minutes=5),
        replace_existing=True,
    )
