FROM node:20-slim

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# serve 패키지로 정적 파일 서비스
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build"]
