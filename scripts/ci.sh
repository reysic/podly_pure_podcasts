#!/bin/bash

RUN_INTEGRATION=false
RUN_TESTS=false
for arg in "$@"; do
  case $arg in
    --int) RUN_INTEGRATION=true ;;
    --tests) RUN_TESTS=true ;;
  esac
done

# ensure uv is on PATH (installed to ~/.local/bin by the official installer)
# shellcheck disable=SC1091
[ -f "$HOME/.local/bin/env" ] && . "$HOME/.local/bin/env"

# ensure dependencies are installed and are always up to date
echo '============================================================='
echo "Running 'uv sync --extra dev'"
echo '============================================================='
uv sync --extra dev

echo '============================================================='
echo "Running 'uv run ruff format .'"
echo '============================================================='
uv run ruff format .
echo '============================================================='
echo "Running 'uv run ruff check --fix .'"
echo '============================================================='
uv run ruff check --fix .

# type check
echo '============================================================='
echo "Running 'uv run ty check'"
echo '============================================================='
uv run ty check

# run tests (only when --tests is passed)
if [ "$RUN_TESTS" = true ]; then
  echo '============================================================='
  echo "Running 'uv run pytest --disable-warnings'"
  echo '============================================================='
  uv run pytest --disable-warnings
fi

# Run integration tests only if --int flag is provided
if [ "$RUN_INTEGRATION" = true ]; then
  echo '============================================================='
  echo "Running integration workflow checks..."
  echo '============================================================='
  uv run python scripts/check_integration_workflow.py
fi
