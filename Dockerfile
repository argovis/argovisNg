# base image - only rebuild when package.json changes or dep updates desired.
FROM node:12.0 as base
WORKDIR /usr/src/ng_argovis
COPY package*.json ./
RUN npm install && \
    npm install @angular/cli@9.1.0 -g && \
    npm install -g pm2

# code head image - build as release candidate
FROM base as head
COPY . .
RUN npm run ng-high-memory
CMD bash /usr/src/ng_argovis/docker-entrypoint.sh http://127.0.0.1:8080

# test image - extends head with testing tools

FROM head as test
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable