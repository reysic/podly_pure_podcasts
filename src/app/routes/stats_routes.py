import logging

import flask
from flask import Blueprint
from flask.typing import ResponseReturnValue
from sqlalchemy import func

from app.auth.guards import require_admin
from app.extensions import db
from app.models import (
    Feed,
    Identification,
    ModelCall,
    Post,
    ProcessingJob,
    TranscriptSegment,
)
from app.post_cleanup import get_reclaimable_storage_bytes, get_storage_bytes_used
from app.runtime_config import config as runtime_config
from shared import defaults as DEFAULTS

logger = logging.getLogger("global_logger")

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/api/stats", methods=["GET"])
def api_get_stats() -> ResponseReturnValue:
    """Return aggregate statistics for the Podly instance."""
    _, error = require_admin("view stats")
    if error:
        return error

    # ---- Feeds & Episodes ----
    total_feeds: int = db.session.query(func.count(Feed.id)).scalar() or 0
    total_episodes: int = db.session.query(func.count(Post.id)).scalar() or 0
    processed_episodes: int = (
        db.session.query(func.count(Post.id))
        .filter(Post.processed_audio_path.isnot(None))
        .scalar()
        or 0
    )

    # ---- Transcript ----
    total_segments: int = (
        db.session.query(func.count(TranscriptSegment.id)).scalar() or 0
    )
    # Estimate total transcribed duration from segment time-spans
    raw_duration = (
        db.session.query(
            func.sum(TranscriptSegment.end_time - TranscriptSegment.start_time)
        ).scalar()
        or 0.0
    )
    total_transcribed_hours: float = round(float(raw_duration) / 3600.0, 2)

    # ---- Model Calls ----
    model_call_rows = (
        db.session.query(ModelCall.model_name, func.count(ModelCall.id))
        .group_by(ModelCall.model_name)
        .all()
    )
    model_calls_by_model: dict[str, int] = {row[0]: row[1] for row in model_call_rows}
    total_model_calls: int = sum(model_calls_by_model.values())

    model_call_status_rows = (
        db.session.query(ModelCall.status, func.count(ModelCall.id))
        .group_by(ModelCall.status)
        .all()
    )
    model_calls_by_status: dict[str, int] = {
        row[0]: row[1] for row in model_call_status_rows
    }

    # ---- Identifications / Ad Detection ----
    total_identifications: int = (
        db.session.query(func.count(Identification.id)).scalar() or 0
    )
    ad_identifications: int = (
        db.session.query(func.count(Identification.id))
        .filter(Identification.label == "ad")
        .scalar()
        or 0
    )

    # Estimated ad time: sum of duration of segments identified as ad (at least once)
    ad_segment_ids_subq = (
        db.session.query(Identification.transcript_segment_id)
        .filter(Identification.label == "ad")
        .distinct()
        .subquery()
    )
    raw_ad_duration = (
        db.session.query(
            func.sum(TranscriptSegment.end_time - TranscriptSegment.start_time)
        )
        .filter(TranscriptSegment.id.in_(ad_segment_ids_subq))
        .scalar()
        or 0.0
    )
    estimated_ad_hours: float = round(float(raw_ad_duration) / 3600.0, 2)
    estimated_ad_minutes: float = round(float(raw_ad_duration) / 60.0, 1)

    # ---- Processing Jobs ----
    job_status_rows = (
        db.session.query(ProcessingJob.status, func.count(ProcessingJob.id))
        .group_by(ProcessingJob.status)
        .all()
    )
    jobs_by_status: dict[str, int] = {row[0]: row[1] for row in job_status_rows}
    total_jobs: int = sum(jobs_by_status.values())
    completed_jobs: int = jobs_by_status.get("completed", 0)
    failed_jobs: int = jobs_by_status.get("failed", 0)
    success_rate: float | None = (
        round(completed_jobs / (completed_jobs + failed_jobs) * 100.0, 1)
        if (completed_jobs + failed_jobs) > 0
        else None
    )

    # ---- Storage ----
    retention_days: int | None = getattr(
        runtime_config,
        "post_cleanup_retention_days",
        DEFAULTS.APP_POST_CLEANUP_RETENTION_DAYS,
    )
    storage_bytes_used: int = get_storage_bytes_used()
    storage_bytes_reclaimable: int = get_reclaimable_storage_bytes(retention_days)

    return flask.jsonify(
        {
            "feeds": {
                "total": total_feeds,
            },
            "episodes": {
                "total": total_episodes,
                "processed": processed_episodes,
                "unprocessed": total_episodes - processed_episodes,
            },
            "transcript": {
                "total_segments": total_segments,
                "total_transcribed_hours": total_transcribed_hours,
            },
            "model_calls": {
                "total": total_model_calls,
                "by_model": model_calls_by_model,
                "by_status": model_calls_by_status,
            },
            "ad_detection": {
                "total_identifications": total_identifications,
                "ad_identifications": ad_identifications,
                "estimated_ad_minutes": estimated_ad_minutes,
                "estimated_ad_hours": estimated_ad_hours,
            },
            "processing_jobs": {
                "total": total_jobs,
                "by_status": jobs_by_status,
                "success_rate_percent": success_rate,
            },
            "storage": {
                "bytes_used": storage_bytes_used,
                "bytes_reclaimable": storage_bytes_reclaimable,
            },
        }
    )
