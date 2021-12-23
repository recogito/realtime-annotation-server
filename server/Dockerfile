FROM node:14

WORKDIR /src
COPY package.json .
COPY package-lock.json .
COPY . .
COPY .env.docker ./.env
RUN npm install
RUN npm run build
CMD npm start