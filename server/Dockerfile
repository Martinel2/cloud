# Node.js 20버전 slim 이미지 사용
FROM node:20-slim

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start"]
