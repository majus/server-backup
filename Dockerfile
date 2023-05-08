FROM node:18-slim
RUN apt-get update -yq \
    && apt-get upgrade -yq \
    && apt-get install -yq default-mysql-client wget git \
    && apt-get autoremove -yq \
    && apt-get clean -yq
RUN wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-100.7.0.deb -O mongo-tools.deb \
    && apt install -y --fix-broken ./mongo-tools.deb \
    && rm -f mongo-tools.deb
RUN wget https://downloads.rclone.org/v1.62.2/rclone-v1.62.2-linux-amd64.deb -O rclone.deb \
    && apt install -y --fix-broken ./rclone.deb \
    && rm -f rclone.deb
RUN npm install -g https://github.com/majus/server-backup
CMD npx server-backup backup

