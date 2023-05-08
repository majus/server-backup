FROM debian:10
RUN apt-get update -yq \
    && apt-get -yq install curl gnupg ca-certificates \
    && curl -L https://deb.nodesource.com/setup_18.x | bash \
    && apt-get update -yq \
    && apt-get install -yq nodejs default-mysql-client mongo-tools curl wget sudo unzip
RUN curl https://rclone.org/install.sh |  bash
RUN mkdir -p /etc/rclone
RUN npm install server-backup -g
RUN mkdir /etc/server-backup
WORKDIR /etc/server-backup
CMD npx server-backup backup