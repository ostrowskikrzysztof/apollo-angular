#!/bin/bash

VERSION=$1

./scripts/version.js apollo-angular $VERSION
./scripts/version.js apollo-angular-link-headers $VERSION
./scripts/version.js apollo-angular-link-http $VERSION
./scripts/version.js apollo-angular-link-http-batch $VERSION
./scripts/version.js apollo-angular-link-http-common $VERSION
./scripts/version.js apollo-angular-link-persisted $VERSION


(cd ./packages/apollo-angular && npm run deploy)
(cd ./packages/apollo-angular-link-headers && npm run deploy)
(cd ./packages/apollo-angular-link-http && npm run deploy)
(cd ./packages/apollo-angular-link-http-batch && npm run deploy)
(cd ./packages/apollo-angular-link-http-common && npm run deploy)
(cd ./packages/apollo-angular-link-persisted && npm run deploy)
