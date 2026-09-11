# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM oven/bun:1-alpine AS build
WORKDIR /app

# Skip husky's git-hook install inside the container.
ENV HUSKY=0

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the static site.
COPY . .
RUN bun run build

# ---------- Runtime stage ----------
FROM nginx:stable-alpine AS runtime

# Internal listen port. Override at runtime with -e PORT=xxxx.
ENV PORT=8080

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

# The base image entrypoint renders templates (envsubst) then starts nginx.
