import logging
import os
from datetime import datetime
from typing import Any

import flask
import litellm
from flask import Blueprint, jsonify, request
from openai import OpenAI

from app.auth.guards import require_admin
from app.config_store import read_combined, to_pydantic_config
from app.processor import ProcessorSingleton
from app.runtime_config import config as runtime_config
from app.writer.client import writer_client

logger = logging.getLogger("global_logger")


config_bp = Blueprint("config", __name__)


def _mask_secret(value: Any | None) -> str | None:
    if value is None:
        return None

    try:
        secret = str(value).strip()
    except Exception:  # pragma: no cover - defensive
        return None

    if not secret:
        return None
    if len(secret) <= 8:
        return secret
    return f"{secret[:4]}...{secret[-4:]}"


def _sanitize_config_for_client(cfg: dict[str, Any]) -> dict[str, Any]:
    try:
        data: dict[str, Any] = dict(cfg)
        llm: dict[str, Any] = dict(data.get("llm", {}))
        whisper: dict[str, Any] = dict(data.get("whisper", {}))

        llm_api_key = llm.pop("llm_api_key", None)
        if llm_api_key:
            llm["llm_api_key_preview"] = _mask_secret(llm_api_key)

        whisper_api_key = whisper.pop("api_key", None)
        if whisper_api_key:
            whisper["api_key_preview"] = _mask_secret(whisper_api_key)

        data["llm"] = llm
        data["whisper"] = whisper
        return data
    except Exception:
        return {}


@config_bp.route("/api/config", methods=["GET"])
def api_get_config() -> flask.Response:
    _, error_response = require_admin()
    if error_response:
        return error_response

    try:
        data = read_combined()

        _hydrate_runtime_config(data)

        env_metadata = _build_env_override_metadata(data)

        return flask.jsonify(
            {
                "config": _sanitize_config_for_client(data),
                "env_overrides": env_metadata,
            }
        )
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Failed to read configuration: {e}")
        return flask.make_response(
            jsonify({"error": "Failed to read configuration"}), 500
        )


def _hydrate_runtime_config(data: dict[str, Any]) -> None:
    _hydrate_llm_config(data)
    _hydrate_whisper_config(data)
    _hydrate_app_config(data)


def _hydrate_llm_config(data: dict[str, Any]) -> None:
    data.setdefault("llm", {})
    llm = data["llm"]
    llm["llm_api_key"] = getattr(runtime_config, "llm_api_key", llm.get("llm_api_key"))
    llm["llm_model"] = getattr(runtime_config, "llm_model", llm.get("llm_model"))
    llm["openai_base_url"] = getattr(
        runtime_config, "openai_base_url", llm.get("openai_base_url")
    )
    llm["openai_timeout"] = getattr(
        runtime_config, "openai_timeout", llm.get("openai_timeout")
    )
    llm["openai_max_tokens"] = getattr(
        runtime_config, "openai_max_tokens", llm.get("openai_max_tokens")
    )
    llm["llm_max_concurrent_calls"] = getattr(
        runtime_config, "llm_max_concurrent_calls", llm.get("llm_max_concurrent_calls")
    )
    llm["llm_max_retry_attempts"] = getattr(
        runtime_config, "llm_max_retry_attempts", llm.get("llm_max_retry_attempts")
    )
    llm["llm_max_input_tokens_per_call"] = getattr(
        runtime_config,
        "llm_max_input_tokens_per_call",
        llm.get("llm_max_input_tokens_per_call"),
    )
    llm["llm_enable_token_rate_limiting"] = getattr(
        runtime_config,
        "llm_enable_token_rate_limiting",
        llm.get("llm_enable_token_rate_limiting"),
    )
    llm["llm_max_input_tokens_per_minute"] = getattr(
        runtime_config,
        "llm_max_input_tokens_per_minute",
        llm.get("llm_max_input_tokens_per_minute"),
    )


def _hydrate_whisper_config(data: dict[str, Any]) -> None:
    data.setdefault("whisper", {})
    whisper = data["whisper"]
    rt_whisper = getattr(runtime_config, "whisper", None)

    if isinstance(rt_whisper, dict):
        _overlay_whisper_dict(whisper, rt_whisper)
        return

    if rt_whisper is not None and hasattr(rt_whisper, "whisper_type"):
        _overlay_whisper_object(whisper, rt_whisper)


def _overlay_whisper_dict(target: dict[str, Any], source: dict[str, Any]) -> None:
    wtype = source.get("whisper_type")
    target["whisper_type"] = wtype or target.get("whisper_type")
    if wtype == "remote":
        _overlay_remote_whisper_fields(target, source)


def _overlay_whisper_object(target: dict[str, Any], source: Any) -> None:
    wtype = source.whisper_type
    target["whisper_type"] = wtype
    if wtype == "remote":
        _overlay_remote_whisper_fields(target, source)


def _overlay_remote_whisper_fields(target: dict[str, Any], source: Any) -> None:
    target["model"] = _get_attr_or_value(source, "model", target.get("model"))
    target["api_key"] = _get_attr_or_value(source, "api_key", target.get("api_key"))
    target["base_url"] = _get_attr_or_value(source, "base_url", target.get("base_url"))
    target["language"] = _get_attr_or_value(source, "language", target.get("language"))
    target["timeout_sec"] = _get_attr_or_value(
        source, "timeout_sec", target.get("timeout_sec")
    )
    target["chunksize_mb"] = _get_attr_or_value(
        source, "chunksize_mb", target.get("chunksize_mb")
    )


def _get_attr_or_value(source: Any, key: str, default: Any) -> Any:
    if isinstance(source, dict):
        return source.get(key, default)
    return getattr(source, key, default)


def _hydrate_app_config(data: dict[str, Any]) -> None:
    data.setdefault("app", {})
    app_cfg = data["app"]
    app_cfg["post_cleanup_retention_days"] = getattr(
        runtime_config,
        "post_cleanup_retention_days",
        app_cfg.get("post_cleanup_retention_days"),
    )
    app_cfg["enable_public_landing_page"] = getattr(
        runtime_config,
        "enable_public_landing_page",
        app_cfg.get("enable_public_landing_page"),
    )
    app_cfg["user_limit_total"] = getattr(
        runtime_config, "user_limit_total", app_cfg.get("user_limit_total")
    )
    app_cfg["autoprocess_on_download"] = getattr(
        runtime_config,
        "autoprocess_on_download",
        app_cfg.get("autoprocess_on_download"),
    )
    app_cfg["db_backup_enabled"] = getattr(
        runtime_config,
        "db_backup_enabled",
        app_cfg.get("db_backup_enabled"),
    )
    app_cfg["db_backup_interval_hours"] = getattr(
        runtime_config,
        "db_backup_interval_hours",
        app_cfg.get("db_backup_interval_hours"),
    )
    app_cfg["db_backup_retention_count"] = getattr(
        runtime_config,
        "db_backup_retention_count",
        app_cfg.get("db_backup_retention_count"),
    )


def _first_env(env_names: list[str]) -> tuple[str | None, str | None]:
    """Return first found environment variable name and value."""
    for name in env_names:
        value = os.environ.get(name)
        if value is not None and value != "":
            return name, value
    return None, None


def _register_override(
    overrides: dict[str, Any],
    path: str,
    env_var: str | None,
    value: Any | None,
    *,
    secret: bool = False,
) -> None:
    """Register an environment override in the metadata dict."""
    if not env_var or value is None:
        return
    entry: dict[str, Any] = {"env_var": env_var}
    if secret:
        entry["is_secret"] = True
        entry["value_preview"] = _mask_secret(value)
    else:
        entry["value"] = value
    overrides[path] = entry


def _register_llm_overrides(overrides: dict[str, Any]) -> None:
    """Register LLM-related environment overrides."""
    env_var, env_value = _first_env(["LLM_API_KEY", "OPENAI_API_KEY"])
    _register_override(overrides, "llm.llm_api_key", env_var, env_value, secret=True)

    base_url = os.environ.get("OPENAI_BASE_URL")
    if base_url:
        _register_override(
            overrides, "llm.openai_base_url", "OPENAI_BASE_URL", base_url
        )

    llm_model = os.environ.get("LLM_MODEL")
    if llm_model:
        _register_override(overrides, "llm.llm_model", "LLM_MODEL", llm_model)


def _register_remote_whisper_overrides(overrides: dict[str, Any]) -> None:
    """Register remote whisper environment overrides."""
    remote_key = _first_env(["WHISPER_REMOTE_API_KEY", "OPENAI_API_KEY"])
    _register_override(
        overrides, "whisper.api_key", remote_key[0], remote_key[1], secret=True
    )

    remote_base = _first_env(["WHISPER_REMOTE_BASE_URL", "OPENAI_BASE_URL"])
    _register_override(overrides, "whisper.base_url", remote_base[0], remote_base[1])

    remote_model = os.environ.get("WHISPER_REMOTE_MODEL")
    if remote_model:
        _register_override(
            overrides, "whisper.model", "WHISPER_REMOTE_MODEL", remote_model
        )

    remote_timeout = os.environ.get("WHISPER_REMOTE_TIMEOUT_SEC")
    if remote_timeout:
        _register_override(
            overrides,
            "whisper.timeout_sec",
            "WHISPER_REMOTE_TIMEOUT_SEC",
            remote_timeout,
        )

    remote_chunksize = os.environ.get("WHISPER_REMOTE_CHUNKSIZE_MB")
    if remote_chunksize:
        _register_override(
            overrides,
            "whisper.chunksize_mb",
            "WHISPER_REMOTE_CHUNKSIZE_MB",
            remote_chunksize,
        )


def _determine_whisper_type_for_metadata(data: dict[str, Any]) -> str | None:
    """Determine whisper type for environment metadata (with auto-detection)."""
    whisper_cfg = data.get("whisper", {}) or {}
    wtype = whisper_cfg.get("whisper_type")

    env_whisper_type = os.environ.get("WHISPER_TYPE")

    # Auto-detect from WHISPER_REMOTE_API_KEY if WHISPER_TYPE not explicitly set
    if not env_whisper_type:
        if os.environ.get("WHISPER_REMOTE_API_KEY"):
            env_whisper_type = "remote"

    if env_whisper_type:
        wtype = env_whisper_type.strip().lower()

    return wtype if isinstance(wtype, str) else None


def _build_env_override_metadata(data: dict[str, Any]) -> dict[str, Any]:
    overrides: dict[str, Any] = {}

    _register_llm_overrides(overrides)

    env_whisper_type = os.environ.get("WHISPER_TYPE")
    if env_whisper_type:
        _register_override(
            overrides, "whisper.whisper_type", "WHISPER_TYPE", env_whisper_type
        )

    wtype = _determine_whisper_type_for_metadata(data)

    if wtype == "remote":
        _register_remote_whisper_overrides(overrides)

    return overrides


@config_bp.route("/api/config", methods=["PUT"])
def api_put_config() -> flask.Response:
    _, error_response = require_admin()
    if error_response:
        return error_response

    payload = request.get_json(silent=True) or {}

    llm_payload = payload.get("llm")
    if isinstance(llm_payload, dict):
        llm_payload.pop("llm_api_key_preview", None)

    whisper_payload = payload.get("whisper")
    if isinstance(whisper_payload, dict):
        whisper_payload.pop("api_key_preview", None)

    try:
        result = writer_client.action(
            "update_combined_config",
            {"payload": payload},
            wait=True,
        )
        if not result or not result.success:
            raise RuntimeError(getattr(result, "error", "Writer update failed"))
        data = result.data or {}

        try:
            db_cfg = to_pydantic_config()
        except Exception as hydrate_err:  # pylint: disable=broad-except
            logger.error(f"Post-update config hydration failed: {hydrate_err}")
            return flask.make_response(
                jsonify(
                    {"error": "Invalid configuration", "details": str(hydrate_err)}
                ),
                400,
            )

        for field_name in runtime_config.__class__.model_fields.keys():
            setattr(runtime_config, field_name, getattr(db_cfg, field_name))
        ProcessorSingleton.reset_instance()

        return flask.jsonify(_sanitize_config_for_client(data))
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Failed to update configuration: {e}")
        return flask.make_response(
            jsonify({"error": "Failed to update configuration", "details": str(e)}), 400
        )


@config_bp.route("/api/config/test-llm", methods=["POST"])
def api_test_llm() -> flask.Response:
    _, error_response = require_admin()
    if error_response:
        return error_response

    payload: dict[str, Any] = request.get_json(silent=True) or {}
    llm: dict[str, Any] = dict(payload.get("llm", {}))

    model_val = llm.get("llm_model")
    model: str = (
        model_val
        if isinstance(model_val, str)
        else getattr(runtime_config, "llm_model", "gpt-4o")
    )

    # Copilot is active when both a GitHub PAT and a dedicated github_model are configured.
    github_pat: str | None = (
        llm.get("llm_github_pat")
        or llm.get("github_pat")
        or getattr(runtime_config, "llm_github_pat", None)
    )
    github_model: str | None = llm.get("llm_github_model") or getattr(
        runtime_config, "llm_github_model", None
    )
    is_copilot_model = bool(github_pat) and bool(github_model)

    if is_copilot_model:
        # Test GitHub Copilot connection
        import asyncio

        async def _test_copilot() -> tuple[bool, str | None]:
            """Test Copilot connection by creating client and listing models"""
            try:
                from copilot import CopilotClient

                client = CopilotClient(options={"github_token": github_pat})  # type: ignore[arg-type]
                await client.start()
                models = await client.list_models()

                # Verify the configured github_model is available
                model_ids = [getattr(m, "id", str(m)) for m in models]
                if github_model not in model_ids:
                    return (
                        False,
                        f"Configured Copilot model '{github_model}' not found in available Copilot models",
                    )

                return True, None
            except Exception as e:
                return False, str(e)

        try:
            success, error = asyncio.run(_test_copilot())
            if not success:
                logger.error(f"Copilot connection test failed: {error}")
                return flask.make_response(jsonify({"ok": False, "error": error}), 400)
        except Exception as e:
            logger.error(f"Copilot connection test failed: {e}")
            return flask.make_response(jsonify({"ok": False, "error": str(e)}), 400)
    else:
        # Test standard LLM connection via litellm
        api_key: str | None = llm.get("llm_api_key") or getattr(
            runtime_config, "llm_api_key", None
        )
        base_url: str | None = llm.get("openai_base_url") or getattr(
            runtime_config, "openai_base_url", None
        )
        timeout_val = llm.get("openai_timeout")
        timeout: int = (
            int(timeout_val)
            if timeout_val is not None
            else int(getattr(runtime_config, "openai_timeout", 30))
        )

        if not api_key:
            return flask.make_response(
                jsonify({"ok": False, "error": "Missing llm_api_key"}), 400
            )

        try:
            # Configure litellm for this probe
            litellm.api_key = api_key
            if base_url:
                litellm.api_base = base_url

            # Minimal completion to validate connectivity and credentials
            messages = [
                {"role": "system", "content": "You are a healthcheck probe."},
                {"role": "user", "content": "ping"},
            ]

            _ = litellm.completion(model=model, messages=messages, timeout=timeout)
        except Exception as e:  # pylint: disable=broad-except
            logger.error(f"LLM connection test failed: {e}")
            return flask.make_response(jsonify({"ok": False, "error": str(e)}), 400)

    # Success
    return flask.make_response(jsonify({"ok": True}), 200)


# Runtime pip install endpoint removed: Copilot SDK is included in the image via Pipfile updates.


@config_bp.route("/api/config/copilot-models", methods=["GET", "POST"])
def api_copilot_models() -> flask.Response:
    _, error_response = require_admin()
    if error_response:
        return error_response

    # PAT can be provided in body (POST) or read from runtime config
    payload = request.get_json(silent=True) or {}
    pat = (
        payload.get("github_pat")
        or getattr(runtime_config, "llm_github_pat", None)
        or getattr(runtime_config, "llm_api_key", None)
    )

    if not pat:
        return _make_error_response(
            "Missing GitHub PAT (github_pat) or configured llm_github_pat", 400
        )

    # Create and use Copilot client entirely within async context
    import asyncio

    async def _create_and_list_models() -> list | None:  # type: ignore[type-arg]
        """Create Copilot client, start it, and list models - all in one async context"""
        try:
            from copilot import CopilotClient

            # Create client with the PAT
            client = CopilotClient(options={"github_token": pat})

            # Start the client (initializes JSON-RPC connection)
            await client.start()

            # List models
            models = await client.list_models()
            return models
        except Exception:
            import sys
            import traceback

            print("[DEBUG] Exception in _create_and_list_models:")
            traceback.print_exc()
            sys.stdout.flush()
            return None

    try:
        # Run the entire client lifecycle in one async context
        models = asyncio.run(_create_and_list_models())
    except Exception as exc:
        logger.exception("Error creating Copilot client or listing models: %s", exc)
        models = None

    if models is None:
        return _make_error_response(
            "Failed to enumerate Copilot models from SDK. Ensure the SDK supports model listing and your token has access.",
            500,
        )

    # Normalize model entries
    normalized = []
    for m in models:
        try:
            if isinstance(m, dict):
                mid = m.get("id") or m.get("name") or m.get("model_id")
                display = m.get("name") or mid
                cost = m.get("cost_multiplier") if "cost_multiplier" in m else None
            else:
                # Try attributes - check for billing.multiplier pattern
                mid = getattr(m, "id", None) or getattr(m, "name", None) or str(m)
                display = getattr(m, "name", None) or mid

                # Try to extract cost multiplier from various possible locations
                cost = None
                if hasattr(m, "billing") and hasattr(m.billing, "multiplier"):
                    cost = m.billing.multiplier
                elif hasattr(m, "cost_multiplier"):
                    cost = m.cost_multiplier
                elif hasattr(m, "multiplier"):
                    cost = m.multiplier

            # Default to 1.0 if still None
            if cost is None:
                cost = 1.0

            normalized.append({"id": mid, "name": display, "cost_multiplier": cost})
        except Exception:
            continue

    return flask.jsonify({"ok": True, "models": normalized})


def _make_error_response(error_msg: str, status_code: int = 400) -> flask.Response:
    return flask.make_response(jsonify({"ok": False, "error": error_msg}), status_code)


def _make_success_response(message: str, **extra_data: Any) -> flask.Response:
    response_data = {"ok": True, "message": message}
    response_data.update(extra_data)
    return flask.jsonify(response_data)


def _get_whisper_config_value(
    whisper_cfg: dict[str, Any], key: str, default: Any | None = None
) -> Any | None:
    value = whisper_cfg.get(key)
    if value is not None:
        return value
    try:
        runtime_whisper = getattr(runtime_config, "whisper", None)
        if runtime_whisper is not None:
            return getattr(runtime_whisper, key, default)
    except Exception:  # pragma: no cover - defensive
        pass
    return default


def _get_env_whisper_api_key(whisper_type: str) -> str | None:
    if whisper_type == "remote":
        return os.environ.get("WHISPER_REMOTE_API_KEY") or os.environ.get(
            "OPENAI_API_KEY"
        )
    return None


def _determine_whisper_type(whisper_cfg: dict[str, Any]) -> str | None:
    wtype_any = whisper_cfg.get("whisper_type")
    if isinstance(wtype_any, str):
        return wtype_any
    try:
        runtime_whisper = getattr(runtime_config, "whisper", None)
        if runtime_whisper is not None and hasattr(runtime_whisper, "whisper_type"):
            rt_type = runtime_whisper.whisper_type
            return rt_type if isinstance(rt_type, str) else None
    except Exception:  # pragma: no cover - defensive
        pass
    return None


def _test_remote_whisper(whisper_cfg: dict[str, Any]) -> flask.Response:
    """Test remote whisper configuration."""
    api_key_any = _get_whisper_config_value(whisper_cfg, "api_key")
    base_url_any = _get_whisper_config_value(
        whisper_cfg, "base_url", "https://api.openai.com/v1"
    )
    timeout_any = _get_whisper_config_value(whisper_cfg, "timeout_sec", 30)

    api_key: str | None = api_key_any if isinstance(api_key_any, str) else None
    base_url: str | None = base_url_any if isinstance(base_url_any, str) else None
    timeout: int = int(timeout_any) if timeout_any is not None else 30

    if not api_key:
        api_key = _get_env_whisper_api_key("remote")

    if not api_key:
        return _make_error_response("Missing whisper.api_key")

    _ = OpenAI(base_url=base_url, api_key=api_key, timeout=timeout).models.list()
    return _make_success_response("Remote whisper connection OK", base_url=base_url)


@config_bp.route("/api/config/test-whisper", methods=["POST"])
def api_test_whisper() -> flask.Response:
    """Test whisper configuration based on whisper_type."""
    # pylint: disable=too-many-return-statements
    _, error_response = require_admin()
    if error_response:
        return error_response

    payload: dict[str, Any] = request.get_json(silent=True) or {}
    whisper_cfg: dict[str, Any] = dict(payload.get("whisper", {}))

    wtype = _determine_whisper_type(whisper_cfg)
    if not wtype:
        return _make_error_response("Missing whisper_type")

    try:
        if wtype == "remote":
            return _test_remote_whisper(whisper_cfg)
        return _make_error_response(f"Unknown whisper_type '{wtype}'")
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Whisper connection test failed: {e}")
        return _make_error_response(str(e))


@config_bp.route("/api/config/api_configured_check", methods=["GET"])
def api_configured_check() -> flask.Response:
    """Return whether the API configuration is sufficient to process.

    For our purposes, this means an LLM API key is present either in the
    persisted config or the runtime overlay.
    """
    _, error_response = require_admin()
    if error_response:
        return error_response

    try:
        data = read_combined()
        _hydrate_runtime_config(data)

        llm = data.get("llm", {}) if isinstance(data, dict) else {}
        api_key = llm.get("llm_api_key")
        configured = bool(api_key)
        return flask.jsonify({"configured": configured})
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Failed to check API configuration: {e}")
        # Be conservative: report not configured on error
        return flask.jsonify({"configured": False})


@config_bp.route("/api/config/prompts", methods=["GET"])
def api_get_prompts() -> flask.Response:
    """Return the current system prompt and user prompt template contents."""
    _, error_response = require_admin()
    if error_response:
        return error_response

    try:
        # Read system prompt
        system_prompt_path = "src/system_prompt.txt"
        with open(system_prompt_path, encoding="utf-8") as f:
            system_prompt = f.read()

        # Read user prompt template
        user_prompt_path = "src/user_prompt.jinja"
        with open(user_prompt_path, encoding="utf-8") as f:
            user_prompt = f.read()

        return flask.jsonify(
            {
                "system_prompt": system_prompt,
                "user_prompt_template": user_prompt,
            }
        )
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Failed to read prompts: {e}")
        return flask.make_response(
            jsonify({"error": f"Failed to read prompts: {e}"}), 500
        )


@config_bp.route("/api/config/prompts", methods=["PUT"])
def api_update_prompts() -> flask.Response:
    """Update the system prompt and/or user prompt template files."""
    _, error_response = require_admin()
    if error_response:
        return error_response

    try:
        data = request.get_json()
        if not data:
            return flask.make_response(jsonify({"error": "No data provided"}), 400)

        system_prompt = data.get("system_prompt")
        user_prompt_template = data.get("user_prompt_template")

        if system_prompt is None and user_prompt_template is None:
            return flask.make_response(
                jsonify({"error": "No prompts provided to update"}), 400
            )

        # Update system prompt if provided
        if system_prompt is not None:
            system_prompt_path = "src/system_prompt.txt"
            with open(system_prompt_path, "w", encoding="utf-8") as f:
                f.write(system_prompt)
            logger.info("Updated system prompt")

        # Update user prompt template if provided
        if user_prompt_template is not None:
            user_prompt_path = "src/user_prompt.jinja"
            with open(user_prompt_path, "w", encoding="utf-8") as f:
                f.write(user_prompt_template)
            logger.info("Updated user prompt template")

        return flask.jsonify(
            {"success": True, "message": "Prompts updated successfully"}
        )
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Failed to update prompts: {e}")
        return flask.make_response(
            jsonify({"error": f"Failed to update prompts: {e}"}), 500
        )


@config_bp.route("/api/backup/status", methods=["GET"])
def api_backup_status() -> flask.Response:
    """Return metadata about existing DB backups and current backup settings."""
    _, err = require_admin()
    if err is not None:
        return err  # type: ignore[return-value]

    from app.db_backup import (
        get_backup_status,  # pylint: disable=import-outside-toplevel
    )
    from app.models import AppSettings  # pylint: disable=import-outside-toplevel

    status = get_backup_status()
    app_s = AppSettings.query.get(1)
    status["last_success_at"] = (
        app_s.db_backup_last_success_at.isoformat()
        if app_s and app_s.db_backup_last_success_at
        else None
    )
    status["enabled"] = bool(getattr(runtime_config, "db_backup_enabled", False))
    status["interval_hours"] = int(
        getattr(runtime_config, "db_backup_interval_hours", 24) or 24
    )
    status["retention_count"] = int(
        getattr(runtime_config, "db_backup_retention_count", 7) or 7
    )
    return flask.jsonify(status)


@config_bp.route("/api/backup/run", methods=["POST"])
def api_backup_run() -> flask.Response:
    """Trigger an on-demand DB backup immediately."""
    _, err = require_admin()
    if err is not None:
        return err  # type: ignore[return-value]

    from app.db_backup import perform_backup  # pylint: disable=import-outside-toplevel
    from shared import defaults as DEFAULTS  # pylint: disable=import-outside-toplevel

    retention = int(
        getattr(
            runtime_config,
            "db_backup_retention_count",
            DEFAULTS.APP_DB_BACKUP_RETENTION_COUNT,
        )
        or DEFAULTS.APP_DB_BACKUP_RETENTION_COUNT
    )
    result = perform_backup(retention_count=retention)

    if result.get("ok"):
        writer_client.action(
            "record_db_backup",
            {"success_at": datetime.utcnow().isoformat()},
            wait=True,
        )
        status_code = 200
    else:
        status_code = 500

    return flask.make_response(flask.jsonify(result), status_code)
