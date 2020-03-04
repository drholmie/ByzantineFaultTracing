FROM ubuntu:18.04
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN sh ./setup.sh
RUN npm install
EXPOSE 8080
CMD ["node","--perf-basic-prof","server.js"]

