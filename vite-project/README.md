# Meeting Content Generator (Vite + React)

This project lets advisors connect one or more Google accounts, pull upcoming events from every connected calendar, and toggle whether an AI notetaker should attend each meeting. Past meetings/transcripts are still powered by mock data while the upcoming meetings view now reflects live Google Calendar data.

## Google Calendar integration

1. Create (or reuse) a Google Cloud project.
2. Enable the **Google Calendar API** and **People API**.
3. Configure the OAuth consent screen as *External* and add `webshookeng@gmail.com` as a test user (required for QA access).
4. Create an OAuth 2.0 **Web application** client and add the following authorized JavaScript origins/redirects for local dev:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
5. Copy the generated client ID into a Vite environment file:

```bash
cp .env.example .env.local # create this file if it doesn't exist
echo VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" >> .env.local
```

The Calendar API calls are made directly from the browser, so no API key is required once the OAuth client is configured.

## Recall.ai integration

1. [Create a Recall.ai account](https://www.recall.ai/) (the challenge email contains the shared credentials) and grab the API key + region from the developer dashboard.
2. Store the key and region in your Vite env file so the front-end can authenticate:

```env
VITE_RECALL_API_KEY="paste-the-shared-api-key"
VITE_RECALL_REGION="us-west-2" # or us-east-1/eu-central-1/etc based on the key you received
VITE_API_BASE_URL="http://localhost:4000"
```

3. When a Zoom event is detected and the **Notetaker** toggle is enabled, the app automatically:
   - schedules a Recall bot to join `botJoinMinutes` before the meeting begins,
   - stores the returned bot ID in `localStorage` (so only bots created by this app are polled),
   - polls the `/bot/{id}` endpoint to avoid the broader `/bots` listing and watches for status changes/media availability.
4. Use **Settings → Recall.ai Bot Settings** to adjust how many minutes before the start time the bot should join. The preference is persisted locally.

The Calendar tab shows Recall bot status, lets you manually refresh a bot, and exposes S3 links to the mixed recording + transcript once Recall marks the meeting as `done`.

## Local development

```bash
pnpm install
pnpm dev
```

Navigate to `http://localhost:5173`, click **Continue with Google**, authorize calendar access, and then optionally add more accounts from **Settings → Connected Accounts**. The dashboard aggregates events from every connected Google account and lets you toggle the notetaker preference per meeting (stored in `localStorage`).

## Node API server

A lightweight Express server now lives in the sibling folder `../jumpapp-api`. It keeps auth users, meetings, Recall bot metadata, and Recall-related settings in memory (you can swap in a real database later).

```bash
cd ../jumpapp-api

# run the API with hot reload (default port 4000)
pnpm dev

# build + run the compiled output
pnpm build
pnpm start
```

Available endpoints:

- `GET /health`
- `/api/auth-users`
- `/api/meetings`
- `/api/recall-bots`
- `/api/settings`
- `/api/settings/user/:userId`

Every resource route supports `GET`, `POST`, `PUT`, and `DELETE` with payload validation handled via `zod`.

OAuth connect buttons on the Settings page hit the backend routes `/auth/linkedin` and `/auth/facebook`, which handle the provider redirect/callback exchange and update the current user's connected accounts. Make sure the API's OAuth env vars are filled in before attempting to connect.

## Notes

- Tokens are cached in `localStorage` and refreshed automatically when possible. If the browser clears cookies or the grant expires, you'll be prompted to re-authorize.
- Removing your final Google account from **Settings** signs you out of the app.
- Past meeting, transcript, and automation data still rely on the existing mock fixtures.

