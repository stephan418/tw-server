FROM node:current-alpine3.10

RUN npm i -g ts-node@9.1.1

RUN mkdir /home/app

COPY . /home/app

WORKDIR /home/app
RUN npm i

CMD ["npm", "run", "start"]
