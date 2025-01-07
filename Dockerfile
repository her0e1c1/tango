FROM node:23

WORKDIR /workspace

ENV PATH /node_modules/.bin:$PATH

# Stop mounting /workspace/node_modules
# It makes docker compose too slow
RUN \
  --mount=type=cache,target=/root/.npm \
  --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=package-lock.json,target=package-lock.json \
  npm ci && mv node_modules /
