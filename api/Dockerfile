FROM node:14-alpine

ARG APP_DIR=/var/www/mysql-learning/api
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

COPY package*.json ./
RUN npm ci

