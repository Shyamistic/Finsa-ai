# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (including typescript and types)
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Install ONLY production dependencies
RUN npm ci --only=production
# Copy only the compiled code from the builder stage
COPY --from=builder /app/dist ./dist
# Copy SQL schema and migration files (not compiled by TypeScript)
COPY --from=builder /app/src/db/schema.sql ./src/db/schema.sql
COPY --from=builder /app/src/db/migrations ./src/db/migrations
EXPOSE 4000
CMD ["node", "dist/server.js"]
