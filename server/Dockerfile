FROM node:16

# define code directory
WORKDIR /usr/src/app

# Import app dependencies
COPY package*.json ./

RUN npm install

# Import app code
COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]