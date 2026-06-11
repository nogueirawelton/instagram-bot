FROM oven/bun:1.3-debian AS base

# Instala deps do sistema como root antes de trocar de usuário
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 \
    libcairo2 libatspi2.0-0 libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app && chown bun:bun /app

WORKDIR /app

USER bun

COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile

RUN bunx playwright install chromium

RUN mkdir -p public/media logs screenshots

# ── development ────────────────────────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

EXPOSE 3030

CMD ["sh", "-c", "bun install && bun run --watch index.ts"]

# ── production ─────────────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

COPY --chown=bun:bun . .

EXPOSE 3030

CMD ["bun", "run", "index.ts"]
