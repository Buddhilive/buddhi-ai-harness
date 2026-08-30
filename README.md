# BuddhiAI Harness (bah)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Ecosystem: BuddhiAI](https://img.shields.io/badge/Ecosystem-BuddhiAI-8A2BE2)](https://github.com/Buddhilive)

**BuddhiAI Harness** (`bah`) is an extensible, plugin-based AI agent harness designed for the **BuddhiAI Local AI Ecosystem**. It orchestrates autonomous agent loops, code execution, multi-agent workflows, and web access, connecting natively and exclusively by default to **[BuddhiAI Studio](https://github.com/Buddhilive/buddhi-ai-studio)** for local inferencing and SearXNG web search.

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

---

## 🏛 Architecture & Ecosystem Integration

BuddhiAI Harness adheres to the principle that **everything is a plugin** (powered by Cordis). Downstream customizations are decoupled from upstream agent core internals using modular plugins under `@buddhilive/*`:

```
┌────────────────────────────────────────────────────────┐
│             BuddhiAI Harness (bah)                      │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Web UI & Sidebar    │  │       CLI (bah/dsh)   │  │
│  │   (@buddhilive/       │  │                       │  │
│  │    bah-client-ui-brand│  │                       │  │
│  └──────────┬────────────┘  └───────────┬───────────┘  │
│             │                           │              │
│             ▼                           ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Agent Runtime Spine                 │  │
│  │  (Session, Tools, Compaction, Multi-Agent Loop)  │  │
│  └───────────────┬──────────────────┬───────────────┘  │
│                  │                  │                  │
│  ┌───────────────▼────────┐  ┌──────▼───────────────┐  │
│  │   LLM Provider Route   │  │  Web Search Provider │  │
│  │   (@buddhilive/        │  │  (@buddhilive/       │  │
│  │    bah-llm-buddhi)     │  │   bah-web-search-    │  │
│  │                        │  │   searxng)           │  │
│  └───────────────┬────────┘  └──────┬───────────────┘  │
└──────────────────┼──────────────────┼──────────────────┘
                   │                  │
                   ▼                  ▼
┌────────────────────────────────────────────────────────┐
│             BuddhiAI Studio (Local Server)             │
│               http://localhost:8765                    │
│                                                        │
│   • OpenAI-compatible LLM:   /v1/chat/completions      │
│   • Model Discovery:         /v1/models                │
│   • SearXNG Search Service:  /v1/search                │
│   • Health Probe:            /health                   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: `^22.19.0 || >=24.0.0`
- **pnpm**: `^11.0.0`
- **BuddhiAI Studio**: Running locally (default port: `8765`)

### 1. Launch BuddhiAI Studio
Ensure your **[BuddhiAI Studio](https://github.com/Buddhilive/buddhi-ai-studio)** service is running (default port: `8765`):
```bash
# Verify health check
curl http://localhost:8765/health
# Expected: {"status":"healthy"}
```

### 2. Launch BuddhiAI Harness via NPX (Recommended)
You can launch the web interface instantly with no cloning or manual installation:
```bash
npx buddhi-ai web
```
The Web UI will open at `http://127.0.0.1:3000`. By default, it connects automatically to BuddhiAI Studio at `http://localhost:8765` with **zero configuration or environment variables required**.

### 3. Global Installation & CLI Usage
For persistent CLI usage, install globally via npm:
```bash
npm install -g buddhi-ai

# Start the Web UI
buddhi-ai web

# Run interactive CLI session
buddhi-ai

# Run a single task directly from terminal
buddhi-ai "Analyze project architecture and list potential simplifications"
```
> Backward compatibility aliases `bah` and `dsh` are also available.

### 4. Running from Source (Developers)
```bash
# Clone the repository
git clone https://github.com/Buddhilive/buddhi-ai-harness.git
cd buddhi-ai-harness

# Install dependencies and build
pnpm install
pnpm run build

# Start the Web UI
pnpm buddhi-ai web
```

---

## ⚙️ Configuration & Environment Variables

All settings work out of the box with zero configuration. You can customize the Studio URL directly from the **Settings / Models** page in the Web UI, or optionally set environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BUDDHI_STUDIO_URL` | Optional base URL override for BuddhiAI Studio inference and search endpoints | `http://localhost:8765` |
| `DSH_CLIENT_TITLE` | Browser window title for the Web application | `BuddhiAI Harness` |
| `PORT` | Local port for Web UI server | `3000` |
| `HOST` | Bind address for Web UI server | `127.0.0.1` |

---

## 🎨 Branding Asset Placement

Customizing branding logos and styling is cleanly modularized into `@buddhilive/bah-client-ui-brand`:

| Asset / Component | Location | Description |
| :--- | :--- | :--- |
| **Mark SVG Logo** | [`packages/client/ui-brand-buddhi/src/client/BuddhiLogo.tsx`](packages/client/ui-brand-buddhi/src/client/BuddhiLogo.tsx) | Renders the intelligence core icon in the sidebar and hero conversation view. |
| **Typographic Wordmark** | [`packages/client/ui-brand-buddhi/src/client/BuddhiWordmark.tsx`](packages/client/ui-brand-buddhi/src/client/BuddhiWordmark.tsx) | Renders "BuddhiAI Harness" in the top-left sidebar header. |
| **Slot Injector** | [`packages/client/ui-brand-buddhi/src/client/index.ts`](packages/client/ui-brand-buddhi/src/client/index.ts) | Wires slots `sidebar.brand.mark`, `sidebar.brand.name`, and `conversation.hero.brand.mark`. |
| **Favicon & Manifest** | [`apps/web/index.html`](apps/web/index.html) & [`apps/web/public/`](apps/web/public/) | Browser tab title and web app icon definitions. |

---

## 🧩 Custom Packages

| Package | Path | Description |
| :--- | :--- | :--- |
| `@buddhilive/bah-llm-buddhi` | [`packages/llm/llm-buddhi`](packages/llm/llm-buddhi) | OpenAI-compatible SSE adapter tailor-made for BuddhiAI Studio local models (`gemma-4-e4b`, etc.). |
| `@buddhilive/bah-web-search-searxng` | [`packages/web/web-search-searxng`](packages/web/web-search-searxng) | Native SearXNG REST search provider connecting to `${BUDDHI_STUDIO_URL}/v1/search`. |
| `@buddhilive/bah-client-ui-brand` | [`packages/client/ui-brand-buddhi`](packages/client/ui-brand-buddhi) | Official brand occupants for BuddhiAI Harness UI slots. |

---

## 📦 Release & Distribution

BuddhiAI Harness is distributed as an npm package under **[`buddhi-ai`](https://www.npmjs.com/package/buddhi-ai)**.

### Automated Release (GitHub Actions)

When you merge a pull request into the release branch (configured in [`.github/workflows/release-publish.yml`](.github/workflows/release-publish.yml)):

1. GitHub Actions automatically executes the **Release publish (buddhi-ai)** workflow.
2. The workflow builds official client & host bundles (`pnpm run build:official`), validates package versioning, packs tarballs, and runs a mock installation verification.
3. The tarballs are published to the npm registry using the `NPM_TOKEN` secret.

> **Requirement**: Ensure `NPM_TOKEN` is defined under **GitHub Repository → Settings → Secrets and variables → Actions** with publish permissions for the `buddhi-ai` package and `@buddhilive` scope.

### Manual Release Commands

To manually build, package, and publish the workspace from your local environment:

```bash
# 1. Clean build of client & host using official release profile
pnpm run build:official

# 2. Verify all release members, versions, and topological publish order
pnpm run release:verify --family dsh

# 3. Pack npm tarballs into dist/npm/
pnpm run release:pack --family dsh --out dist/npm

# 4. Verify packed installation
pnpm run release:verify-packed-install --family dsh --from dist/npm

# 5. Publish packed tarballs to NPM registry (requires NODE_AUTH_TOKEN or npm login)
pnpm run release:publish --family dsh --from dist/npm
```

#### Standalone `buddhi-ai` CLI Publish
If you only need to build and publish the CLI wrapper package independently:

```bash
pnpm run build
pnpm --dir apps/cli publish --access public
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
BuddhiAI Harness is a downstream customized distribution developed by [Buddhi](https://github.com/Buddhilive), forked from and compatible with DeepSeek Harness.
