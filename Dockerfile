# syntax=docker/dockerfile:1.7

FROM node:24-bookworm AS base

WORKDIR /workspace

ENV PATH=/workspace/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

FROM base AS deps

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS app

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
