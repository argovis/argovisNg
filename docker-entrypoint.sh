# entrypoint for angular frontend
# usage: set environment variables ARGOVIS_API_ROOT and ARGOVIS_DP_ROOT, then bash docker-entrypoint.sh 

# need to sub in API adress in client-side code at runtime startup:
sed -i "s|ARGOVIS_API_ROOT|$ARGOVIS_API_ROOT|g" /usr/src/ng_argovis/dist/main*.js
sed -i "s|ARGOVIS_DP_ROOT|$ARGOVIS_DP_ROOT|g" /usr/src/ng_argovis/dist/main*.js
sed -i "s|ARGOVIS_API_KEY|$ARGOVIS_API_KEY|g" /usr/src/ng_argovis/dist/main*.js

# start app
./bin/www
