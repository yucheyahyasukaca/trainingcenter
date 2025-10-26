# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# Copy only production files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Change ownership to nodeuser
RUN chown -R nodeuser:nodeuser /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]

