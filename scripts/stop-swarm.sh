#!/bin/bash

# Define your stack name
STACK_NAME="pops-and-bops"

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to stop and leave Docker Swarm
stop_swarm() {
    echo "Stopping the stack..."
    docker stack rm $STACK_NAME

    echo "Waiting for services to stop..."
    sleep 20

    echo "Leaving Docker Swarm..."
    docker swarm leave --force

    echo "Docker Swarm has been stopped and the node has left the swarm."
}

# Main execution starts here
echo "Stopping the project and Docker Swarm..."

stop_swarm

echo "Project stopped successfully."