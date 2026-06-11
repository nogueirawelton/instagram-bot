FROM node:22-alpine AS base

WORKDIR /app

# ── development ────────────────────────────────────────────────────────────────
FROM base AS development

USER node
ENV NODE_ENV=development

EXPOSE ${WEB_PORT:-5173}

CMD ["sh", "-c", "npm install && npm run dev -- --host --port ${WEB_PORT:-5173}"]

# ── production ─────────────────────────────────────────────────────────────────
FROM base AS production

USER node
ENV NODE_ENV=production

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npm run build
