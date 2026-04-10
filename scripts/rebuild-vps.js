const { Client } = require('C:/Users/Pichau/AppData/Local/Temp/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected. Building...');
  conn.exec('source /root/.nvm/nvm.sh && export PATH=$PATH:/root/.local/share/pnpm && cd ~/forja-ai && pnpm build 2>&1 && pm2 restart ecosystem.config.js 2>&1 && echo "=== DEPLOY OK ===" && pm2 status', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      conn.end();
    });
  });
}).on('error', e => console.error('SSH Error:', e.message))
.connect({ host: '76.13.121.80', port: 22, username: 'root', password: 'H@r2Mdo9jnCnuNnX,h4r' });
