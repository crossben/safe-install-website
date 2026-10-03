# syntax=docker/dockerfile:1

# Multi-stage build: install dependencies, produce the static export, then
# serve it from Caddy. The final image contains no Node.js and no node_modules —
# only the HTML, CSS, JS and fonts that `next build` emitted.

FROM node:24-alpine AS deps
WORKDIR /app
# Dependencies are installed from the lockfile alone so this layer is reused
# whenever only application source changes.
COPY package.json package-lock.json ./
RUN npm ci

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