# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fdcc20cf-0dca-4db0-87d2-ddcf3c4927a4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fdcc20cf-0dca-4db0-87d2-ddcf3c4927a4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Linting

Before running `npm run lint`, make sure all dependencies are installed. Execute
`npm install` (or `bun install`) once after cloning the repo so that ESLint and
its plugins are available.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fdcc20cf-0dca-4db0-87d2-ddcf3c4927a4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## API Endpoints Setup

The application expects two backend endpoints for syncing TrueSkill data:

* `POST /api/trueskill/sync` – Accepts a payload containing `sessionId`, `ratings`, `totalBattles` and `lastUpdated`. It should store the data and return `{ success: true }` on success.
* `POST /api/trueskill/get` – Accepts `{ sessionId }` and returns the stored `{ success: true, ratings, totalBattles, lastUpdated }`.

These endpoints can be implemented using your preferred backend (e.g. the Supabase edge functions found in `supabase/functions`). Ensure your development and production environments expose these routes so the store can synchronize correctly.
