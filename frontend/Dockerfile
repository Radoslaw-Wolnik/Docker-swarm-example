# Build stage
FROM node:20 AS build-stage

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the app
RUN npm run build

# Development stage
FROM node:20 AS dev-stage

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# copy the certificate, private key
COPY ssl/cert/certificate.pem /app/cert/certificate.pem
COPY ssl/cert/private-key.pem /app/cert/private-key.pem

# Expose port 5173 for development purposes
EXPOSE 5173

# Command to run the development server
CMD ["npm", "run", "dev"]

# Production stage
FROM nginx:alpine AS prod-stage

# Copy the built app from the build-stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# copy the certificate, private key
COPY ssl/cert/certificate.pem /app/cert/certificate.pem
COPY ssl/cert/private-key.pem /app/cert/private-key.pem

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 443

# Command to run the nginx server
CMD ["nginx", "-g", "daemon off;"]
