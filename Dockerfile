# base image - only rebuild when package.json changes or dep updates desired.
FROM node:12.0 as base
WORKDIR /usr/src/ng_argovis
COPY package*.json ./
RUN npm install && npm install @angular/cli@9.1.0 -g

# code head image - build as release candidate
FROM base as head
COPY . .
RUN npm run ng-high-memory
RUN chown -R 1000830000:1000830000 /usr/src/ng_argovis
USER 1000830000:1000830000
ENTRYPOINT bash /usr/src/ng_argovis/docker-entrypoint.sh http://127.0.0.1:8080 http://127.0.0.1:3030 
#ENTRYPOINT bash /usr/src/ng_argovis/docker-entrypoint.sh http://argovis-api-atoc-argovis-dev.apps.containers01.colorado.edu

# test image - extends head with testing tools

FROM head as test
USER 0:0
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable