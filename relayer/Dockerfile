FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY ./src ./src
COPY ./scripts ./scripts
CMD ["npx", "ts-node", "src/index.ts"]

