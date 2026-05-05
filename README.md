# Notes App

React/Vite frontend for registering and searching note topics.

## Data

Entries are stored in the Supabase `notes_entries` table.

## Local Development

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then set:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## GitHub Pages Deployment

The workflow in `.github/workflows/deploy.yml` builds the app and deploys `dist` to GitHub Pages whenever `main` is pushed.

Add these repository secrets before deploying:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The custom domain is configured by `public/CNAME`:

```text
notes.tarun.win
```

For DNS, create a `CNAME` record:

```text
notes.tarun.win -> <github-username>.github.io
```

Then enable GitHub Pages for the repository using GitHub Actions as the source.
