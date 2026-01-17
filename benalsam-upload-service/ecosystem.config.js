module.exports = {
  apps: [{
    name: 'benalsam-upload-service',
    script: 'npm',
    args: 'run start',
    cwd: '/opt/benalsam/services/benalsam-upload-service',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3007
    },
    error_file: '/opt/benalsam/services/benalsam-upload-service/logs/pm2-error.log',
    out_file: '/opt/benalsam/services/benalsam-upload-service/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};

