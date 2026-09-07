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
- **Final result.** The merged answer, plus total time, tokens used, and estimated cost.
- **Run history.** Past runs are saved in Postgres and can be reopened at any time.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS 4, shadcn/ui, React Flow |
| Database | PostgreSQL with Drizzle ORM |
| AI | Anthropic SDK, Claude Haiku 4.5 by default (cheapest current model) |

## Prerequisites

- Node.js 20 or newer
- A PostgreSQL database you can connect to
- An Anthropic API key

## Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root and fill in your values. See `.env.example` for the list.

   ```bash
   DATABASE_URL=postgres://user:password@host:5432/dbname
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-haiku-4-5
   ```

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

1. Type a goal in the input box, for example "Write a short market report on electric scooters in India".
2. Click **Run pipeline**.
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

Every stage runs on Claude Haiku 4.5 by default. A typical run with three agents uses a few thousand tokens and costs a fraction of a cent. Change `ANTHROPIC_MODEL` to use a different model without touching the code.

## Status

Proof of concept. The project scaffold, database client, and UI foundation are in place. The pipeline logic, database schema, and live canvas are the next steps.
