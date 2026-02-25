FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./
COPY tsconfig.json ./

# Copy core package
COPY tripaxis-core ./tripaxis-core
COPY travel-service/package*.json ./travel-service/
COPY travel-service/tsconfig.json ./travel-service/

WORKDIR /app/travel-service
RUN npm ci

# Copy source code
COPY travel-service/src ./src
COPY travel-service/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built assets
COPY --from=builder /app/travel-service/dist ./dist
COPY --from=builder /app/travel-service/node_modules ./node_modules
COPY --from=builder /app/travel-service/package.json ./

# Expose ports
EXPOSE 3000
EXPOSE 9464

CMD ["node", "dist/main"]
