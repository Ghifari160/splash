#!/bin/bash

while : ; do
    [[ -f "/init/splash" ]] && break
    echo "Waiting for splash installation"
    sleep 5
done

cd /var/www/splash
npm run start
