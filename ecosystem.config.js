module.exports = {
  apps: [
    {
      name: 'forja-web',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/ubuntu/forja-ai',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G',
    },
    {
      name: 'forja-workers',
      script: 'pnpm',
      args: 'tsx workers/index.ts',
      cwd: '/home/ubuntu/forja-ai',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
