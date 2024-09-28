#!/bin/bash

# Extended certificate generation for development

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the root directory (one level up from scripts)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

DOMAIN=$(pass show domain_name)
CERT_DIR="$ROOT_DIR/certs"

# Create cert directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Count files to be deleted
file_count=$(find "$CERT_DIR" -type f ! -name '.gitkeep' | wc -l)

echo "This will delete $file_count file(s) (except .gitkeep) in $CERT_DIR"
echo "Files to be deleted:"
find "$CERT_DIR" -type f ! -name '.gitkeep' -print0 | while IFS= read -r -d '' file; do
    echo "  - $(basename "$file")"
done

read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo    # move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

echo "Cleaning up old certificates..."
find "$CERT_DIR" -type f ! -name '.gitkeep' -delete

# Generate root CA
echo "Generating root CA..."
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 \
    -keyout "$CERT_DIR/RootCA.key" \
    -out "$CERT_DIR/RootCA.pem" \
    -subj "/C=US/CN=Example-Root-CA"

# Generate domain certificate
echo "Generating domain certificate..."
openssl req -new -nodes -newkey rsa:2048 \
    -keyout "$CERT_DIR/localhost.key" \
    -out "$CERT_DIR/localhost.csr" \
    -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=$DOMAIN"

# Sign the certificate
echo "Signing the certificate..."
openssl x509 -req -sha256 -days 1024 \
    -in "$CERT_DIR/localhost.csr" \
    -CA "$CERT_DIR/RootCA.pem" \
    -CAkey "$CERT_DIR/RootCA.key" \
    -CAcreateserial \
    -extfile <(printf "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN") \
    -out "$CERT_DIR/localhost.crt"

echo "Certificates generated in $CERT_DIR"
echo "Don't forget to add the RootCA.pem to your browser's trusted certificates for local HTTPS to work correctly."