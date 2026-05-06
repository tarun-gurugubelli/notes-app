# Notes App

A React and Vite web application for registering, managing, and searching note topics. The app stores entries in Supabase and provides two main views:

- **Search**: browse registered topics, filter by area, search by area/tag/content, and use `/tag` suggestions.
- **Registration**: add, edit, view, reload, and delete topic entries stored in Supabase.

The production build is deployed to GitHub Pages and can be configured with the custom domain in `public/CNAME`.

## Tech Stack

- **React 19** for the web UI.
- **React DOM** for rendering the app into the browser.
- **Vite 7** for local development, bundling, and previewing production builds.
- **@vitejs/plugin-react** for React support in Vite.
- **Supabase JS v2** for reading and writing note entries.
- **TypeScript package dependency** is available in the project toolchain, although the current source files are JavaScript/JSX.
- **GitHub Actions** for automated GitHub Pages deployment.

## Application Modules

- `src/main.jsx`: main React application, screen switching, search/filter logic, registration form handling, modals, and Supabase CRUD operations.
- `src/supabaseClient.js`: Supabase client setup using Vite environment variables.
- `src/styles.css`: global styling, responsive layouts, table/card views, buttons, modals, and form states.
- `vite.config.js`: Vite configuration with the React plugin.
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow.
- `public/CNAME`: custom domain configuration for GitHub Pages.

## Data Model

Entries are stored in the Supabase `notes_entries` table. The app expects these columns:

| Column | Purpose |
| --- | --- |
| `id` | Numeric entry identifier used for ordering and updates. |
| `area` | Topic area/category. The UI normalizes this to uppercase. |
| `question_tag` | Unique searchable tag for the note entry. |
| `content` | Main note content shown in search results and detail views. |

The app treats `question_tag` as unique and shows a friendly message when Supabase returns a duplicate-key error.

## Prerequisites

- Node.js 24 is used by the deployment workflow. Use Node 24 locally for the closest match.
- npm.
- A Supabase project with a `notes_entries` table.

## Environment Variables

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Set the following values in `.env.local`:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The app can load without these values, but Supabase-backed reload, add, edit, and delete actions are disabled until they are configured.

## Install Packages

Install dependencies with npm:

```bash
npm install
```

For a clean, lockfile-based install, use:

```bash
npm ci
```

## Run Locally

Start the Vite development server:

```bash
npm run dev
```

The script runs Vite with `--host 0.0.0.0`, so it can be accessed from the local machine and other devices on the same network when allowed by your environment.

## Build

Create a production build:

```bash
npm run build
```

The compiled static files are written to `dist/`.

## Preview Production Build

After building, preview the production output locally:

```bash
npm run preview
```

## Deployment

This project is configured for GitHub Pages deployment through GitHub Actions.

1. Add these repository secrets in GitHub:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

2. In the repository settings, enable GitHub Pages and choose **GitHub Actions** as the source.

3. Push to the `main` branch, or manually run the **Deploy to GitHub Pages** workflow from the GitHub Actions tab.

The workflow will:

- Check out the repository.
- Set up Node.js 24.
- Install packages with `npm ci`.
- Build the app with `npm run build`.
- Upload `dist/` as a GitHub Pages artifact.
- Deploy the artifact to GitHub Pages.

## Custom Domain

The custom domain is configured in `public/CNAME`:

```text
notes.tarun.win
```

For DNS, create a `CNAME` record that points the custom domain to the GitHub Pages host:

```text
notes.tarun.win -> <github-username>.github.io
```

After DNS is configured, verify the custom domain from the repository's GitHub Pages settings.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local Vite development server. |
| `npm run build` | Builds the production app into `dist/`. |
| `npm run preview` | Serves the production build locally for verification. |
