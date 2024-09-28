#!/bin/bash

# List of required secrets
REQUIRED_SECRETS=(
    "domain_name"
    "letsencrypt_email"
    "traefik_auth"
    "rate_limit_average"
    "rate_limit_burst"
    "db_root_username"
    "db_root_password"
    "db_name"
    "db_user"
    "db_password"
    "jwt_secret"
    "encryption_key"
    "email_host"
    "email_port"
    "email_user"
    "email_password"
    "email_from"
)

# Maximum age for secrets in seconds (30 days)
MAX_AGE=$((30 * 24 * 60 * 60))

# Function to check secret age
check_secret_age() {
    local secret_name="$1"
    local secret_age=$(pass age "$secret_name")
    if [ $secret_age -gt $MAX_AGE ]; then
        echo "Warning: Secret $secret_name is older than 30 days."
        return 1
    fi
    return 0
}

# Check for each required secret
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! pass show "$secret" &> /dev/null; then
        echo "Error: Secret not found: $secret"
        exit 1
    else
        echo "Secret found: $secret"
        if ! check_secret_age "$secret"; then
            read -p "Do you want to continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
done

echo "All required secrets are present and have been checked for age."

# Check GPG key expiration
GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep sec | awk '{print $2}' | awk -F'/' '{print $2}')
GPG_KEY_EXPIRATION=$(gpg --list-keys --with-colons $GPG_KEY_ID | grep ^pub | cut -d: -f7)

if [ "$GPG_KEY_EXPIRATION" != "" ]; then
    CURRENT_TIME=$(date +%s)
    if [ $GPG_KEY_EXPIRATION -lt $CURRENT_TIME ]; then
        echo "Warning: Your GPG key has expired. Please renew it."
        exit 1
    elif [ $((GPG_KEY_EXPIRATION - CURRENT_TIME)) -lt $((30 * 24 * 60 * 60)) ]; then
        echo "Warning: Your GPG key will expire in less than 30 days. Consider renewing it soon."
    fi
fi

echo "GPG key check completed."