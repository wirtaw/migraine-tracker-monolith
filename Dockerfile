# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm

RUN pnpm install --omit=dev

COPY . .

RUN pnpm build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm

RUN pnpm install --only=production

COPY --from=builder /app/dist ./dist

# Expose the port that the NestJS application will listen on
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "dist/main.js" ]