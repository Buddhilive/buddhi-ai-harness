# Upstream Sync Playbook: DeepSeek Harness to BuddhiAI Harness

This guide describes the end-to-end procedure for keeping **BuddhiAI Harness** (`buddhi-ai-harness`) synchronized with upstream **DeepSeek Harness** (`deepseek-harness`) while preserving all custom features, branding, and local ecosystem integrations without merge conflicts.

---

## 1. Branch Architecture & Remotes

* **`master`**: Clean upstream mirror tracking `deepseek-ai/deepseek-harness`.
* **`buddhi-ai`**: Default branch for `buddhi-ai-harness`, containing all BuddhiAI extensions (`@buddhilive/*`), custom branding, and configurations.
* **`sync/upstream-sync`**: Ephemeral integration branch used to test and verify merges before applying to `buddhi-ai`.

### Initial Remote Setup (One-Time)

Ensure you have both the `origin` (BuddhiAI fork) and `upstream` (DeepSeek) remotes configured:

```bash
# Check existing remotes
git remote -v

# Add upstream if not already present
git remote add upstream https://github.com/deepseek-ai/deepseek-harness.git
git fetch upstream
```

---

## 2. Step-by-Step Sync Workflow

### Step 1: Update the Local `master` Branch

Always bring `master` up to date with the latest upstream release/commits:

```bash
git checkout master
git pull upstream master
git push origin master
```

### Step 2: Create an Isolated Sync Branch

Never merge directly into `buddhi-ai`. Always create an ephemeral branch off `buddhi-ai`:

```bash
git checkout buddhi-ai
git pull origin buddhi-ai
git checkout -b sync/upstream-sync
```

### Step 3: Trigger the Merge

Merge `master` into the sync branch:

```bash
git merge master
```

If the merge completes with conflicts, proceed to [Conflict Resolution Rules](#3-common-conflict-hotspots--resolution-rules).

---

## 3. Common Conflict Hotspots & Resolution Rules

When upstream introduces large updates, conflicts typically occur in a predictable set of configuration and bundle files:

### 1. `README.md`
* **Rule**: Keep BuddhiAI Harness title, badges, architecture diagrams, npx quickstart instructions, and environment variables.
* Incorporate any critical new upstream safety notices or architecture disclaimers at the top or bottom as appropriate.

### 2. `packages/bundle/base/cordis.patch.yml` & `package.json`
* **Rule**: Retain BuddhiAI custom providers alongside new upstream capabilities.
* In `cordis.patch.yml`:
  ```yaml
  - id: web
    name: '@deepseek-ai/dsh-web'
    config:
      searchProvider: searxng       # Keep BuddhiAI SearXNG search
      fetchProvider: http           # Adopt upstream HTTP fetch provider

  - id: web-search-searxng
    name: '@buddhilive/bah-web-search-searxng'
  ```
* In `package.json`: Include both `@buddhilive/bah-web-search-searxng` and `@deepseek-ai/dsh-web-fetch-http` under `dependencies`.

### 3. `packages/bundle/web-app/cordis.patch.yml`
* **Rule**: Use `@buddhilive/bah-client-ui-brand` in place of `@deepseek-ai/dsh-client-ui-brand-official`.
* Adopt upstream additions such as `ui-approval` and `ui-chat`.

### 4. `tsconfig.base.json` & `tsconfig.client.json`
* **`tsconfig.base.json`**:
  Keep the `@buddhilive` alias mappings right above the generated `@deepseek-ai` aliases:
  ```json
  "@buddhilive/bah-*": [
    "./packages/llm/*/src",
    "./packages/web/*/src",
    "./packages/client/*/src"
  ],
  "@buddhilive/bah-*/client": [
    "./packages/client/*/src/client"
  ],
  ```
* **`tsconfig.client.json`**:
  Keep `{ "path": "./packages/client/ui-brand-buddhi" }` in the references list alongside upstream UI packages.

### 5. `packages/client/ui-settings-models/`
* **`ModelsSection.tsx` & `ProviderEditor.tsx`**: Keep `BuddhiRowHealthBadge` and local Studio URL / health status checks while adopting upstream's refactored `operations` parameters.
* **`locales.ts`**: DeepSeek Harness routes all UI copy through `locales.ts`. Keep BuddhiAI welcome messages in `locales.ts` under `welcomeTitle` and `welcomeBody` for both `en` and `zh`.
* **`onboarding-copy.ts`**: Accept upstream's version (copy constants have migrated to `locales.ts`).

### 6. `pnpm-lock.yaml`
* After resolving package manifests (`package.json`), regenerate the lockfile cleanly:
  ```bash
  pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false
  ```

---

## 4. Post-Merge Build & Verification

Once conflicts are staged, finalize the merge commit and run verification:

```bash
# 1. Commit the merge
# Note: Use --no-verify if pre-commit hooks fail due to newly fetched third-party notice caches
git commit -m "chore: merge upstream master into buddhi-ai" --no-verify

# 2. Clean obsolete build artifacts from upstream deleted/renamed packages
pnpm run clean

# 3. Build Host and Client libraries
pnpm run build:lib:host
pnpm run build:lib:client

# 4. Run test suites for custom and affected packages
pnpm vitest run packages/llm/llm-buddhi packages/web/web-search-searxng packages/client/ui-brand-buddhi packages/client/ui-settings-models
```

---

## 5. Fast-Forward `buddhi-ai` & Push

Once the verification suite passes completely:

```bash
# 1. Switch to buddhi-ai
git checkout buddhi-ai

# 2. Fast-forward merge the verified sync branch
git merge --ff-only sync/upstream-sync

# 3. Push the synced default branch
git push origin buddhi-ai

# 4. Clean up temporary sync branch
git branch -d sync/upstream-sync
```

---

## 6. Proactive Tips to Prevent Conflict Friction

1. **Enable Git `rerere` (Reuse Recorded Resolution):**
   ```bash
   git config rerere.enabled true
   ```
   Git will record your resolution decisions and automatically apply them during future syncs.
2. **Keep Core Upstream Files Untouched:**
   Adhere to the Cordis plugin paradigm: implement features in `@buddhilive/*` plugins and patch them via `cordis.patch.yml` rather than modifying upstream core engine packages directly.
3. **Sync Regularly:**
   Pull upstream updates on a scheduled basis (e.g. after each upstream release tag) so diffs remain small and manageable.
