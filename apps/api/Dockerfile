# Build stage: from monorepo root context
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace and API files (context is repo root when building from there)
COPY package.json package-lock.json* ./
COPY apps/api ./apps/api
COPY packages ./packages

RUN npm ci
RUN npx prisma generate --schema=apps/api/src/infra/prisma/schema.prisma
RUN npm run build:api

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
RUN npm install tsconfig-paths

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/infra/generated ./apps/api/src/infra/generated
COPY --from=builder /app/apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
# Cloud Run sets PORT (default 8080); app listens on 0.0.0.0
ENV PORT=8080

WORKDIR /app/apps/api
CMD ["node", "-r", "tsconfig-paths/register", "dist/apps/api/src/bootstrap/main.js"]
