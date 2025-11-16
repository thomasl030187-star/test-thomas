# Jumpapp API

This Express + TypeScript service powers CRUD endpoints for auth users, meetings, Recall bot metadata, and settings. Everything is stored in-memory for now, so feel free to plug in a database later.

## Development

```bash
pnpm install
pnpm dev
```

The server listens on http://localhost:4000 by default. Hit `/health` to verify it is running.

### Environment

Set these env vars (or edit `src/config/oauth.ts`) to match your OAuth apps:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI` (default `http://localhost:4000/auth/linkedin/callback`)
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI` (default `http://localhost:4000/auth/facebook/callback`)
- `FRONTEND_BASE_URL` (default `http://localhost:5173`)
- `OAUTH_JWT_SECRET` (any random string)
- `RECALL_API_KEY` / `RECALL_REGION` (for Recall.ai bot polling)
- `RECALL_POLL_INTERVAL_MS` (optional, default 30000)
- `OPENAI_API_KEY` / `OPENAI_MODEL` (optional, for generating social posts from transcripts)

## Production build

```bash
pnpm build
pnpm start
```

## Routes

- `GET /health`
- `/api/auth-users`
- `/api/meetings`
- `/api/recall-bots`
- `/api/settings`
- `/api/settings/user/:userId`

Every resource implements `GET`, `POST`, `PUT`, and `DELETE`.
