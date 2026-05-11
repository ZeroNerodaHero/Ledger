FROM node:22-alpine

WORKDIR /app

COPY apps/web/package.json ./
RUN npm install

COPY apps/web/src ./src
COPY apps/web/next.config.mjs ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
