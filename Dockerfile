# syntax=docker/dockerfile:1

# Multi-stage build: install dependencies, produce the static export, then
# serve it from Caddy. The final image contains no Node.js and no node_modules —
# only the HTML, CSS, JS and fonts that `next build` emitted.

FROM node:24-alpine AS deps
WORKDIR /app
# Dependencies are installed through safe-install itself: lifecycle scripts off,
# and none run unless approved (this site needs none). The binary is pinned by
# version and SHA-256 here, so a tampered release cannot slip in.
ARG SAFE_INSTALL_VERSION=0.2.3
ARG SAFE_INSTALL_SHA256_amd64=65bac5f863b953c9676e7b772827043d3b062b6e0b8ae6ea14b79bdf433bfcf8
ARG SAFE_INSTALL_SHA256_arm64=28eec348ba9842a69cc1df236dba3354c9eccd76ed3fd12ac4513386ad566c6c
ARG TARGETARCH
RUN set -eu; \
    arch="${TARGETARCH:-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')}"; \
    case "$arch" in \
      amd64) sum="$SAFE_INSTALL_SHA256_amd64" ;; \
      arm64) sum="$SAFE_INSTALL_SHA256_arm64" ;; \
      *) echo "unsupported architecture: $arch" >&2; exit 1 ;; \
    esac; \
    wget -qO /tmp/si.tar.gz "https://github.com/crossben/safe-install/releases/download/v${SAFE_INSTALL_VERSION}/safe-install_linux_${arch}.tar.gz"; \
    echo "$sum  /tmp/si.tar.gz" | sha256sum -c -; \
    tar -xzf /tmp/si.tar.gz -C /usr/local/bin safe-install; \
    rm /tmp/si.tar.gz; \
    safe-install version
# Dependencies are installed from the lockfile alone so this layer is reused
# whenever only application source changes.
COPY package.json package-lock.json ./
RUN SAFE_INSTALL_NO_UPDATE_CHECK=1 safe-install install --frozen-lockfile --ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prebuild` runs check-facts.mjs, which verifies every claim on the site
# against content/sources/plan.md. The build fails if a claim lost its source.
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/out /srv
EXPOSE 3000