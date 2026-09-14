# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY content ./content
RUN pnpm prisma generate && pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.24.0 --activate \
  && groupadd --system gge \
  && useradd --system --gid gge --create-home gge
COPY --from=build --chown=gge:gge /app/node_modules ./node_modules
COPY --from=build --chown=gge:gge /app/dist ./dist
COPY --from=build --chown=gge:gge /app/prisma ./prisma
COPY --from=build --chown=gge:gge /app/content ./content
COPY --from=build --chown=gge:gge /app/src/content ./src/content
COPY --from=build --chown=gge:gge /app/package.json ./package.json
COPY --from=build --chown=gge:gge /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=gge:gge --chmod=755 scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN find /app/node_modules -type f \( -name "schema-engine*" -o -name "query-engine*" -o -name "libquery_engine*" \) -exec chmod a+x {} + \
  && chown -R gge:gge /app
USER gge
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=300s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
