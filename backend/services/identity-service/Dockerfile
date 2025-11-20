# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20-alpine
ARG SERVICE_PATH=backend/services/identity-service

FROM node:${NODE_VERSION} AS deps
ARG SERVICE_PATH
WORKDIR /workspace/${SERVICE_PATH}
COPY ${SERVICE_PATH}/package*.json ./
RUN npm ci

FROM node:${NODE_VERSION} AS build
ARG SERVICE_PATH
WORKDIR /workspace
COPY shared ./shared
COPY scripts ./scripts
COPY ${SERVICE_PATH} ./${SERVICE_PATH}
COPY --from=deps /workspace/${SERVICE_PATH}/node_modules /workspace/${SERVICE_PATH}/node_modules
RUN ln -s /workspace/${SERVICE_PATH}/node_modules /workspace/node_modules
WORKDIR /workspace/${SERVICE_PATH}
RUN npm run build

FROM node:${NODE_VERSION} AS runtime
ARG SERVICE_PATH
WORKDIR /app
ENV NODE_ENV=production
COPY ${SERVICE_PATH}/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /workspace/${SERVICE_PATH}/dist ./dist
EXPOSE 7102
USER node
CMD ["node", "dist/index.js"]
