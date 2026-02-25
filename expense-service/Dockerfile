FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./
COPY tsconfig.json ./

# Copy core package
COPY tripaxis-core ./tripaxis-core
COPY expense-service/package*.json ./expense-service/
COPY expense-service/tsconfig.json ./expense-service/

WORKDIR /app/expense-service
RUN npm ci

# Copy source code
COPY expense-service/src ./src
COPY expense-service/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built assets
COPY --from=builder /app/expense-service/dist ./dist
COPY --from=builder /app/expense-service/node_modules ./node_modules
COPY --from=builder /app/expense-service/package.json ./

# Expose ports
EXPOSE 3001
EXPOSE 9466

CMD ["node", "dist/main"]
