#!/bin/bash

splash_setup() {
    chown node:node /var/www/splash
    chmod 755 /var/www/splash
    curl -sL https://projects.gassets.space/splash/v0.4.0/splash-v0.4.0.tar.gz | tar -zxvf - -C /var/www/splash --overwrite
    cd /var/www/splash
    mkdir data
    npm i --only=prod

    npm cache clean --force
    rm -rv /tmp/v8*
}

if [ ! -f /init/splash-v0.4.0 ]; then
    splash_setup
    touch /init/splash-v0.4.0

    if [ -f /init/splash ]; then
        rm /init/splash
    fi

    ln -s /init/splash-v0.4.0 /init/splash
else
    sleep 2
fi
