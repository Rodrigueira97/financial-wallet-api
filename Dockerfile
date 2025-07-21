FROM node:alpine

WORKDIR /usr/app

COPY . ./

RUN npm install

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]