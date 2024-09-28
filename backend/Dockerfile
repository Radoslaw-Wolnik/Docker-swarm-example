# Base stage
FROM node:20 AS base

# Set working directory inside the container
WORKDIR /app

# Update npm to the latest version and clear npm cache
RUN npm install -g npm@latest && npm cache clean --force

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Development stage
FROM base AS development

# Install ts globaly
RUN npm install -g tsx@latest typescript@latest


# Copy additional development-specific configuration files
# COPY nodemon.json .
# or insted in volumes in docekr-compose

# Make uploads dir in development setup
RUN mkdir -p /app/uploads

# Expose port 5000 for development
EXPOSE 5000

# Command to run the application in development mode
#CMD ["npm", "run", "devstart"]
# Use ts-node-dev for development
#CMD ["npx", "nodemon", "--exec", "node", "--loader", "ts-node/esm", "src/server.ts"]
CMD ["npm", "run", "dev"]


# Build stage
FROM base AS build

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy package.json and package-lock.json for production install
COPY --from=build /app/package*.json ./

# Copy compiled JavaScript files
COPY --from=build /app/dist ./dist

# Install production dependencies
RUN npm ci --only=production

# Make uploads dir in production
RUN mkdir -p /app/uploads

# Expose port for production
EXPOSE 5000

# Set environment variable for production
ENV NODE_ENV=production

# Command to run the application in production mode
CMD ["npm", "run", "start"]
# CMD ["node", "dist/server.js"]