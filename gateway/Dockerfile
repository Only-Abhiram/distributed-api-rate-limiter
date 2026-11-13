FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY gateway ./gateway

CMD ["node", "gateway/server.js"]