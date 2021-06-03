#!/bin/bash

tar \
--exclude="*.DS_Store*" \
--exclude="*.git*" \
--exclude="data/*" \
--exclude="dist/*" \
--exclude="docker/*" \
--exclude="node_modules/*" \
--exclude="script/*" \
--exclude="src/pages/*" \
--exclude=".babelrc" \
--exclude="config.json" \
--exclude="jsdoc.json" \
--exclude="webpack.config.json" \
-zcvf docker/splash.tar.gz .
