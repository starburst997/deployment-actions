FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY tsconfig.json ./

# Build everything
RUN npm run all

# Copy entrypoint scripts
COPY scripts/entrypoint.sh /entrypoint.sh
COPY scripts/post-entrypoint.sh /post-entrypoint.sh
RUN chmod +x /entrypoint.sh /post-entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]