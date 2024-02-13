FROM node:20-alpine

LABEL maintainer="Mina Sameh"
LABEL version="1.0"
LABEL description="Dockerfile to run 1 nodejs app"
LABEL usage="docker build -t <image-name> ."
# I love port 8000 to be honest :D
LABEL usage="docker run -p 5111:8000 <image-name>"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5111

CMD ["npm", "start"]
