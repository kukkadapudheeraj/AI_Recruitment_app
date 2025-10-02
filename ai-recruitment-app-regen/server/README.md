# AI Recruitment Proxy Server

Secure proxy for OpenAI calls so your API key stays on the server.

## Quick start
```bash
cd server
cp .env.example .env
# edit .env and put your real OPENAI_API_KEY

npm install
npm run start
# server listens on http://localhost:8787 by default
```
Set `ALLOWED_ORIGIN` in `.env` for your frontend origin (e.g., `http://localhost:5500`).

## Endpoints
- `POST /api/generate` → { text }
- `POST /api/polish` → { text }
