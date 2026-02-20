import logging
from typing import Any

from app.extensions import db
from app.jobs_manager_run_service import get_or_create_singleton_run

logger = logging.getLogger("writer")


def ensure_active_run_action(params: dict[str, Any]) -> dict[str, Any]:
    trigger = params.get("trigger", "system")
    context = params.get("context")

    logger.info(
        "[WRITER] ensure_active_run_action: trigger=%s context_keys=%s",
        trigger,
        list(context.keys()) if isinstance(context, dict) else None,
    )

    run = get_or_create_singleton_run(db.session, trigger, context)
    db.session.flush()  # Ensure ID is available

    logger.info(
        "[WRITER] ensure_active_run_action: obtained run_id=%s status=%s",
        getattr(run, "id", None),
        getattr(run, "status", None),
    )

    return {"run_id": run.id}


def update_combined_config_action(params: dict[str, Any]) -> dict[str, Any]:
    payload = params.get("payload")
    if not isinstance(payload, dict):
        raise ValueError("payload must be a dictionary")

    # Import locally to avoid cyclic dependencies
    from app.config_store import (  # pylint: disable=import-outside-toplevel
        hydrate_runtime_config_inplace,
        update_combined,
    )

    updated = update_combined(payload)

    # Ensure the running process sees the new config immediately
    hydrate_runtime_config_inplace()

    # Reset processor instance to pick up new config (e.g. litellm globals)
    # Import locally to avoid cyclic dependencies
    import importlib

    processor = importlib.import_module("app.processor")
    processor.ProcessorSingleton.reset_instance()

    if not isinstance(updated, dict):
        return {"updated": True}
    return updated
