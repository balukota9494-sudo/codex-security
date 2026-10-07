# Multi-stage Dockerfile for TRUSTGUARD AI Monorepo
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci

# Copy source trees
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared library, backend, and frontend
RUN npm run build --workspace=shared
RUN npm run build --workspace=server
RUN npm run build --workspace=client

# Runtime stage for backend API server
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001

USER node

CMD ["node", "server/dist/index.js"]
