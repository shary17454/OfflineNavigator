FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json .
RUN npm install

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
