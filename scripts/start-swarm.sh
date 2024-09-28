#!/bin/bash

# Define your stack name
STACK_NAME="pops-and-bops"

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Function to manage secrets
manage_secrets() {
    if [ "$ENV" == "development" ]; then
        ./manage_secrets.sh --no-cron
    else
        ./manage_secrets.sh
    fi
    ./local_secrets.sh
}

# Function to handle certificates
handle_certificates() {
    if [ "$ENV" == "development" ]; then
        ./generate_dev_certs_extended.sh # can be changed ot ./generate_dev_certs_simple.sh
    else
        # Ensure Let's Encrypt setup is in place
        # This might involve checking for existing certs and renewing if necessary
        echo "Ensuring Let's Encrypt certificates are in place..."
        # Add your Let's Encrypt certificate check/renewal logic here
    fi
}


# Initialize Docker Swarm 
init_swarm() {
    if ! docker info | grep -q 'Swarm: active'; then
        echo "Initializing Docker Swarm mode..."
        docker swarm init
    else
        echo "Docker Swarm is already active."
    fi
}

# Function to create Docker secrets
create_docker_secrets() {
    echo "Creating Docker secrets..."
    pass ls | while read -r line; do
        # Skip the first line (Password Store)
        if [[ "$line" == "Password Store" ]]; then
            continue
        fi
        
        # Remove leading tree characters and spaces
        secret_name=$(echo "$line" | sed 's/^[│├└─ ]\+//')
        
        echo "Creating Docker secret: $secret_name"
        if pass show "$secret_name" > /dev/null 2>&1; then
            docker secret rm "$secret_name" 2>/dev/null
            pass show "$secret_name" | docker secret create "$secret_name" -
        else
            echo "Error: Secret '$secret_name' not found in the password store."
        fi
    done
}

# Main execution starts here

echo "Starting project in $ENV mode..."

# Manage secrets
manage_secrets

# Handle certificates
handle_certificates

# Initialize Docker Swarm
init_swarm

# Create Docker secrets
create_docker_secrets

# Build Docker images
echo "Building mongo image..."
docker build -t mongo-image:6.0 "$SCRIPT_DIR/../backend/mongo" 2>&1 | tee ./logs/mongo_build.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "mongo build failed. Check mongo_build.log for details."
    exit 1
fi

echo "Building backend image..."
docker build -t backend-image:latest --target $ENV "$SCRIPT_DIR/../backend" 2>&1 | tee ./logs/backend_build.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Backend build failed. Check backend_build.log for details."
    exit 1
fi

echo "Building frontend image..."
docker build -t frontend-image:latest --target $ENV "$SCRIPT_DIR/../frontend" 2>&1 | tee ./logs/frontend_build.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Frontend build failed. Check frontend_build.log for details."
    exit 1
fi


# Build Docker images simplified
# docker build -t backend-image:latest --target $ENV "$SCRIPT_DIR/../backend"
# docker build -t frontend-image:latest --target $ENV "$SCRIPT_DIR/../frontend"


# Create networks
# docker network create --driver overlay frontend-network attachable: true
# docker network create --driver overlay backend-network attachable: true

# Deploy the stack
echo "Deploying the stack..."
export NODE_ENV=$ENV
# docker stack deploy -c "$SCRIPT_DIR/../docker-compose.yml" $STACK_NAME
# with stack_name as global var
STACK_NAME=$STACK_NAME docker stack deploy -c "$SCRIPT_DIR/../docker-compose.yml" $STACK_NAME

echo "Waiting for services to start..."
sleep 10

echo "Deployed services:"
docker stack services $STACK_NAME

DOMAIN_NAME=$(pass show domain_name)
echo "Access your services at:"
echo "Frontend: https://${DOMAIN_NAME}"
echo "Backend API: https://${DOMAIN_NAME}/api"

echo "Service status:"
docker service ls --filter name=${STACK_NAME}

echo "Deployed services:"
docker stack services $STACK_NAME


# logging for the debugining
DOMAIN_NAME=$(pass show domain_name)
echo "Access your services at:"
echo "Frontend: https://${DOMAIN_NAME}"
echo "Backend API: https://${DOMAIN_NAME}/api"

echo "Service status:"
docker service ls --filter name=${STACK_NAME}

echo "Detailed information for frontend service:"
docker service ps ${STACK_NAME}_frontend --no-trunc

echo "Logs for frontend service:"
docker service logs ${STACK_NAME}_frontend

# echo "Logs for Traefik service:"
# docker service logs ${STACK_NAME}_reverse-proxy

# Add these lines for additional debugging
# echo "Checking Traefik configuration:"
# docker exec $(docker ps -q -f name=reverse-proxy) traefik show-config


# If you need to troubleshoot, you can get more detailed information about a specific service
# echo "Detailed information for backend service:"
# docker service ps ${STACK_NAME}_backend

# to restart the stack
# STACK_NAME=pops-and-bops docker stack deploy -c docker-compose.yml pops-and-bops
#  docker service rm pops-and-bops_mongo
# check the task status
# docker service ps pops-and-bops_mongo --no-trunc
# check the task
# docker service logs pops-and-bops_mongo
# check containers
# docker ps -a


# prune cach from dokcer build
# docker builder prune
