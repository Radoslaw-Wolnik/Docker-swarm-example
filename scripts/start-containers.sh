#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of the script and the root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse command line arguments
if [ "$1" == "--dev" ]; then
    ENV="development"
    export CERT_RESOLVER=""
elif [ "$1" == "--prod" ]; then
    ENV="production"
    export CERT_RESOLVER="le"
else
    echo "Usage: $0 [--dev|--prod]"
    exit 1
fi

# Build Docker images
echo "Building mongo image..."
docker build -t mongo-image:6.0 "$ROOT_DIR/backend/mongo" 2>&1 | tee "$SCRIPT_DIR/logs/mongo_build.log"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "mongo build failed. Check mongo_build.log for details."
    exit 1
fi

echo "Building backend image..."
docker build -t backend-image:latest --target $ENV "$ROOT_DIR/backend" 2>&1 | tee "$SCRIPT_DIR/logs/backend_build.log"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Backend build failed. Check backend_build.log for details."
    exit 1
fi

echo "Building frontend image..."
docker build -t frontend-image:latest --target $ENV "$ROOT_DIR/frontend" 2>&1 | tee "$SCRIPT_DIR/logs/frontend_build.log"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Frontend build failed. Check frontend_build.log for details."
    exit 1
fi


# Start the containers
echo "Starting containers..."
docker-compose -f "$ROOT_DIR/docker-compose-containers.yml" up -d
# --build --no-cache

echo "Containers started successfully."