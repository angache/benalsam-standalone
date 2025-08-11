module.exports = {
  name: 'benalsam-admin-ui',
  script: 'dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3003,
    HOST: '0.0.0.0'
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3003,
    HOST: '0.0.0.0'
  },
  // Logging
  log_file: './logs/combined.log',
  out_file: './logs/out.log',
  error_file: './logs/error.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  
  // Restart policy
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '1G',
  
  // Monitoring
  watch: false,
  ignore_watch: ['node_modules', 'logs', 'dist'],
  
  // Auto restart
  autorestart: true,
  restart_delay: 4000,
  
  // Process management
  kill_timeout: 5000,
  listen_timeout: 3000,
  
  // Environment variables
  env_file: '.env'
};
