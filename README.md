# BuddhiAI Harness (bah)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Ecosystem: BuddhiAI](https://img.shields.io/badge/Ecosystem-BuddhiAI-8A2BE2)](https://github.com/Buddhilive)

**BuddhiAI Harness** (`bah`) is an extensible, plugin-based AI agent harness designed for the **BuddhiAI Local AI Ecosystem**. It orchestrates autonomous agent loops, code execution, multi-agent workflows, and web access, connecting natively and exclusively by default to **[BuddhiAI Studio](https://github.com/Buddhilive/buddhi-ai-studio)** for local inferencing and SearXNG web search.

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
Ensure your BuddhiAI Studio service is running:
```bash
# Verify health check
curl http://localhost:8765/health
# Expected: {"status":"healthy"}
```

### 2. Run BuddhiAI Harness Locally
```bash
# Clone the repository
git clone https://github.com/Buddhilive/buddhi-ai-harness.git
cd buddhi-ai-harness

# Install dependencies and build
pnpm install
pnpm run build

# Start the Web UI
pnpm bah web
```
The Web UI will be accessible at `http://127.0.0.1:3000` (or `3080`).

### 3. CLI Usage
BuddhiAI Harness provides both `bah` (primary) and `dsh` (backward compatibility alias) commands:
```bash
# Run a single task from terminal
pnpm bah "Analyze project architecture and list potential simplifications"

# Run interactive CLI session
pnpm bah
```

---

## 🐳 Docker Deployment

You can run the full BuddhiAI ecosystem using Docker Compose:

```bash
docker compose up -d
```
This orchestrates:
- **`buddhi-ai-studio`**: Local inference and SearXNG search engine at port `8765`.
- **`buddhi-ai-harness`**: Agent Web UI and execution runner at port `3000`.

---

## ⚙️ Configuration & Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BUDDHI_STUDIO_URL` | Base URL for BuddhiAI Studio inference and search endpoints | `http://localhost:8765` |
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

## 📄 License

This project is licensed under the [MIT License](LICENSE).
BuddhiAI Harness is a downstream customized distribution developed by [Buddhi](https://github.com/Buddhilive), forked from and compatible with DeepSeek Harness.
