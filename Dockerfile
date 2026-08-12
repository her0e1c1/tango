# syntax=docker/dockerfile:1.7

FROM node:24-bookworm AS base

WORKDIR /workspace

ENV PATH=/workspace/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

FROM base AS deps

COPY package.json package-lock.json ./
COPY functions/package.json functions/package-lock.json ./functions/

RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm --prefix functions ci

FROM base AS app

COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/functions/node_modules ./functions/node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
