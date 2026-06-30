# ─── Build stage (Vite) ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Vite inlines env at build time, so the API URL must be known here.
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ─── Production image (nginx serving the static SPA) ─────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
