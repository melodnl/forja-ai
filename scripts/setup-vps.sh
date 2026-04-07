#!/bin/bash
set -e

echo "=== Forja.ai — Setup VPS (Ubuntu 24.04) ==="

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar essenciais
sudo apt install -y curl git build-essential nginx ufw fail2ban htop

# Node.js 20 LTS via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Docker + Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Redis via Docker
cd ~/forja-ai
docker compose up -d

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Certbot pra SSL
sudo apt install -y certbot python3-certbot-nginx

# nginx config
sudo tee /etc/nginx/sites-available/forja <<'EOF'
server {
    listen 80;
    server_name forja.ai www.forja.ai;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/forja /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== VPS pronto! ==="
echo "Próximos passos:"
echo "  1. cd ~/forja-ai && pnpm install && pnpm build"
echo "  2. pm2 start ecosystem.config.js"
echo "  3. sudo certbot --nginx -d forja.ai -d www.forja.ai"
echo ""
