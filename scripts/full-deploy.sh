#!/bin/bash
set -e

echo "=========================================="
echo "  FORJA.AI — Deploy Completo na VPS"
echo "=========================================="

# 1. Atualizar sistema
echo "[1/9] Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar essenciais
echo "[2/9] Instalando dependências..."
apt install -y curl git build-essential nginx ufw fail2ban htop

# 3. Node.js 20 via nvm
echo "[3/9] Instalando Node.js 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# 4. pnpm + PM2
echo "[4/9] Instalando pnpm e PM2..."
npm install -g pnpm pm2

# 5. Docker + Redis
echo "[5/9] Instalando Docker + Redis..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

mkdir -p /root/forja-ai
cat > /root/forja-ai/docker-compose.yml <<'DEOF'
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
cd /root/forja-ai && docker compose up -d

# 6. Clonar projeto
echo "[6/9] Clonando projeto do GitHub..."
cd /root
rm -rf forja-ai-temp
git clone https://github.com/melodnl/forja-ai.git forja-ai-temp
cp -r forja-ai-temp/* forja-ai-temp/.* forja-ai/ 2>/dev/null || true
rm -rf forja-ai-temp
cd forja-ai

# 7. Criar .env.local
echo "[7/9] Configurando variáveis de ambiente..."
cat > .env.local <<'ENVEOF'
NEXT_PUBLIC_APP_URL=http://76.13.121.80
NODE_ENV=production

NEXT_PUBLIC_SUPABASE_URL=https://wwmusjgihhsjgcxxkqwb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bXVzamdpaGhzamdjeHhrcXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODIzMDAsImV4cCI6MjA5MTE1ODMwMH0.tX8WwijplSkXAtJw-r94NawL8itYrJTI_OTg1iQoS08
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bXVzamdpaGhzamdjeHhrcXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MjMwMCwiZXhwIjoyMDkxMTU4MzAwfQ.eVhc0OzzS5XEEWv2iCgbHR1VgvO5cb19utBv7g0ALaI

REDIS_URL=redis://localhost:6379

OPENROUTER_API_KEY=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
KIE_API_KEY=edcaa38e3d3b14c187d9a707a79dc01b
VENICE_API_KEY=VENICE_ADMIN_KEY_b4qaqedy9otlNHHRIKjL0wE_m_QoYbuUpa0YDwS_aB

ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
ELEVENLABS_API_KEY=
FISH_AUDIO_API_KEY=
ENCRYPTION_KEY=
ENVEOF

# 8. Build
echo "[8/9] Instalando dependências e buildando..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pnpm install
pnpm build

# 9. Nginx + PM2
echo "[9/9] Configurando nginx e PM2..."

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

ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

cd /root/forja-ai
cat > ecosystem.config.js <<'PEOF'
module.exports = {
  apps: [{
    name: 'forja-web',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/root/forja-ai',
    env: { NODE_ENV: 'production', PORT: 3000 },
    instances: 1,
    autorestart: true,
    max_memory_restart: '2G',
  }],
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
