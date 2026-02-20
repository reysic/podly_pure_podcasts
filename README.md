<h2 align="center">
<img width="50%" src="src/app/static/images/logos/logo_with_text.png" />

</h2>

<p align="center">Ad-block for podcasts. Create an ad-free RSS feed.</p>

## Overview

Podly uses Whisper and an LLM to remove ads from podcasts.

<img width="100%" src="docs/images/screenshot.png" />

## Fork Differences

This fork adds several features and improvements and has some notable removals:

### User Interface

- Dark mode theme with automatic system preference detection
- Click the version number in the header to view the changelog
- Expandable episode descriptions in the feed view
- Better mobile support
- Edit system and user prompts directly in the UI (Config > Prompts)

### Performance Improvements
- Frontend caching cuts down on redundant API calls when switching pages (30-60s cache)
- Batched database queries eliminate N+1 problems (82% fewer queries for feed list)
- Database indices speed up episode list queries (100-1000x faster on large feeds)
- Home tab loads 90% faster when using cached data, episode lists load 93% faster on large feeds

### Docker & Deployment
- Streamlined single image — no GPU/CUDA variants, no `-lite` suffix
- Semantic versioning tags: `latest`, `v1.2.3`, `1.2.3`, `1.2`, `1`, `main-latest`

### GitHub Copilot Support

- Works with GitHub Copilot models (gpt-4o, claude-sonnet-4.5, o1-mini, etc.) if you have a GitHub PAT
- Some Copilot models are free (shown with 0x cost multiplier in UI)
- Copilot SDK included as a standard dependency — no extra installation required

### Removed Features

- No local transcription or ad identification support
- Only remote transcription and LLM providers are supported

## How To Run

### Run Locally

For local development and self-hosting, see the [beginner's guide for running locally](docs/how_to_run_beginners.md).

### Run with Docker Compose (recommended)

The easiest way to get started is to pull the pre-built image and run it with Docker Compose.

Create a `docker-compose.yml`:

```yaml
services:
  podly:
    image: ghcr.io/reysic/podly-pure-podcasts:latest
    ports:
      - "5001:5001"
    volumes:
      - ./config:/app/src/instance/config
      - ./data:/app/src/instance/data
      - ./db:/app/src/instance/db
      - ./logs:/app/src/instance/logs
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL}
      - WHISPER_API_KEY=${WHISPER_API_KEY}
      - WHISPER_MODEL=${WHISPER_MODEL}
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "python3",
          "-c",
          "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5001/')",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Then run:

```bash
docker compose up -d
```

## How it works

- You request an episode
- Podly downloads the requested episode
- Whisper transcribes the episode
- LLM labels ad segments
- Podly removes the ad segments
- Podly delivers the ad-free version of the podcast to you

## Docker Image Tags

| Tag | Description | Updates |
|-----|-------------|---------|
| `latest` | Latest **release** | On each release |
| `v1.2.3` / `1.2.3` | Exact release (with and without `v` prefix) | On each release |
| `1.2` / `1` | Minor- and major-pinned aliases | On each release |
| `main-latest` | Latest **main branch** build | On every commit to main |
| `main` | Same as `main-latest` (shorter alias) | On every commit to main |
| `main-amd64` | Intermediate arch-specific manifest | Build artifact; not for direct use |
| `pr-{N}` | Pull request build | On PR pushes |

**Example:**
```bash
# Latest stable release
docker pull ghcr.io/reysic/podly-pure-podcasts:latest

# Pin to a specific version
docker pull ghcr.io/reysic/podly-pure-podcasts:v1.2.3

# Latest main branch (rolling)
docker pull ghcr.io/reysic/podly-pure-podcasts:main-latest
```

## LLM Provider Options

Podly supports multiple LLM providers for ad-segment identification:

### Standard LLM Providers (via litellm)

Configure any litellm-supported provider using:
- `LLM_API_KEY` - Your API key
- `LLM_MODEL` - Model name with provider prefix (e.g., `openai/gpt-4`, `anthropic/claude-3.5-sonnet`)
- `OPENAI_BASE_URL` - Optional custom API endpoint

### GitHub Copilot Models

Use GitHub Copilot models for ad identification:

**Setup:**
1. Provide a GitHub Personal Access Token (PAT):
   - To get token:
     -  Visit [GitHub Token Settings](https://github.com/settings/tokens?type=beta).
     - Create Fine-grained token, granting Account permissions -> Copilot Requests access.
   - To use token:
     - Via environment variable: `GITHUB_PAT=ghp_xxxxxxxxxxxx`
     - Or via the web UI: Settings → LLM Configuration → GitHub PAT

2. Select a Copilot model (without provider prefix):
   - Examples: `gpt-4o`, `claude-sonnet-4.5`, `o1-mini`
   - Model names should NOT include a `/` (e.g., use `gpt-4o` not `openai/gpt-4o`)
   - Can use 'Fetch Models' button in UI after PAT entry

**Features:**
- The Copilot SDK is included as a standard dependency — no extra installation required
- Supports all three LLM operations: ad classification, boundary refinement, and word-level refinement
- Free models available (look for 0x cost multiplier in the UI)
- Test connection via Settings → LLM Configuration → "Test LLM" button

**Note:** The application automatically detects Copilot models by checking if a GitHub PAT is configured and the model name doesn't contain a provider prefix (`/`).

## Configuration Reference

All configurable environment variables (LLM provider, Whisper, authentication, app behaviour, rate limiting, etc.) are documented in the [configuration reference](docs/configuration.md).

## Contributing

See [contributing guide](docs/contributors.md) for local setup & contribution instructions.
