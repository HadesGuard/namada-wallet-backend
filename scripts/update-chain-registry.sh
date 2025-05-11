#!/bin/bash

# Set error handling
set -e

# Define paths
REGISTRY_DIR="data/chain-registry"
TEMP_DIR="/tmp/chain-registry-update"

# Create temp directory
mkdir -p $TEMP_DIR

# Download latest data
echo "Downloading latest chain registry data..."
curl -L https://github.com/cerberus-node/interchain-chain-registry/archive/refs/heads/main.zip -o $TEMP_DIR/chain-registry.zip

# Extract data
echo "Extracting data..."
unzip -o $TEMP_DIR/chain-registry.zip -d $TEMP_DIR/

# Backup current data
echo "Backing up current data..."
if [ -d "$REGISTRY_DIR" ]; then
    mv $REGISTRY_DIR "${REGISTRY_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

# Move new data
echo "Installing new data..."
mkdir -p $REGISTRY_DIR
mv $TEMP_DIR/interchain-chain-registry-main/* $REGISTRY_DIR/

# Cleanup
echo "Cleaning up..."
rm -rf $TEMP_DIR

echo "Chain registry update completed successfully!" 