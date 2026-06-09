FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @certchain/web...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_DONATE_GITHUB_URL=
ARG NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS=
ARG NEXT_PUBLIC_DONATE_CRYPTO_LABEL=
ARG NEXT_PUBLIC_DONATE_KOFI_URL=
ARG NEXT_PUBLIC_CONTACT_NAME=
ARG NEXT_PUBLIC_CONTACT_WHATSAPP=
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DONATE_GITHUB_URL=$NEXT_PUBLIC_DONATE_GITHUB_URL
ENV NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS=$NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS
ENV NEXT_PUBLIC_DONATE_CRYPTO_LABEL=$NEXT_PUBLIC_DONATE_CRYPTO_LABEL
ENV NEXT_PUBLIC_DONATE_KOFI_URL=$NEXT_PUBLIC_DONATE_KOFI_URL
ENV NEXT_PUBLIC_CONTACT_NAME=$NEXT_PUBLIC_CONTACT_NAME
ENV NEXT_PUBLIC_CONTACT_WHATSAPP=$NEXT_PUBLIC_CONTACT_WHATSAPP
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
RUN pnpm --filter @certchain/shared build
RUN pnpm --filter @certchain/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
