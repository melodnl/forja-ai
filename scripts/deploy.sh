#!/bin/bash
set -e

echo "=== Forja.ai — Deploy ==="

cd ~/forja-ai

# Pull latest
git pull origin main

# Instalar deps
pnpm install --frozen-lockfile

# Build
pnpm build

# Restart
pm2 restart ecosystem.config.js

echo ""
echo "=== Deploy concluído! ==="
pm2 status
