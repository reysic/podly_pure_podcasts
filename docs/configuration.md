# Configuration Reference

Podly is configured primarily through environment variables. Set them in a `.env` file in the project root or pass them directly to Docker.

All settings can also be adjusted at runtime through the **Settings** page in the web UI. Environment variables take precedence over values stored in the database.

---

## GitHub Copilot LLM

These two variables must **both** be set to activate Copilot-based ad identification.

| Variable | Description | Default | Example |
|---|---|---|---|
| `GITHUB_PAT` | GitHub Personal Access Token with **Copilot Requests** permission (Account permissions → Copilot Requests). | *(none)* | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_MODEL` | Copilot model name **without** a provider prefix. | *(none)* | `gpt-4o`, `claude-sonnet-4.5`, `o1-mini` |

> **Note:** If either variable is missing Podly falls back to the standard OpenAI-compatible provider below.

---

## Standard LLM Provider (via litellm)

Used when GitHub Copilot is not configured.

| Variable | Description | Default | Example |
|---|---|---|---|
| `LLM_API_KEY` | API key for your LLM provider. | *(none)* | `sk-…` |
| `LLM_MODEL` | Model name with litellm provider prefix. | `groq/openai/gpt-oss-120b` | `openai/gpt-4o`, `anthropic/claude-3.5-sonnet` |
| `OPENAI_BASE_URL` | Custom API endpoint (for self-hosted or proxy providers). | *(none — uses provider default)* | `https://my-proxy.example.com/v1` |
| `OPENAI_MAX_TOKENS` | Maximum tokens in each LLM response. | `4096` | `8192` |
| `OPENAI_TIMEOUT` | Request timeout in seconds. | `300` | `600` |

---

## LLM Concurrency & Rate Limiting

| Variable | Description | Default |
|---|---|---|
| `LLM_MAX_CONCURRENT_CALLS` | Maximum number of simultaneous LLM requests. | `3` |
| `LLM_MAX_RETRY_ATTEMPTS` | How many times to retry a failed LLM call. | `5` |
| `LLM_ENABLE_TOKEN_RATE_LIMITING` | Enable token-based rate limiting. | `false` |
| `LLM_MAX_INPUT_TOKENS_PER_CALL` | Cap input tokens sent per call (unset = no limit). | *(no limit)* |
| `LLM_MAX_INPUT_TOKENS_PER_MINUTE` | Cap total input tokens per minute (unset = no limit). | *(no limit)* |

---

## Boundary Refinement

After initial ad classification, Podly can make additional LLM calls to refine the exact cut boundaries.

| Variable | Description | Default |
|---|---|---|
| `ENABLE_BOUNDARY_REFINEMENT` | Run segment-level boundary refinement after classification. | `true` |
| `ENABLE_WORD_LEVEL_BOUNDARY_REFINDER` | Run word-level boundary refinement (more precise, more LLM calls). | `false` |

---

## Whisper (Transcription)

| Variable | Description | Default | Example |
|---|---|---|---|
| `WHISPER_API_KEY` | API key for the Whisper transcription endpoint. **Required.** | *(none)* | `sk-…` |
| `WHISPER_BASE_URL` | Base URL for the Whisper API. | `https://api.openai.com/v1` | `https://my-whisper.example.com/v1` |
| `WHISPER_MODEL` | Whisper model to use. | `whisper-1` | `whisper-large-v3` |
| `WHISPER_LANGUAGE` | Language hint for transcription (ISO 639-1). | `en` | `de`, `fr`, `es` |
| `WHISPER_TIMEOUT_SEC` | Request timeout in seconds for transcription calls. | `600` | `1200` |
| `WHISPER_CHUNKSIZE_MB` | Maximum audio chunk size in MB sent per Whisper request. | `24` | `12` |

---

## Authentication

| Variable | Description | Default |
|---|---|---|
| `REQUIRE_AUTH` | Require login before accessing Podly. | `false` |
| `PODLY_ADMIN_USERNAME` | Username for the auto-created admin account. | `podly_admin` |
| `PODLY_ADMIN_PASSWORD` | Password for the admin account. **Set this in production.** | *(random — check logs on first start)* |
| `PODLY_SECRET_KEY` | Flask session secret key. **Set this to a stable secret in production.** | *(random per restart)* |

---

## App Behavior

| Variable | Description | Default |
|---|---|---|
| `BACKGROUND_UPDATE_INTERVAL_MINUTE` | How often (minutes) Podly polls feeds for new episodes. | `30` |
| `POST_CLEANUP_RETENTION_DAYS` | How many days to keep processed audio files. `0` disables cleanup. The stats page shows current storage in-use and how many bytes are reclaimable based on this setting. | `5` |
| `AUTOPROCESS_ON_DOWNLOAD` | Automatically start processing when an episode is first downloaded. | `false` |
| `DEVELOPER_MODE` | Enable extra debug logging and development tools. | `false` |

---

## Database Backup

These settings can also be configured via the UI under **Settings → App → Database Backup**.

| Variable | Description | Default |
|---|---|---|
| `APP_DB_BACKUP_ENABLED` | Enable scheduled automatic database backups. | `false` |
| `APP_DB_BACKUP_INTERVAL_HOURS` | How often (in hours) to create a scheduled backup. Only active when `APP_DB_BACKUP_ENABLED` is `true`. | `24` |
| `APP_DB_BACKUP_RETENTION_COUNT` | Number of most-recent backup files to keep. Older backups are automatically deleted. | `7` |

Backups are stored as timestamped SQLite files in `{instance_dir}/backups/` (e.g. `sqlite3_20250115_120000.db`). An on-demand backup can also be triggered at any time via the **Backup Now** button in the UI or by `POST /api/backup/run`.

---

## Quick-Start `.env` Example

```env
# --- LLM (choose one block) ---

# Option A: GitHub Copilot
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_MODEL=gpt-4o

# Option B: Standard provider
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=openai/gpt-4o-mini

# --- Transcription ---
WHISPER_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHISPER_MODEL=whisper-1

# --- Auth (production) ---
REQUIRE_AUTH=true
PODLY_ADMIN_USERNAME=admin
PODLY_ADMIN_PASSWORD=change-me
PODLY_SECRET_KEY=some-long-random-string
```

See [`.env.example`](../.env.example) in the project root for a minimal template.
