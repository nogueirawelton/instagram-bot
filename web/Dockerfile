FROM node:22-alpine AS base

# Cria /app e node_modules com permissão para o usuário node.
# O Docker inicializa volumes nomeados copiando o conteúdo da imagem no caminho
# montado, então node_modules precisa existir com chown correto para o volume
# ser inicializado com a ownership certa.
RUN mkdir -p /app/node_modules && chown -R node:node /app

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
