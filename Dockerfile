FROM node:14

WORKDIR /app

COPY package.json               /app
COPY .env               /app
COPY node_modules       /app/node_modules
COPY src                /app/src

EXPOSE 4000

ENTRYPOINT ["npm",  "start" ]
