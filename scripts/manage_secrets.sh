#!/bin/bash

# Secret Management Script for Docker Swarm

# Parse command line arguments
NO_CRON=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-cron) NO_CRON=true ;;
        rotate_secrets) rotate_secrets; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# remove_cron_job() {
#     crontab -l | grep -v "rotate_secrets_cron.sh" | crontab -
#     echo "Cron job for secret rotation has been removed."
# }

# Ensure pass is installed
if ! command -v pass &> /dev/null; then
    echo "pass is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y pass
fi

# Check if GPG key exists, if not, create one
if ! gpg --list-secret-keys | grep -q "Production Secrets"; then
    echo "Generating GPG key..."
    gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: Production Secrets
Name-Email: admin@yourdomain.com
Expire-Date: 0
%no-protection
EOF
fi

# Initialize pass password store if not already initialized
if [ ! -d "$HOME/.password-store" ]; then
    echo "Initializing pass password store..."
    pass init "Production Secrets"
fi

# Function to add or update a secret
add_secret() {
    local secret_name=$1
    local secret_value=$2
    echo -n "$secret_value" | pass insert -e -f "$secret_name"
    # echo -n "$secret_value" | pass insert -e -m -f "$secret_name"
    # printf "%s\n%s\n" "$secret_value" "$secret_value" | pass insert -e -m -f "$secret_name"
    if [ $? -eq 0 ]; then
        echo "Secret '$secret_name' added successfully."
    else
        echo "Failed to add secret '$secret_name'."
    fi
}

# Function to generate a random string
generate_random_string() {
    openssl rand -base64 32 | tr -d /=+ | cut -c -${1:-32}
}

# Add secrets to pass
add_secret "db_root_username" "root"
add_secret "db_root_password" "$(generate_random_string 16)"
add_secret "db_name" "mydatabase"
add_secret "db_user" "myuser"
add_secret "db_password" "$(generate_random_string 16)"
add_secret "jwt_secret" "$(generate_random_string 32)"
add_secret "encryption_key" "$(openssl rand -base64 32)"

# Email configuration
add_secret "email_host" "smtp.example.com"
add_secret "email_port" "587"
add_secret "email_user" "user@example.com"
add_secret "email_password" "defaultpassword"
add_secret "email_from" "noreply@example.com"

# Domain and rate limit configuration
add_secret "domain_name" "localhost"
add_secret "rate_limit_average" "100"
add_secret "rate_limit_burst" "50"

# Traefik authentication
add_secret "traefik_auth" "admin:$(htpasswd -nb -B admin password | cut -d ":" -f 2)"



# Apply local secrets if available
if [ -f "./local_secrets.sh" ]; then
    echo "Applying local secrets..."
    source "./local_secrets.sh"
fi

# Set up a cron job to rotate secrets monthly if in production (without --no-cron flag)
if [ "$NO_CRON" = false ]; then
    # Get the absolute path of the rotate_secrets_cron.sh script
    ROTATE_SECRETS_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rotate_secrets_cron.sh"
    
    # Ensure the rotate_secrets_cron.sh script is executable
    chmod +x "$ROTATE_SECRETS_SCRIPT"
    
    # Add the cron job
    (crontab -l 2>/dev/null; echo "0 0 1 * * $ROTATE_SECRETS_SCRIPT >> /var/log/secret_rotation.log 2>&1") | crontab -
    
    echo "Cron job for monthly secret rotation has been set up."
else
    echo "Cron job setup skipped due to --no-cron flag."
fi


echo "Secret management setup complete"


# gpg --list-secret-keys

# List all secrets to verify
echo "Listing all secrets:"
pass ls