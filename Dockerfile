# Multi-stage build for combined frontend and backend
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend assets with explicit error handling
RUN set -e && \
    npm run build && \
    test -d dist && \
    echo "Frontend build successful - dist directory created"

# Backend stage
FROM python:3.11-slim AS backend

# Build arguments
ARG VERSION=unknown

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PODLY_VERSION=${VERSION}

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ffmpeg \
    sqlite3 \
    libsqlite3-dev \
    build-essential \
    gosu && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy all Pipfiles/lock files
COPY Pipfile.lite Pipfile.lite.lock ./

# Remove problematic distutils-installed packages that may conflict
RUN apt-get remove -y python3-blinker 2>/dev/null || true

# Install pipenv and dependencies
RUN pip install --no-cache-dir pipenv

# Set pip timeout and retries for better reliability
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_RETRIES=3
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1

# Set pipenv configuration for better CI reliability
ENV PIPENV_VENV_IN_PROJECT=1
ENV PIPENV_TIMEOUT=1200

RUN PIPENV_PIPFILE=Pipfile.lite pipenv install --deploy --system

# Ensure GitHub Copilot helper binary (if installed by the SDK) is executable.
# Some copilot SDK versions install a bundled helper at site-packages/copilot/bin/copilot
# which may lack execute permissions when installed inside the image. Make it executable
# if present to allow the Copilot client to spawn it at runtime.
RUN chmod +x /usr/local/lib/python3.11/site-packages/copilot/bin/copilot || true

# Copy application code
COPY src/ ./src/
RUN rm -rf ./src/instance
COPY scripts/ ./scripts/
RUN chmod +x scripts/start_services.sh

# Copy built frontend assets to Flask static folder
COPY --from=frontend-build /app/dist ./src/app/static

# Create non-root user for running the application
RUN groupadd -r appuser && \
    useradd --no-log-init -r -g appuser -d /home/appuser appuser && \
    mkdir -p /home/appuser && \
    chown -R appuser:appuser /home/appuser

# Create necessary directories and set permissions
RUN mkdir -p /app/processing /app/src/instance /app/src/instance/data /app/src/instance/data/in /app/src/instance/data/srv /app/src/instance/config /app/src/instance/db && \
    chown -R appuser:appuser /app

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod 755 /docker-entrypoint.sh

EXPOSE 5001

# Run the application through the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["./scripts/start_services.sh"]
