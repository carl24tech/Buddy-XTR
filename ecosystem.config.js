/**module.exports = {
  apps: [{
    name: 'buddy-xtr',
    script: './module.js',
    interpreter: 'node',
    interpreter_args: '--experimental-modules',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '800M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
    kill_timeout: 10000,
    listen_timeout: 5000,
    shutdown_with_message: true,
    wait_ready: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TZ: 'UTC'
    },
    env_development: {
      NODE_ENV: 'development',
      DEBUG: 'true'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    merge_logs: true,
    // Session recovery arguments
    args: process.argv.slice(2).includes('--fresh') ? '--fresh' : ''
  }]
};
**/
