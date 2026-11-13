FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY upstream ./upstream

CMD ["node", "upstream/server.js"]