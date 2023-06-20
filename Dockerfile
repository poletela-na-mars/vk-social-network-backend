FROM node:18-alpine

WORKDIR /usr/src/vk-network

COPY package*.json ./

RUN npm install
COPY . .
EXPOSE 4444

ENTRYPOINT ["node", "index.js"]