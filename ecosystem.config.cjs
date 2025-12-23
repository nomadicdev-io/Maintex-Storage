module.exports = {
    apps: [{
      name: 'maintex-storage',
      script: 'bun',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 8180,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/applications/maintex-storage/logs/error.log',
      out_file: '/var/www/applications/maintex-storage/logs/output.log',
      merge_logs: true
    }]
  };