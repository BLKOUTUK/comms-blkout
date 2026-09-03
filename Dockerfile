# comms-blkout Dockerfile for Coolify
# Serves both static frontend AND API routes via Express
FROM node:22-alpine AS builder

WORKDIR /app

# Cache bust - forces full rebuild when changed (fixes corrupted cached layers)
LABEL build.date="2026-09-03"

# Copy package files. The lockfile is authoritative: npm ci installs exactly what it
# records, so a rebuild months from now resolves the same tree as today.
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build args for Vite (import.meta.env is replaced at build time).
# Everything listed here is compiled into the PUBLIC JS bundle. Client secrets, API
# keys and access tokens were removed on 3 Sep 2026 after five of them were found in
# the served bundle - they belong in server-side env, never in a VITE_ variable.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AUTH_DISABLED=false
ARG VITE_MOCK_USER_EMAIL=admin@blkout.dev
ARG VITE_MOCK_USER_NAME=BLKOUT Admin
ARG VITE_INSTAGRAM_CLIENT_ID
ARG VITE_INSTAGRAM_REDIRECT_URI
ARG VITE_TIKTOK_CLIENT_KEY
ARG VITE_LINKEDIN_CLIENT_ID
ARG VITE_YOUTUBE_CLIENT_ID
ARG VITE_TWITTER_CLIENT_ID
ARG VITE_CANVA_CLIENT_ID
ARG VITE_CANVA_REDIRECT_URI
ARG VITE_HEARTBEAT_NEWS_CHANNEL_ID

# Make args available as env vars during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_AUTH_DISABLED=$VITE_AUTH_DISABLED
ENV VITE_MOCK_USER_EMAIL=$VITE_MOCK_USER_EMAIL
ENV VITE_MOCK_USER_NAME=$VITE_MOCK_USER_NAME
ENV VITE_INSTAGRAM_CLIENT_ID=$VITE_INSTAGRAM_CLIENT_ID
ENV VITE_INSTAGRAM_REDIRECT_URI=$VITE_INSTAGRAM_REDIRECT_URI
ENV VITE_TIKTOK_CLIENT_KEY=$VITE_TIKTOK_CLIENT_KEY
ENV VITE_LINKEDIN_CLIENT_ID=$VITE_LINKEDIN_CLIENT_ID
ENV VITE_YOUTUBE_CLIENT_ID=$VITE_YOUTUBE_CLIENT_ID
ENV VITE_TWITTER_CLIENT_ID=$VITE_TWITTER_CLIENT_ID
ENV VITE_CANVA_CLIENT_ID=$VITE_CANVA_CLIENT_ID
ENV VITE_CANVA_REDIRECT_URI=$VITE_CANVA_REDIRECT_URI
ENV VITE_HEARTBEAT_NEWS_CHANNEL_ID=$VITE_HEARTBEAT_NEWS_CHANNEL_ID

# Build frontend (Vite) and server (Express + API)
RUN npm run build

# Production stage. Node 22: @supabase/supabase-js needs native WebSocket, and on
# Node 20 every /api/* route threw at import time and returned 500.
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server-dist ./server-dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only, from the lockfile
RUN npm ci --omit=dev --legacy-peer-deps

# Expose port
EXPOSE 3000

# Run the Express server (serves static + API)
CMD ["node", "server-dist/server.js"]
