FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependency manifest and install
COPY package.json ./
RUN npm install --production

# Copy app source
COPY . ./

EXPOSE 3000

CMD ["npm", "start"]
