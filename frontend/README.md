# RFP Strategy Engine — Frontend

React + TypeScript single-page application that provides the UI for the RFP Strategy Engine.

## Tech Stack

- [React 18](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — type-safe JavaScript
- [Vite](https://vitejs.dev/) — build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) — accessible component primitives
- [TanStack React Query](https://tanstack.com/query) — data fetching and caching
- [React Router v6](https://reactrouter.com/) — client-side routing

## Prerequisites

- **Node.js 18+** and **npm** (or a compatible package manager)
  - Recommended install method: [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- The **backend API** running locally (default `http://localhost:8000`). See the [root README](../README.md#quick-start) for backend setup.

## Getting Started

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. (Optional) Create a local env file to override the API URL
cp .env.example .env
# Edit .env if your backend runs on a different host/port

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:8080**.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

Create a `.env` file in the `frontend/` directory (see `.env.example`) to override defaults. Vite only exposes variables prefixed with `VITE_`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with hot-reload on port 8080 |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Run ESLint on the codebase |
| `npm run test` | Run tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```text
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components (shadcn/ui based)
│   ├── hooks/           # Custom React hooks (useArtifacts, useJobStatus, useWebSocket)
│   ├── lib/             # API client, types, and utilities
│   ├── pages/           # Route-level page components
│   ├── test/            # Test setup
│   ├── App.tsx          # Root component with routing
│   └── main.tsx         # Entry point
├── .env.example         # Environment variable template
├── index.html           # HTML entry point
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```
