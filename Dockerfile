FROM node:22-alpine AS base

WORKDIR /app

# Corepack selects the exact pnpm version pinned in package.json.
RUN corepack enable

# Keep dependency installation reproducible and cacheable.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS builder

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM base AS production-dependencies

RUN pnpm install --prod --frozen-lockfile

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
