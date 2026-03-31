# Use Node.js 22 as base image (required by vite, react-router, and @vitejs/plugin-react)
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files and lock files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY shared/package-lock.json ./shared/
COPY client/package*.json ./client/
COPY client/package-lock.json ./client/
COPY server/package*.json ./server/
COPY server/package-lock.json ./server/

# Install dependencies for root
RUN npm ci

# Install dependencies for shared
RUN npm ci --prefix shared

# Install dependencies for client
RUN npm ci --prefix client

# Install dependencies for server
RUN npm ci --prefix server

# Copy source code
COPY . .

# Build shared library
RUN npm run build --prefix shared

# Build client
RUN npm run build --prefix client

# Build server
RUN npm run build --prefix server

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files for server
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built server
COPY --from=base /app/server/dist ./dist

# Copy built client
COPY --from=base /app/client/dist ./client/dist

# Copy shared dist if needed
COPY --from=base /app/shared/dist ./shared/dist

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Start the server
CMD ["node", "dist/index.js"]