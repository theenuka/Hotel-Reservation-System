# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20-alpine
ARG VITE_API_BASE_URL=http://localhost:7008

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NODE_ENV=development
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY hotel-booking-frontend/package*.json ./
RUN npm ci
COPY hotel-booking-frontend/tsconfig*.json ./
COPY hotel-booking-frontend/vite.config.* ./
COPY hotel-booking-frontend/tailwind.config.js ./
COPY hotel-booking-frontend/postcss.config.js ./
COPY hotel-booking-frontend/netlify.toml ./
COPY hotel-booking-frontend/index.html ./
COPY hotel-booking-frontend/public ./public
COPY hotel-booking-frontend/src ./src
COPY hotel-booking-frontend/nginx.conf ./nginx.conf
COPY shared /shared
RUN npm run build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4173
CMD ["nginx", "-g", "daemon off;"]
