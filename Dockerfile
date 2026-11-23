# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------
# VIALUNEXA · Frontend (React + Vite) servido con nginx
# Etapa 1: compila la app · Etapa 2: imagen liviana solo con los archivos
# ---------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variables públicas que Vite incrusta al compilar (llegan como build args)
ARG VITE_GOOGLE_MAPS_KEY=""
ARG VITE_API_URL=""
# Commit desplegado: Render entrega RENDER_GIT_COMMIT; GitHub Actions entrega GIT_COMMIT
ARG RENDER_GIT_COMMIT=""
ARG GIT_COMMIT=""
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY \
    VITE_API_URL=$VITE_API_URL \
    RENDER_GIT_COMMIT=$RENDER_GIT_COMMIT \
    GIT_COMMIT=$GIT_COMMIT

RUN npm run build

# ---------------------------------------------------------------------
FROM nginx:stable-alpine

# Render indica el puerto con PORT; nginx lo toma desde la plantilla
ENV PORT=8080
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
