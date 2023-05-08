FROM debian:10
RUN apt-get update -yq \
    && apt-get -yq install curl gnupg ca-certificates \
    && curl -L https://deb.nodesource.com/setup_18.x | bash \
    && apt-get update -yq \
    && apt-get install -yq nodejs default-mysql-client mongo-tools curl wget sudo unzip git
RUN curl https://rclone.org/install.sh |  bash
RUN mkdir -p /etc/rclone
RUN mkdir /etc/server-backup
WORKDIR /etc/server-backup
RUN npm install https://github.com/majus/server-backup
CMD npx server-backup backup
