FROM ubuntu:18.04 AS base

RUN set -x && \
    apt update && \
    apt upgrade -y && \
    apt autoremove -y && \
    apt install --no-install-recommends --no-install-suggests -y curl ca-certificates && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir /init

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

################
##  /dev/con  ##
################
FROM base AS dev

ENV SPLASH_INSTANCE_ID "/dev/con"

COPY src/server /var/www/splash/src/server
COPY test /var/www/splash/test
COPY default /var/www/splash/default

COPY package-lock.json /var/www/splash/package-lock.json
COPY package.json /var/www/splash/package.json

WORKDIR /var/www/splash
RUN mkdir data
RUN npm i --only=prod && npm cache clean --force

VOLUME [ "/var/www/splash/data" ]

EXPOSE 8080

ENTRYPOINT [ "node", "src/server" ]

################
## Production ##
################
FROM base

LABEL org.opencontainers.image.authors="GHIFARI160 <ghifari@ghifari160.com>"

RUN curl -sL https://projects.gassets.space/splash/v0.4.0/splash-v0.4.0.tar.gz | tar -zxvf - -C /var/www/splash --overwrite

WORKDIR /var/www/splash
RUN mkdir data
RUN npm i --only=prod && npm cache clean --force

VOLUME [ "/var/www/splash/data" ]

EXPOSE 8080

ENTRYPOINT [ "node", "src/server" ]
