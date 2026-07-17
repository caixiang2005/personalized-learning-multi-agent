#!/usr/bin/env bash
# Import n8n Feishu alert workflow after plma-n8n is up
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
WF="$ROOT/../integrations/n8n/error-alert-feishu.json"
docker exec -u node plma-n8n n8n import:workflow --input=/import/error-alert-feishu.json || {
  docker cp "$WF" plma-n8n:/tmp/wf.json
  docker exec -u node plma-n8n n8n import:workflow --input=/tmp/wf.json
}
echo "[n8n] imported. Open http://127.0.0.1:5678 - set Feishu webhook and Active"
