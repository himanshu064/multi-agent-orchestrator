# Multi-Agent Orchestrator Demo

A proof of concept that shows how a multi-agent AI pipeline works, built to be demoed live to clients.

One orchestrator agent takes a goal, splits it into smaller tasks, hands each task to a worker agent running in parallel, and a final step merges the workers' output into a single result. The web page shows every stage as it happens.

```
              ┌──────────────┐
              │ Orchestrator │   plans the work
              └──────┬───────┘
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Agent 1 │  │ Agent 2 │  │ Agent 3 │   work in parallel
   └────┬────┘  └────┬────┘  └────┬────┘
        └────────────┼────────────┘
                     ▼
              ┌──────────────┐
              │    Result    │   merged answer
              └──────────────┘
```

## What the demo shows

- **Live pipeline diagram.** Each node changes state as work happens: waiting, working, done, or failed.
- **Agent status.** How many agents are running, what task each one has, and its output streaming in as it works.
- **Activity log.** A timestamped list of everything that happened in the run.
- **Vendor choice from the UI.** Pick OpenAI, Gemini, or Claude and paste a key with the Add API key button. The page always shows which cheapest-tier model is in use and its price.
- **Final result.** The merged answer, plus total time, tokens used, and estimated cost.
- **Run history.** Past runs are saved in Postgres and can be reopened at any time.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4, shadcn/ui, React Flow |
| Database | PostgreSQL with Drizzle ORM |
| AI | Vercel AI SDK with OpenAI, Gemini, and Anthropic adapters; cheapest model per vendor |

## Prerequisites

- Node.js 20 or newer
- A PostgreSQL database you can connect to
- An API key for at least one of OpenAI, Google Gemini, or Anthropic

## Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env.local` (or `.env`) in the project root and fill in your values. See `.env.example` for the list.

   ```bash
   DATABASE_URL=postgres://user:password@host:5432/dbname
   # Optional fallbacks. Keys can also be pasted with the Add API key button in the UI.
   OPENAI_API_KEY=
   GOOGLE_GENERATIVE_AI_API_KEY=
   ANTHROPIC_API_KEY=
   ```

   If you use Supabase, copy the **Session pooler** connection string from the dashboard (Connect, then Session pooler), not the direct one. The direct host is IPv6-only and does not resolve on most home and office networks.

3. Create the database tables.

   ```bash
   npm run db:push
   ```

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Using the demo

1. Click **Add API key**, choose a vendor, paste its API key, and save.
2. Click a predefined goal or type your own, then click **Run pipeline**.
3. Watch the orchestrator plan, the agents work in parallel, and the result appear.
4. Open **History** to replay a previous run.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate route types and run the TypeScript compiler |
| `npm run db:push` | Apply the Drizzle schema directly to the database |
| `npm run db:generate` | Generate SQL migrations from the schema |
| `npm run db:migrate` | Run generated migrations |
| `npm run db:studio` | Open Drizzle Studio to browse the database |
| `npm run pipeline -- <vendor> "<goal>"` | Run one pipeline from the terminal and print every event |

## Project layout

```
src/
  app/
    api/runs/          API route that starts a run and streams progress
    page.tsx           Demo page
  components/
    pipeline/          Pipeline canvas and status components
    ui/                shadcn/ui components
  lib/
    agents/            Orchestrator, worker, and synthesizer logic
    db/                Drizzle schema and client
drizzle/               Generated migrations
drizzle.config.ts      Drizzle Kit configuration
```

## Cost

Every stage runs on the cheapest model of the chosen vendor: OpenAI `gpt-5-nano`, Gemini `gemini-2.5-flash-lite`, or Claude `claude-haiku-4-5`. A typical run with three agents uses a few thousand tokens and costs a fraction of a cent. The model list and prices live in `src/lib/providers.ts`.

## Status

Proof of concept, feature complete as described in `docs/SPEC.md`. Verified with a live Anthropic run from the terminal; the browser flow needs a reachable Postgres.
