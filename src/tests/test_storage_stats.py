"""Tests for storage stats functions in post_cleanup."""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

from app.extensions import db
from app.models import Feed, Post, ProcessingJob
from app.post_cleanup import get_reclaimable_storage_bytes, get_storage_bytes_used


def _create_feed() -> Feed:
    feed = Feed(
        title="Storage Test Feed",
        description="desc",
        author="author",
        rss_url="https://example.com/storage-feed.xml",
        image_url="https://example.com/image.png",
    )
    db.session.add(feed)
    db.session.commit()
    return feed


def _create_post(feed: Feed, guid: str) -> Post:
    post = Post(
        feed_id=feed.id,
        guid=guid,
        download_url=f"https://example.com/{guid}.mp3",
        title=f"Episode {guid}",
        description="test",
        whitelisted=True,
    )
    db.session.add(post)
    db.session.commit()
    return post


def test_get_storage_bytes_used_no_files(app) -> None:
    """Returns 0 when no posts have audio paths."""
    with app.app_context():
        assert get_storage_bytes_used() == 0


def test_get_storage_bytes_used_with_files(app, tmp_path) -> None:
    """Sums sizes of existing processed and unprocessed audio files."""
    with app.app_context():
        feed = _create_feed()
        post = _create_post(feed, "storage-guid-1")

        processed = Path(tmp_path) / "processed.mp3"
        unprocessed = Path(tmp_path) / "unprocessed.mp3"
        processed.write_bytes(b"x" * 1000)
        unprocessed.write_bytes(b"y" * 500)

        post.processed_audio_path = str(processed)
        post.unprocessed_audio_path = str(unprocessed)
        db.session.commit()

        assert get_storage_bytes_used() == 1500


def test_get_storage_bytes_used_missing_files(app, tmp_path) -> None:
    """Skips paths that do not exist on disk."""
    with app.app_context():
        feed = _create_feed()
        post = _create_post(feed, "storage-guid-2")

        existing = Path(tmp_path) / "existing.mp3"
        existing.write_bytes(b"z" * 200)

        post.processed_audio_path = str(existing)
        post.unprocessed_audio_path = str(tmp_path / "missing.mp3")
        db.session.commit()

        assert get_storage_bytes_used() == 200


def test_get_reclaimable_storage_bytes_no_retention(app) -> None:
    """Returns 0 when retention_days is None."""
    with app.app_context():
        assert get_reclaimable_storage_bytes(None) == 0


def test_get_reclaimable_storage_bytes_eligible_post(app, tmp_path) -> None:
    """Returns file sizes of posts eligible for cleanup."""
    with app.app_context():
        feed = _create_feed()

        old_post = _create_post(feed, "reclaimable-old-guid")
        recent_post = _create_post(feed, "reclaimable-recent-guid")

        old_processed = Path(tmp_path) / "old_processed.mp3"
        old_unprocessed = Path(tmp_path) / "old_unprocessed.mp3"
        old_processed.write_bytes(b"a" * 2000)
        old_unprocessed.write_bytes(b"b" * 1000)
        old_post.processed_audio_path = str(old_processed)
        old_post.unprocessed_audio_path = str(old_unprocessed)

        recent_processed = Path(tmp_path) / "recent_processed.mp3"
        recent_processed.write_bytes(b"c" * 500)
        recent_post.processed_audio_path = str(recent_processed)

        db.session.commit()

        completed_at = datetime.utcnow() - timedelta(days=10)
        db.session.add(
            ProcessingJob(
                id="reclaimable-job-old",
                post_guid=old_post.guid,
                status="completed",
                current_step=4,
                total_steps=4,
                progress_percentage=100.0,
                created_at=completed_at,
                started_at=completed_at,
                completed_at=completed_at,
            )
        )

        recent_completed = datetime.utcnow() - timedelta(days=2)
        db.session.add(
            ProcessingJob(
                id="reclaimable-job-recent",
                post_guid=recent_post.guid,
                status="completed",
                current_step=4,
                total_steps=4,
                progress_percentage=100.0,
                created_at=recent_completed,
                started_at=recent_completed,
                completed_at=recent_completed,
            )
        )
        db.session.commit()

        # old_post would be cleaned (3000 bytes), recent_post is newest so preserved
        reclaimable = get_reclaimable_storage_bytes(retention_days=5)
        assert reclaimable == 3000
