# Loopd

Personal performance tracker — habits, mood, tasks, and daily AI pulse.

## Stack

- **Frontend**: React + Vite, Tailwind CSS v3, Zustand
- **Backend**: Supabase (Postgres + auth)
- **AI**: OpenAI GPT-4o-mini
- **PWA**: vite-plugin-pwa (installable on iOS/Android)

## Local setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=sk-proj-...
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_OPENAI_API_KEY` | OpenAI API key (used client-side for daily pulse) |

## Deployment

Deployed on Vercel. SPA routing handled via `vercel.json`.
Set the three env vars above in your Vercel project settings before deploying.
