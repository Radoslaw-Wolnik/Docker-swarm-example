#!/bin/bash

BACKUP_DIR="$HOME/secret_backups"
PASSWORD_STORE_DIR="${PASSWORD_STORE_DIR:-$HOME/.password-store}"
GPG_DIR="$HOME/.gnupg"

# Function to backup secrets and GPG keys
backup_secrets() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/secrets_backup_$timestamp.tar.gz.gpg"

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Backup password store and GPG directory
    tar -czf - -C "$HOME" ".password-store" ".gnupg" | \
    gpg --symmetric --cipher-algo AES256 -o "$backup_file"

    echo "Backup created: $backup_file"
    echo "Please store this file securely and separately from your other backups."
}

# Function to restore secrets and GPG keys
restore_secrets() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "Backup file not found: $backup_file"
        exit 1
    fi

    # Decrypt and extract the backup
    gpg -d "$backup_file" | tar -xzf - -C "$HOME"

    echo "Secrets and GPG keys restored from $backup_file"
    echo "Please restart any applications that use these secrets."
}

# Main script logic
case "$1" in
    backup)
        backup_secrets
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <backup_file>"
            exit 1
        fi
        restore_secrets "$2"
        ;;
    *)
        echo "Usage: $0 {backup|restore <backup_file>}"
        exit 1
        ;;
esac