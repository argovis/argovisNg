FROM node:12.0
#Install and build angular app
WORKDIR /usr/src/ng_argovis
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install && \
    npm install @angular/cli@9.1.0 -g && \
    npm install -g pm2
COPY . .
RUN npm run ng-high-memory
CMD bash /usr/src/ng_argovis/docker-entrypoint.sh http://127.0.0.1:8080

