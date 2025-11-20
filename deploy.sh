#!/bin/bash

# DHL Payment App - Quick Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file from .env.example and configure it"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production=false

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run db:push

# Create logs directory
mkdir -p logs

# Restart PM2 process
if pm2 describe dhl-payment-app > /dev/null 2>&1; then
    echo -e "${YELLOW}♻️  Restarting application...${NC}"
    pm2 restart dhl-payment-app
else
    echo -e "${YELLOW}🎬 Starting application for the first time...${NC}"
    pm2 start ecosystem.config.cjs
    pm2 save
fi

# Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}View logs with: pm2 logs dhl-payment-app${NC}"
echo -e "${GREEN}Application URL: http://95.179.171.63${NC}"
