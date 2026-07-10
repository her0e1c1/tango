# syntax=docker/dockerfile:1.7

FROM node:24-bookworm AS base

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

FROM base AS deps

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM node:24-bookworm AS compose

WORKDIR /workspace

ENV PATH=/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

# Keep dependencies outside /workspace so the source bind mount in compose
# does not hide node_modules or force Docker to populate a large volume.
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci && mv node_modules /

FROM base AS app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
