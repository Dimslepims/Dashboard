FROM node:16

# define code directory
WORKDIR /usr/src/app

# Import app dependencies
COPY package*.json ./

RUN npm install

# Import app code
COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 8081

CMD [ "npm", "run", "serve" ]