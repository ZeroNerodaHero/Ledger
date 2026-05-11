FROM node:22-alpine

WORKDIR /app

COPY apps/realtime-cron/package.json ./
RUN npm install

COPY apps/realtime-cron/src ./src

EXPOSE 4100

CMD ["npm", "run", "dev"]
