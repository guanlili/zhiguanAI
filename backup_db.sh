#!/bin/bash
set -euo pipefail

DATE=$(date +%F)
CONTAINER="zhiguanai-db-1"
DB="app"
USER="postgres"

echo "▶ Checking container..."
docker ps --format '{{.Names}}' | grep -q "^$CONTAINER$" || {
  echo "❌ Container $CONTAINER not running"
  exit 1
}

echo "▶ Backing up database: $DB"

docker exec -t $CONTAINER pg_dump -U $USER $DB > zhiguanai_$DATE.sql
docker exec -t $CONTAINER pg_dump -U $USER -Fc $DB > zhiguanai_$DATE.dump

echo "✅ Backup completed:"
ls -lh zhiguanai_$DATE.*
