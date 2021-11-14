# ArgovisNG

Angular frontend for Argovis.

## Build & Release Cycle

When all tests on the `main` branch are passing, releases may be made with the following procedures, assuming the base image hasn't changed (see below for when base images need an update, ie when node or package dep versions change)

1. Choose a release tag; this should typically be a standard semver, possibly suffixed with `-rc-x` for release candidates if necessary.

2. Stamp a release of the `main` branch on GitHub, using the release tag you chose.

3. Build the angular container: `docker image build --target head -t argovis/ng:<release tag> .`

4. Push to Docker Hub: `docker image push argovis/ng:<release tag>`

### Base Image Builds

In general, the base image for the frontend shouldn't change often; it is meant to capture package dependencies, and should be as stable as possible. But, when dependencies need an update (most typically after `package.json` changes), follow this procedure.

1. Build a new base image, tagged with the build date:  `docker image build -f Dockerfile-base -t argovis/ng:base-yymmdd .`

2. Update `Dockerfile` to build the `head` stage from your new base image (at the line that looks like `FROM argovis/ng:base-yymmdd as head`).

3. Build and run the test image to make sure the new base doesn't break anything:

```
docker image build -t argovis/ng:test .
docker container run argovis/ng:test
```

4. Push to Docker Hub: `docker image push argovis/ng:base-yymmdd`, and push the updates to the `main` branch to GitHub.