#!/bin/bash

STACK_NAME="pops-and-bops"
SECRETS_DIR="/run/secrets"

# Function to generate a random string
generate_random_string() {
    openssl rand -base64 32 | tr -d /=+ | cut -c -${1:-32}
}

# Function to update a Docker secret
update_docker_secret() {
    local secret_name=$1
    local new_value=$2
    echo "$new_value" | docker secret create "${secret_name}_new" -
    docker service update --secret-rm "$secret_name" --secret-add "source=${secret_name}_new,target=$secret_name" ${STACK_NAME}_backend
    docker secret rm "$secret_name"
    docker secret rm "${secret_name}_new"
}

# Rotate secrets
rotate_secrets() {
    local secrets_to_rotate=("db_root_password" "db_password" "jwt_secret" "encryption_key" "email_password" "traefik_auth")

    # Store the current encryption key as OLD_ENCRYPTION_KEY
    OLD_ENCRYPTION_KEY=$(docker secret inspect --format '{{.Spec.Data}}' encryption_key | base64 -d)

    for secret in "${secrets_to_rotate[@]}"; do
        local new_value
        case "$secret" in
            "db_root_password"|"db_password"|"email_password")
                new_value=$(generate_random_string 16)
                ;;
            "jwt_secret"|"encryption_key")
                new_value=$(generate_random_string 32)
                ;;
            "traefik_auth")
                traefik_password=$(generate_random_string 16)
                new_value=$(htpasswd -nb -B admin "$traefik_password")
                ;;
        esac

        update_docker_secret "$secret" "$new_value"

        if [ "$secret" = "encryption_key" ]; then
            NEW_ENCRYPTION_KEY="$new_value"
        fi
    done

    # Update the backend service with the new and old encryption keys
    docker service update \
        --env-add OLD_ENCRYPTION_KEY="$OLD_ENCRYPTION_KEY" \
        --env-add ENCRYPTION_KEY="$NEW_ENCRYPTION_KEY" \
        --env-add ROTATION_IN_PROGRESS=true \
        ${STACK_NAME}_backend

    # Start the rotation process
    docker exec $(docker ps -q -f name=${STACK_NAME}_backend) npm run start-rotation

    echo "Secret rotation initiated. Check logs for progress."
}

# Check rotation status
check_rotation_status() {
    docker exec $(docker ps -q -f name=${STACK_NAME}_backend) npm run check-rotation
}

# Cleanup after rotation
cleanup_rotation() {
    docker exec $(docker ps -q -f name=${STACK_NAME}_backend) npm run cleanup-rotation
    
    # Remove the OLD_ENCRYPTION_KEY from the environment
    docker service update --env-rm OLD_ENCRYPTION_KEY ${STACK_NAME}_backend
}

# Main execution
rotate_secrets
sleep 60  # Wait for a minute to allow rotation to start
check_rotation_status

# Wait for rotation to complete (you might want to implement a more sophisticated checking mechanism)
while [[ $(check_rotation_status | grep "inProgress: true") ]]; do
    sleep 300  # Check every 5 minutes
    check_rotation_status
done

cleanup_rotation