# syntax=docker/dockerfile:1.7

FROM node:24-bookworm

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH

RUN npm install -g npm@11.6.0

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
