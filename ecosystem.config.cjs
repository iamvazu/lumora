module.exports = {
  apps: [
    {
      name: 'lumora-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'lumora-worker',
      cwd: './apps/worker',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'lumora-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'lumora-admin',
      cwd: './apps/admin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
};
