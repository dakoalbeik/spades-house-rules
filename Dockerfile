# Use Node.js 18 as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code
COPY . .

# Build shared library
RUN npm run build --prefix shared

# Build client
RUN npm run build --prefix client

# Build server
RUN npm run build --prefix server

# Production stage
FROM node:18-alpine AS production

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
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Start the server
CMD ["node", "dist/index.js"]