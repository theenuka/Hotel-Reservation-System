# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20-alpine
ARG SERVICE_PATH=backend/services/api-gateway

# --- Dependencies ---
FROM node:${NODE_VERSION} AS deps
ARG SERVICE_PATH
WORKDIR /workspace
COPY ${SERVICE_PATH}/package*.json ./${SERVICE_PATH}/
WORKDIR /workspace/${SERVICE_PATH}
RUN npm ci

# --- Build ---
FROM node:${NODE_VERSION} AS build
ARG SERVICE_PATH
WORKDIR /workspace
COPY shared/ ./shared/
COPY ${SERVICE_PATH}/ ./$SERVICE_PATH/
COPY --from=deps /workspace/${SERVICE_PATH}/node_modules ./$SERVICE_PATH/node_modules
RUN ln -s /workspace/${SERVICE_PATH}/node_modules /workspace/node_modules
WORKDIR /workspace/${SERVICE_PATH}
RUN npm run build

# --- Runtime ---
FROM node:${NODE_VERSION} AS runtime
ARG SERVICE_PATH
ENV NODE_ENV=production
ENV SERVICE_PATH=${SERVICE_PATH}
WORKDIR /app
COPY --from=build /workspace/${SERVICE_PATH}/dist ./dist
COPY ${SERVICE_PATH}/package*.json .
RUN npm ci --omit=dev
EXPOSE 7008
USER node
CMD node dist/${SERVICE_PATH}/src/index.js
