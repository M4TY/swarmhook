FROM node:19-alpine

RUN apk update && apk add docker

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start"]