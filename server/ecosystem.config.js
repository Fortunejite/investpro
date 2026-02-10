module.exports = {
  apps: [
    {
      name: 'investment-site-server',
      script: './dist/index.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      watch: false,
    },
    {
      name: 'investment-site-position-worker',
      script: './dist/queues/workers/position.worker.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
      kill_timeout: 120_000,
      watch: false,
    },
    {
      name: 'investment-site-email-worker',
      script: './dist/queues/workers/email.worker.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
      kill_timeout: 30000,
      watch: false,
    },
    {
      name: 'investment-site-signal-worker',
      script: './dist/queues/workers/signal.worker.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
      kill_timeout: 30000,
      watch: false,
    },
  ],
};
