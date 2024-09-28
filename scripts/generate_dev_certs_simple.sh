#!/bin/bash

# Simple certificate generation for development

CERT_DIR="./certs"
DOMAIN=$(pass show domain_name)

# Create cert directory if it doesn't exist
mkdir -p "$CERT_DIR"

echo "Generating simple self-signed certificate for $DOMAIN..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/localhost.key" \
    -out "$CERT_DIR/localhost.crt" \
    -subj "/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN"

echo "Self-signed certificate generated in $CERT_DIR"
echo "You may need to add an exception in your browser to trust this certificate."