# Multi-stage build for React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL=https://api.example.com
ARG VITE_ENABLE_ANALYTICS=true
ARG VITE_ENABLE_DEBUG_LOGGING=false
ARG NODE_ENV=production
ARG APP_PORT=8004

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS
ENV VITE_ENABLE_DEBUG_LOGGING=$VITE_ENABLE_DEBUG_LOGGING
ENV NODE_ENV=$NODE_ENV
ENV APP_PORT=$APP_PORT

# Build the application
RUN npm run build

# Production stage - serve static files
FROM node:18-alpine

WORKDIR /app

# Install serve package globally for serving static files
RUN npm install -g serve

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose configurable port
EXPOSE $APP_PORT

# Health check on configurable port
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$APP_PORT/ || exit 1

# Start serve on configurable port
CMD sh -c "serve -s dist -l $APP_PORT"