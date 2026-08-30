# ── BuddhiAI Harness Container Build ──
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

# Copy workspace dependency manifests first for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY vendor/ vendor/
COPY packages/ packages/
COPY apps/ apps/
COPY scripts/ scripts/
COPY tsconfig*.json tsdown.config.ts ./

# Build libraries and applications
ENV DSH_CLIENT_TITLE="BuddhiAI Harness"
ENV BUDDHI_STUDIO_URL="http://localhost:8765"

RUN pnpm install --frozen-lockfile || true
RUN npm run build:lib:host || true

# Production runner stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV BUDDHI_STUDIO_URL=http://buddhi-ai-studio:8765
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start BuddhiAI Harness Web application
CMD ["pnpm", "bah", "web", "--host", "0.0.0.0", "--port", "3000"]
