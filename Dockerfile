# syntax=docker/dockerfile:1.7

FROM node:24-bookworm

WORKDIR /workspace

ENV PATH=/workspace/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci
