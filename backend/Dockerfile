# Etapa 1: Base ligera con Node 22
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json ./

# Etapa 2: Compilación de TypeScript
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY src/ ./src
RUN pnpm build

# Etapa 3: Dependencias de producción puras
FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile

# Etapa 4: Contenedor final seguro para Producción
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Usuario sin privilegios por seguridad defensiva
USER node

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]