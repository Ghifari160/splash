FROM ubuntu:18.04

LABEL maintainer "GHIFARI160 <ghifari@ghifari160.com>"

RUN set -x && \
    apt update && \
    apt upgrade -y && \
    apt autoremove -y && \
    apt install --no-install-recommends --no-install-suggests -y curl ca-certificates && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir /init

################
## Supervisor ##
################
RUN set -x && \
    apt update && \
    apt install --no-install-recommends --no-install-suggests -y supervisor && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

################
##   Node.JS  ##
################
ENV NODE_ENV production

RUN set -x && \
    addgroup --system --gid 104 node && \
    adduser --system --ingroup node --no-create-home --home /nonexistent --gecos "node user" --shell /bin/false --uid 104 node && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash && \
    apt update && \
    apt install --no-install-recommends --no-install-suggests -y nodejs && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm i -g npm && \
    npm cache clean --force

################
##   Splash   ##
################
RUN mkdir -p /var/www/splash
RUN chown node:node /var/www/splash
RUN chmod 755 /var/www/splash

# Splash copy
# Uncomment for production
# RUN curl -sL https://projects.gassets.space/splash/v0.4.0/splash-v0.4.0.tar.gz | tar -zxvf - -C /var/www/splash --overwrite
# Uncomment for /dev/con
ADD splash.tar.gz /var/www/splash

WORKDIR /var/www/splash
RUN mkdir data
RUN npm i --only=prod && npm cache clean --force

COPY supervisor-splash.conf /etc/supervisor/conf.d/splash.conf
COPY splash-init.sh /init/splash-init.sh

VOLUME [ "/var/www/splash/data" ]

EXPOSE 8080

CMD [ "/usr/bin/supervisord" ]
