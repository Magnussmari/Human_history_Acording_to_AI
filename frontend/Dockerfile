# Timeline (Chronograph) — standalone Next server for the sovereign edge deploy.
# Build context is frontend/. The corpus chunks + lite index are already
# committed under public/data, so we run `next build` directly (skipping the
# `prebuild` aggregate, which needs the parent outputs/json outside this context).
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
