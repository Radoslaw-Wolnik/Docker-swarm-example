#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping containers..."
docker-compose -f "$ROOT_DIR/docker-compose-containers.yml" down

echo "Removing unused Docker resources..."
docker system prune -f

echo "Containers stopped and unused resources removed."