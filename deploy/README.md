# Aliyun / competition deploy (app + n8n + Dify)

## Ports for judges

| URL | Service |
|-----|---------|
| `http://<ECS-IP>/` | Main product (Nginx) |
| `http://<ECS-IP>:5678` or `/n8n/` | n8n |
| `http://<ECS-IP>:8080` | Dify console |

Security group: open **80, 5678, 8080** (and 443 if HTTPS).

ECS: **4C8G+**, disk **40G+** (Dify + agent images are large).

## 1) Main app + Redis + n8n

```bash
cd deploy
cp .env.example .env
# fill DATABASE_URL, PG_*, DEEPSEEK_API_KEY, N8N_WEBHOOK_URL=http://<ECS-IP>:5678/

# SMTP for register codes:
#   edit ../backend/user-service/config/settings.yaml

docker compose up -d --build

# import Feishu alert workflow
bash import-n8n-workflow.sh
# then open n8n -> set Feishu Webhook -> Active
```

Windows:

```powershell
cd deploy
copy .env.example .env
# edit .env
docker compose up -d --build
docker exec -u node plma-n8n n8n import:workflow --input=/import/error-alert-feishu.json
```

## 2) Dify (official stack, required for demo agents)

Dify is not vendored (too large). Scripts clone `langgenius/dify` once:

```bash
# Linux
chmod +x start-dify.sh
./start-dify.sh
```

```powershell
# Windows
.\start-dify.ps1
```

Then open `http://<ECS-IP>:8080`, finish Dify setup wizard, configure LLM (Tongyi/DeepSeek).

Optional seed (5 agents aligned with product prompts):

```text
integrations/dify/seed_agents.sql
integrations/dify/prompts/*.md
```

Run SQL against **Dify's own Postgres** after install (see `integrations/dify/`), or create apps manually from the prompt files.

## 3) Judge checklist

```bash
curl -I http://127.0.0.1/                 # main
curl -I http://127.0.0.1:5678             # n8n
curl -I http://127.0.0.1:8080             # dify
docker compose ps
```

Product path: register/login -> profile -> path -> chat -> exercise.
n8n: error alert workflow.
Dify: 5 agent demos (profile/path/tutor/resource/safety).

## Note

- App Redis = Compose `redis` (writable). Do not point to a read-only cloud replica.
- App Postgres = Aliyun RDS / teammate `project_db`.
- Dify uses **its own** Postgres/Redis inside its compose (separate from app DB).
