# Code Review Process Troubleshooting

## Issue Summary

The `code_review` tool fails during execution with the following error:

```
Error during code review: Error: Command failed with exit code 1: 
/home/runner/work/_temp/******-action-main/dist/autofind/autofind run 
--files /tmp/file-list-****-code-review.json 
--model capi-prod-claude-sonnet-4.5 
--extra /tmp/extras-****-code-review.json 
--detector ccr[...] 
--options {} 
--save-callback-to-file /tmp/callback-****-code-review.json 
--custom-instructions /tmp/custom-instructions-****.md
```

## Root Causes

### 1. Missing Copilot API Key

**Error Message:**
```
Error getting common flags: failed to get model capi-prod-claude-sonnet-4.5: 
creating model capi-prod-claude-sonnet-4.5: 
no Copilot API key provided for prod-claude-sonnet-4.5
```

**Cause:** The autofind binary requires a Copilot API key environment variable to be set, but it's not available in the current execution context.

**Environment Variables Checked:**
- `COPILOT_AGENT_CALLBACK_URL`: ✓ Available
- `COPILOT_API_KEY` or similar: ✗ Not found
- No API key environment variables present

### 2. Incorrect Options Parameter Format

**Error Message:**
```
required flag(s) "options" not set
```

**Cause:** The `--options {}` parameter was not properly quoted as a string, causing the shell to interpret `{}` as separate tokens.

**Fix:** The options parameter must be quoted: `--options '{}'`

### 3. No Uncommitted Changes

**Error Message:**
```
No changed files found to review. Make sure you have made some changes before requesting a code review.
```

**Cause:** The `code_review` tool only works on **uncommitted changes**. If all changes have already been committed (e.g., via `report_progress`), there are no files for the tool to review.

**Workflow Issue:** In the previous session:
1. Changes were made to `.gitignore` and `frontend/package-lock.json`
2. `report_progress` was called, which committed all changes
3. `code_review` was called afterward, but found no uncommitted changes

## How Code Review Works

The `code_review` tool:
1. Checks for **uncommitted changes** in the working directory
2. Creates temporary JSON files with the changes
3. Invokes the `autofind` binary with:
   - File changes
   - Model specification (capi-prod-claude-sonnet-4.5)
   - Detector configuration
   - Custom instructions from AGENTS.md
4. Requires a Copilot API key to communicate with the model
5. Returns review comments based on the analysis

## Proper Usage

### Correct Workflow

```
1. Make code changes
2. Test changes locally
3. Call code_review (BEFORE committing)
4. Address review feedback
5. Make additional changes if needed
6. Call code_review again if significant changes made
7. Call report_progress to commit and push
```

### Incorrect Workflow (What Happened)

```
1. Make code changes
2. Call report_progress (commits changes) ← TOO EARLY
3. Call code_review ← FAILS: No uncommitted changes
```

## Recommendations

### For Users

1. **Call `code_review` before `report_progress`**: Always run code review on uncommitted changes
2. **Iterative Review**: If review suggests changes, make them and call `code_review` again before committing
3. **Verify API Key**: Ensure Copilot API keys are available in your environment

### For GitHub Copilot Team

1. **Better Error Messages**: The "exit code 1" error message doesn't clearly indicate the root cause
2. **API Key Documentation**: Document which environment variables are required for code review
3. **Workflow Guidance**: Add warnings in the tool output about the correct order of operations
4. **Options Parameter**: Fix the shell escaping issue for the `--options {}` parameter

## Testing the Fix

To verify code review works:

```bash
# 1. Make a small change
echo "# test" >> README.md

# 2. Call code_review (should work if API key is available)
# tool: code_review with appropriate parameters

# 3. Revert the test change
git checkout README.md
```

## Related Files

- `.github/AGENTS.md` - Custom instructions used by code review
- `autofind` binary location: `/home/runner/work/_temp/copilot-developer-action-main/dist/autofind/autofind`
- Autofind version: 4.4.11

## Status

**Issue Identified:** ✓ Yes  
**Root Cause:** Missing Copilot API key in environment  
**Workaround:** Use `code_review` before committing changes, when API key is available  
**Permanent Fix:** Requires GitHub Copilot infrastructure team to provision API keys
