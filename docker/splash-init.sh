#!/bin/bash

while : ; do
    [[ -f "/init/splash" ]] && break
    echo "Waiting for splash installation"
    sleep 5
done

trap 'kill -INT ${child_pid}; wait ${child_pid}' SIGINT
trap 'kill -TERM ${child_pid}; wait ${child_pid}' SIGTERM
trap 'kill -USR2 ${child_pid}; wait ${child_pid}' SIGUSR2

cd /var/www/splash
node src/server &

child_pid=$!

wait ${child_pid}
