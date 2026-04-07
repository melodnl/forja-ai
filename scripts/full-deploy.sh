#!/bin/bash
set -e

echo "=========================================="
echo "  FORJA.AI — Deploy Completo na VPS"
echo "=========================================="

# 1. Atualizar sistema
echo "[1/8] Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar essenciais
echo "[2/8] Instalando dependências..."
apt install -y curl git build-essential nginx ufw fail2ban htop

# 3. Node.js 20 via nvm
echo "[3/8] Instalando Node.js 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# 4. pnpm + PM2
echo "[4/8] Instalando pnpm e PM2..."
npm install -g pnpm pm2

# 5. Docker + Redis
echo "[5/8] Instalando Docker + Redis..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

mkdir -p /root/forja-ai
cd /root/forja-ai

cat > docker-compose.yml <<'DEOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: forja-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - ./redis-data:/data
    command: redis-server --appendonly yes
DEOF

docker compose up -d

# 6. Clonar/atualizar projeto
echo "[6/8] Baixando projeto..."
cd /root
if [ -d "forja-ai/.git" ]; then
  cd forja-ai && git pull
else
  # Se não tem git remote, vamos criar o projeto direto
  cd forja-ai
fi

# 7. Instalar deps e buildar
echo "[7/8] Instalando dependências e buildando..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pnpm install
pnpm build

# 8. Nginx + PM2
echo "[8/8] Configurando nginx e PM2..."

cat > /etc/nginx/sites-available/forja <<'NEOF'
server {
    listen 80;
    server_name _;

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
NEOF

ln -sf /etc/nginx/sites-available/forja /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# PM2
cat > ecosystem.config.js <<'PEOF'
module.exports = {
  apps: [
    {
      name: 'forja-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/root/forja-ai',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G',
    },
  ],
};
PEOF

pm2 stop all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "=========================================="
echo "  DEPLOY COMPLETO!"
echo "  Acesse: http://76.13.121.80"
echo "=========================================="
