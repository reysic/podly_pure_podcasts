# How To Run: Ultimate Beginner's Guide

This guide will walk you through setting up Podly from scratch using Docker. Podly creates ad-free RSS feeds for podcasts by automatically detecting and removing advertisement segments.

## Prerequisites

### Install Docker and Docker Compose

#### On Windows:

1. Download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. During installation, make sure "Use WSL 2 instead of Hyper-V" is checked
3. Restart your computer when prompted
4. Open Docker Desktop and wait for it to start completely

#### On macOS:

1. Download and install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. Drag Docker to your Applications folder
3. Launch Docker Desktop from Applications
4. Follow the setup assistant

#### On Linux (Ubuntu/Debian):

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose-v2

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
```

#### Verify Installation:

Open a terminal/command prompt and run:

```bash
docker --version
docker compose version
```

You should see version information for both commands.

### 2. Get an OpenAI API Key

1. Go to [OpenAI's API platform](https://platform.openai.com/)
2. Sign up for an account or log in if you already have one
3. Navigate to the [API Keys section](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Give it a name (e.g., "Podly")
6. **Important**: Copy the key immediately and save it somewhere safe - you won't be able to see it again!
7. Your API key will look something like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

> **Note**: OpenAI API usage requires payment. Make sure to set up billing and usage limits in your OpenAI account to avoid unexpected charges.

## Setup Podly

### Download the Project

```bash
git clone https://github.com/reysic/podly_pure_podcasts.git
cd podly_pure_podcasts
```

## Running Podly

### Run the Application via Docker

```bash
chmod +x run_podly_docker.sh
./run_podly_docker.sh --build
./run_podly_docker.sh            # foreground
./run_podly_docker.sh -d         # detached
```

### Optional: Enable Authentication

The Docker image reads environment variables from `.env` files or your shell. To require login:

1. Export the variables before running Podly, or add them to `config/.env`:

```bash
export REQUIRE_AUTH=true
export PODLY_ADMIN_USERNAME='podly_admin'
export PODLY_ADMIN_PASSWORD='SuperSecurePass!2024'
export PODLY_SECRET_KEY='replace-with-a-strong-64-char-secret'
```

2. Start Podly as usual. On first boot with auth enabled and an empty database, the admin account is created automatically. If you are turning auth on for an existing volume, clear the `sqlite3.db` file so the bootstrap can succeed.

3. Sign in at `http://localhost:5001`, then visit the Config page to change your password, add users, and copy RSS URLs with the "Copy protected feed" button. Podly generates feed-specific access tokens and embeds them in the link so podcast players can subscribe without exposing your main password. Remember to update your environment variables whenever you rotate the admin password.

### First Run

1. Docker will download and build the necessary image (this may take 5-15 minutes)
2. Look for "Running on http://0.0.0.0:5001"
3. Open your browser to `http://localhost:5001`
4. Configure settings at `http://localhost:5001/config`
   - Alternatively, set secrets via Docker env file `.env` in the project root and restart the container. See `.env.example` for the full list of available variables.

## Advanced Options

```bash
# Just build the container without running
./run_podly_docker.sh --build

# Test build from scratch (useful for troubleshooting)
./run_podly_docker.sh --test-build
```

## Using Podly

### Adding Your First Podcast

1. In the web interface, look for an "Add Podcast" or similar button
2. Paste the RSS feed URL of your podcast
3. Podly will start processing new episodes automatically
4. Processed episodes will have advertisements removed

### Getting Your Ad-Free RSS Feed

1. After adding a podcast, Podly will generate a new RSS feed URL
2. Use this new URL in your podcast app instead of the original
3. Your podcast app will now download ad-free versions!

## Troubleshooting

### "Docker command not found"

- Make sure Docker Desktop is running
- On Windows, restart your terminal after installing Docker
- On Linux, make sure you logged out and back in after adding yourself to the docker group

### Cannot connect to the Docker daemon. Is the docker daemon running?

- If using docker desktop, open up the app, otherwise start the daemon

### "Permission denied" errors

- On macOS/Linux, make sure the script is executable: `chmod +x run_podly_docker.sh`
- On Windows, try running Command Prompt as Administrator

### OpenAI API errors

- Double-check your API key in the Config page at `/config`
- Make sure you have billing set up in your OpenAI account
- Check your usage limits haven't been exceeded

### Port 5001 already in use

- Another application is using port 5001
- **Docker users**: Either stop that application or modify the port in `compose.dev.yml` and `compose.yml`
- **Native users**: Change the port in the Config page under App settings
- To kill processes on that port run `lsof -i :5001 | grep LISTEN | awk '{print $2}' | xargs kill -9`

### Out of memory errors

- Close other applications to free up RAM
- Consider using `--cpu` flag if you have limited memory

## Stopping Podly

To stop the application:

If you have launched it in the foreground by omitting the `-d` parameter:
1. In the terminal where Podly is running, press `Ctrl+C`
2. Wait for the container to stop gracefully

If you have launched it in the background using the `-d` parameter:
1. In the terminal where Podly is running, execute `docker compose down`
2. Wait for the container to stop gracefully

In both cases this output should appear to indicate that it has stopped:

```sh
[+] Running 2/2
 ✔ Container podly-pure-podcasts        Removed
 ✔ Network podly-pure-podcasts-network  Removed
```

## Upgrading Podly

To upgrade the application while you are in the terminal where it is running:
1. [Stop it](#stopping-podly)
2. Execute `git pull`
3. [Run it again](#running-podly)

## What's Next?

Once you have Podly running:

- Explore the web interface to add more podcasts
- Configure settings in the Config page
- Consider setting up automatic background processing
- Enjoy your ad-free podcasts!
