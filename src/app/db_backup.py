"""Database backup utilities.

Provides hot backup support for the SQLite database using the stdlib
``sqlite3.Connection.backup()`` API, which is safe to run concurrently with
WAL-mode databases.
"""

from __future__ import annotations

import logging
import sqlite3
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("global_logger")


def get_backup_dir() -> Path:
    """Return the path to the backup directory inside the instance folder."""
    from shared.processing_paths import (
        get_instance_dir,  # pylint: disable=import-outside-toplevel
    )

    return get_instance_dir() / "backups"


def perform_backup(retention_count: int = 7) -> dict:
    """Perform a hot backup of the SQLite database.

    Creates a timestamped copy in ``{instance_dir}/backups/`` and prunes old
    backups so only *retention_count* most-recent files are kept.

    Returns a dict with keys ``ok``, ``path``, ``timestamp``, and ``error``.
    """
    from shared.processing_paths import (
        get_instance_dir,  # pylint: disable=import-outside-toplevel
    )

    db_path = get_instance_dir() / "sqlite3.db"
    backup_dir = get_backup_dir()
    backup_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest_path = backup_dir / f"sqlite3_{ts}.db"

    try:
        src = sqlite3.connect(str(db_path))
        dst = sqlite3.connect(str(dest_path))
        src.backup(dst)
        dst.close()
        src.close()
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("DB backup failed: %s", exc, exc_info=True)
        return {"ok": False, "error": str(exc), "path": None, "timestamp": None}

    _prune_backups(backup_dir, retention_count)
    success_ts = datetime.utcnow().isoformat()
    logger.info("DB backup succeeded: %s", dest_path)
    return {"ok": True, "path": str(dest_path), "timestamp": success_ts, "error": None}


def _prune_backups(backup_dir: Path, keep: int) -> None:
    """Delete the oldest backup files beyond *keep* count."""
    if keep <= 0:
        return
    files = sorted(
        backup_dir.glob("sqlite3_*.db"),
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )
    for f in files[keep:]:
        try:
            f.unlink()
            logger.info("Pruned old backup: %s", f)
        except OSError as exc:
            logger.warning("Could not prune backup %s: %s", f, exc)


def get_backup_status() -> dict:
    """Return metadata about existing backups (no DB reads)."""
    backup_dir = get_backup_dir()
    if backup_dir.exists():
        files = sorted(
            backup_dir.glob("sqlite3_*.db"),
            key=lambda f: f.stat().st_mtime,
            reverse=True,
        )
    else:
        files = []
    return {
        "backup_dir": str(backup_dir),
        "backup_count": len(files),
        "backup_files": [f.name for f in files[:10]],
    }


def scheduled_db_backup() -> None:
    """APScheduler entry point for the periodic DB backup job."""
    from app.extensions import scheduler  # pylint: disable=import-outside-toplevel

    if not hasattr(scheduler, "app") or scheduler.app is None:
        logger.warning("DB backup skipped: scheduler has no app context.")
        return

    try:
        with scheduler.app.app_context():
            from app.runtime_config import (  # pylint: disable=import-outside-toplevel
                config as runtime_config,
            )
            from app.writer.client import (
                writer_client,  # pylint: disable=import-outside-toplevel
            )
            from shared import (
                defaults as DEFAULTS,  # pylint: disable=import-outside-toplevel
            )

            retention = getattr(
                runtime_config,
                "db_backup_retention_count",
                DEFAULTS.APP_DB_BACKUP_RETENTION_COUNT,
            )
            result = perform_backup(retention_count=int(retention))
            if result.get("ok"):
                writer_client.action(
                    "record_db_backup",
                    {"success_at": datetime.utcnow().isoformat()},
                    wait=True,
                )
                logger.info("Scheduled DB backup succeeded: %s", result.get("path"))
            else:
                logger.error("Scheduled DB backup failed: %s", result.get("error"))
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Scheduled DB backup error: %s", exc, exc_info=True)
