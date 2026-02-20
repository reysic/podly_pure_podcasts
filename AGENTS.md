Project-specific rules:
- Only use ./scripts/ci.sh to run tests & lints - do not attempt to run directly
- use uv (not pipenv)
- All database writes must go through the `writer` service. Do not use `db.session.commit()` directly in application code. Use `writer_client.action()` instead.
- When running locally, do **not** modify the system Python configuration. Use `uv run <command>` to run all Python tools (ruff, ty, pytest, python) — uv automatically uses the project's `.venv` without requiring manual activation. `./scripts/ci.sh` handles this. Never invoke `pip install`, `pip3 install`, or modify system-level Python packages directly.
- When adding, removing, or modifying configurable `.env` options (environment variables), update `docs/configuration.md` to reflect the change.

## Code Review Workflow (GitHub Copilot Agent)

When working via GitHub Copilot's agent feature, follow this workflow order:

### Correct Workflow Order
1. Make code changes
2. Test changes locally (if applicable)
3. **Call `code_review` BEFORE committing** - Reviews only uncommitted changes
4. Address review feedback by making additional changes
5. Optionally call `code_review` again if significant changes were made
6. Call `report_progress` to commit and push changes

### Important Notes
- `code_review` only works on **uncommitted changes** in the working directory
- If you commit changes first (via `report_progress`), code review will find nothing to review
- The code review tool requires a Copilot API key to be available in the environment (provisioned by GitHub infrastructure)

### Known Limitations
- Code review may fail with "no Copilot API key provided" - this is an infrastructure issue on GitHub's side
- If code review fails due to missing API key, proceed with committing your changes and note the limitation

## Testing Conventions

### Fixtures and Dependency Injection

The project uses pytest fixtures for dependency injection and test setup. Common fixtures are defined in `src/tests/conftest.py`.

Key fixtures include:
- `app` — Flask application context for testing
- `test_config` — Configuration loaded from config.yml
- `mock_db_session` — Mock database session
- Mock classes for core components (TranscriptionManager, AdClassifier, etc.)

### SQLAlchemy Model Mocking

When testing code that uses SQLAlchemy models, prefer creating custom mock classes over using `MagicMock(spec=ModelClass)` to avoid Flask context issues:

```python
class MockPost:
    """A mock Post class that doesn't require Flask context."""
    def __init__(self, id=1, title="Test Episode", download_url="https://example.com/podcast.mp3"):
        self.id = id
        self.title = title
        self.download_url = download_url
```

### Dependency Injection

Prefer injecting dependencies via the constructor rather than patching. See `src/tests/test_podcast_processor.py` for examples of testing error handling with failing components and using Flask app context.

### Improving Coverage

When writing tests to improve coverage:
1. Focus on one module at a time
2. Create mock objects for dependencies
3. Test successful and error paths
4. Use `monkeypatch` to replace functions that access external resources
5. Use `tmp_path` fixture for file operations
