#!/bin/sh
set -e

# Fix permissions for storage directories (volumes might override Dockerfile permissions)
# Run as root to fix permissions, then switch to appuser
if [ "$(id -u)" = "0" ]; then
    # Create directories if they don't exist
    mkdir -p /app/storage/uploads /app/storage/temp /app/storage/assets /app/drive /app/logs
    
    # Set ownership and permissions
    chown -R appuser:appuser /app/storage /app/drive /app/logs
    chmod -R 775 /app/storage /app/drive /app/logs
    
    # Ensure log file exists and has correct permissions
    touch /app/logs/server.log
    chown appuser:appuser /app/logs/server.log
    chmod 664 /app/logs/server.log
    
    # Switch to appuser and execute the command
    exec su-exec appuser "$@"
else
    # Already running as appuser, just execute
    exec "$@"
fi

