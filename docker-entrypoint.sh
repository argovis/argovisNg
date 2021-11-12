# entrypoint for angular frontend
# usage: bash docker-entrypoint.sh <IP and port of API> <IP and port of datapages service>

# need to sub in API adress in client-side code at runtime startup:
sed -i "s|ARGOVIS_API_ROOT|$1|g" /usr/src/ng_argovis/dist/main*.js
sed -i "s|ARGOVIS_DP_ROOT|$2|g" /usr/src/ng_argovis/dist/main*.js

# start app
./bin/www
