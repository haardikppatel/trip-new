FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./
COPY tsconfig.json ./

# Copy core package
COPY tripaxis-core ./tripaxis-core
COPY policy-service/package*.json ./policy-service/
COPY policy-service/tsconfig.json ./policy-service/

WORKDIR /app/policy-service
RUN npm ci

# Copy source code
COPY policy-service/src ./src
COPY policy-service/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built assets
COPY --from=builder /app/policy-service/dist ./dist
COPY --from=builder /app/policy-service/node_modules ./node_modules
COPY --from=builder /app/policy-service/package.json ./

# Expose ports
EXPOSE 50051
EXPOSE 9465

CMD ["node", "dist/main"]
