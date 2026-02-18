Project-specific rules:
- Do not create Alembic migrations yourself; request the user to generate migrations after model changes.
- Only use ./scripts/ci.sh to run tests & lints - do not attempt to run directly
- use pipenv
- All database writes must go through the `writer` service. Do not use `db.session.commit()` directly in application code. Use `writer_client.action()` instead.

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
