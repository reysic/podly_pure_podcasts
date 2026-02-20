#!/bin/bash
set -e

echo "Locking pyproject.toml..."
uv lock

echo "Lockfile generated successfully!"
echo "- uv.lock"
