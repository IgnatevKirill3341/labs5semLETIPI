#!/bin/bash

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=SocialNetwork/CN=localhost"

echo "SSL certificates generated successfully!"
echo "Certificate: ssl/server.crt"
echo "Private key: ssl/server.key"

