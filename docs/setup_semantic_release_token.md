# Setting Up SEMANTIC_RELEASE_TOKEN

## Why This Is Needed

When `semantic-release` uses the default `GITHUB_TOKEN` to push release commits, GitHub prevents those commits from triggering other workflows (to avoid infinite loops). This means the Docker workflow never runs when a release is created.

To fix this, we need to use a Personal Access Token (PAT) instead.

## Steps to Create and Configure PAT

### 1. Create a Personal Access Token (Classic)

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Configure the token:
   - **Note**: `semantic-release-token` (or any descriptive name)
   - **Expiration**: Choose your preferred expiration (90 days, 1 year, or no expiration)
   - **Scopes**: Select the following:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)

4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately (you won't be able to see it again!)

### 2. Add Token as Repository Secret

1. Go to your repository: https://github.com/reysic/podly_pure_podcasts
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Configure the secret:
   - **Name**: `SEMANTIC_RELEASE_TOKEN`
   - **Secret**: Paste the PAT you copied in step 1
5. Click **"Add secret"**

### 3. Verify It Works

After adding the secret:

1. Make a commit with a conventional commit message (e.g., `feat: some feature`)
2. Push to main branch
3. Check that:
   - The Release workflow runs and creates a new version
   - The Docker workflow **also runs** for the release commit
   - New Docker tags are created (e.g., `latest-lite`, `2.x.x-lite-amd64`)

## Testing Without Making Code Changes

If you want to trigger a release to test:

```bash
git commit --allow-empty -m "chore: trigger release to test PAT setup"
git push origin main
```

This will create a patch version (e.g., 2.4.0 → 2.4.1) without any code changes.

## Troubleshooting

- If the Docker workflow still doesn't run after the release commit:
  - Verify the secret name is exactly `SEMANTIC_RELEASE_TOKEN`
  - Check that the PAT has the `repo` and `workflow` scopes
  - Ensure the PAT hasn't expired

- To check workflow runs:
  ```bash
  gh run list --limit 10
  ```
