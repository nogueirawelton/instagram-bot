FROM node:22-alpine AS web-builder

ARG VITE_BASE_PATH=/apps/instagram-api
ARG VITE_API_BASE_URL

RUN mkdir -p /app && chown node:node /app

WORKDIR /app

USER node

COPY --chown=node:node web/package*.json ./
RUN npm install

COPY --chown=node:node web/ .
RUN VITE_BASE_PATH=${VITE_BASE_PATH} VITE_API_BASE_URL=${VITE_API_BASE_URL} npm run build

# ── production ─────────────────────────────────────────────────────────────────
FROM nginx:alpine

ARG NGINX_USER
ARG NGINX_PASSWORD

RUN apk add --no-cache apache2-utils && \
    htpasswd -bc /etc/nginx/.htpasswd "$NGINX_USER" "$NGINX_PASSWORD" && \
    apk del apache2-utils

COPY --from=web-builder /app/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
