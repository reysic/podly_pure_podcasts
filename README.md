<h2 align="center">
<img width="50%" src="src/app/static/images/logos/logo_with_text.png" />

</h2>

<p align="center">
<p align="center">Ad-block for podcasts. Create an ad-free RSS feed.</p>
<p align="center">
  <a href="https://discord.gg/FRB98GtF6N" target="_blank">
      <img src="https://img.shields.io/badge/discord-join-blue.svg?logo=discord&logoColor=white" alt="Discord">
  </a>
</p>

## Overview

Podly uses Whisper and Chat GPT to remove ads from podcasts.

<img width="100%" src="docs/images/screenshot.png" />

## Docker Image Tags


| Tag | Description | When to Use | Updates |
|-----|-------------|-------------|---------|
| `latest-lite` | Latest **release** (lite version) | Remote transcription | On each release |
| `main-lite` | Latest **main branch** (lite version) | Remote transcription, latest change testing | On each commit to main |
| `latest` | Latest **release** (full version) | Local Whisper transcription | On each release |
| `main` | Latest **main branch** (full version) | Local Whisper transcription, latest change testing Production on amd64 systems | On each commit to main |

**Lite Suffix**
- **Lite** (`-lite`): Smaller image, no local Whisper, faster builds
- **Full** (no suffix): Local Whisper transcription, **not currently built**

**Example:**
```bash
docker pull ghcr.io/reysic/podly-pure-podcasts:latest-lite
```

## How To Run

You have a few options to get started:

- [![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/podly?referralCode=NMdeg5&utm_medium=integration&utm_source=template&utm_campaign=generic)
   - quick and easy setup in the cloud, follow our [Railway deployment guide](docs/how_to_run_railway.md). 
   - Use this if you want to share your Podly server with others.
- **Run Locally**: 
   - For local development and customization, 
   - see our [beginner's guide for running locally](docs/how_to_run_beginners.md). 
   - Use this for the most cost-optimal & private setup.
- **[Join The Preview Server](https://podly.up.railway.app/)**: 
   - pay what you want (limited sign ups available)


## How it works:

- You request an episode
- Podly downloads the requested episode
- Whisper transcribes the episode
- LLM labels ad segments
- Podly removes the ad segments
- Podly delivers the ad-free version of the podcast to you

### Cost Breakdown
*Monthly cost breakdown for 5 podcasts*

| Cost    | Hosting  | Transcription | LLM    |
|---------|----------|---------------|--------|
| **free**| local    | local         | local  |
| **$2**  | local    | local         | remote |
| **$5**  | local    | remote        | remote |
| **$10** | public (railway)  | remote        | remote |
| **Pay What You Want** | [preview server](https://podly.up.railway.app/)    | n/a         | n/a  |
| **$5.99/mo** | https://zeroads.ai/ | production fork of podly | |


## Contributing

See [contributing guide](docs/contributors.md) for local setup & contribution instructions.

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
1. Provide a GitHub Personal Access Token:
   - Via environment variable: `GITHUB_PAT=ghp_xxxxxxxxxxxx`
   - Or via the web UI: Settings → LLM Configuration → GitHub PAT
2. Select a Copilot model (without provider prefix):
   - Examples: `gpt-4o`, `claude-sonnet-4.5`, `o1-mini`
   - Model names should NOT include a `/` (e.g., use `gpt-4o` not `openai/gpt-4o`)

**Features:**
- The Copilot SDK is included in Docker images by default
- Supports all three LLM operations: ad classification, boundary refinement, and word-level refinement
- Free models available (look for 0x cost multiplier in the UI)
- Test connection via Settings → LLM Configuration → "Test LLM" button

**Note:** The application automatically detects Copilot models by checking if a GitHub PAT is configured and the model name doesn't contain a provider prefix (`/`).
