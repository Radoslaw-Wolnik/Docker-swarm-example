#!/bin/bash

# Array of scripts that need executable permissions
scripts=(
    "backup_recover_secrets.sh"
    "check_secrets.sh"
    "generate_dev_certs_extended.sh"
    "generate_dev_certs_simple.sh"
    "local_secrets.sh"
    "manage_secrets.sh"
    "rotate_secrets_cron.sh"
    "start-containers.sh"
    "start-swarm.sh"
    "stop-containers.sh"
    "stop-swarm.sh"
    "../backend/mongo/init-mongo-containers.sh"
    "../backend/mongo/init-mongo-swarm.sh"
)

# Function to set executable permissions
set_executable() {
    if [ -f "$1" ]; then
        chmod +x "$1"
        echo "Set executable permissions for $1"
    else
        echo "Warning: $1 not found"
    fi
}


# Function to set executable permissions
set_executable() {
    if [ -f "$1" ]; then
        chmod +x "$1"
        echo "Set executable permissions for $1"
    else
        echo "Warning: $1 not found"
    fi
}

# Main execution
echo "Setting executable permissions for project scripts..."

# Change to the scripts directory
cd "$(dirname "$0")" || exit

for script in "${scripts[@]}"; do
    set_executable "$script"
done

echo "Permissions update completed."