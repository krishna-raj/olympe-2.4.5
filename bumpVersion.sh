#!/bin/sh
VERSION=$(jq -rc '.version' ./package.json)
COMMIT_REF=$(git log -n 1 --pretty=format:"%h")
TIMESTAMP=$(date +%s)
PUBLISH_VER="${VERSION}-${COMMIT_REF}-${TIMESTAMP}"

echo "Setting npm package version to ${PUBLISH_VER}"
sed -i.bak -e "s/\"version\": \".*\",/\"version\": \"${PUBLISH_VER}\",/" package.json
