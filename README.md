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
- **Final result.** A Show result button opens the merged answer full screen, with total time, tokens used, and estimated cost. The view lives at `?result=<run id>`, so the link can be shared.
- **Run history.** Past runs are saved in Postgres and can be reopened at any time.

## Tech stack

Everything runs in one Next.js app. There is no separate backend service.

### Application

| Piece | Version | What it does here | Why we chose it |
|---|---|---|---|
| **Next.js** (App Router) | 16 | Serves the page, the API routes, and the live event stream | One codebase for UI and server; route handlers can stream responses |
| **React** | 19 | Renders the page and reacts to each event as it arrives | Comes with Next.js |
| **TypeScript** | 5 | Types shared between server and browser, including the event shapes | Catches mistakes before they reach a demo |

### User interface

| Piece | Version | What it does here | Why we chose it |
|---|---|---|---|
| **Tailwind CSS** | 4 | All styling, including the shadow and radius tokens | Fast to iterate, no separate stylesheet to maintain |
| **shadcn/ui** | 4 | Buttons, cards, dialogs, drawer, inputs | Accessible components that live in our repo and can be edited |
| **React Flow** (`@xyflow/react`) | 12 | Draws the orchestrator, agent, and result nodes and the animated edges | Purpose-built for node diagrams; nodes are plain React components |
| **lucide-react** | 1 | Icons | Same icon family as shadcn/ui |
| **react-markdown** + remark-gfm | 10 / 4 | Renders the final answer and agent output as formatted text | Small and safe; no raw HTML from the model |
| **@tailwindcss/typography** | 0.5 | Readable defaults for that rendered text | One class instead of styling every heading and list |

### AI

| Piece | Version | What it does here | Why we chose it |
|---|---|---|---|
| **Vercel AI SDK** (`ai`) | 7 | One set of functions for streaming text and getting structured JSON from any vendor | Same code path for all three vendors; streaming and JSON schemas built in |
| **@ai-sdk/openai** | 4 | Talks to OpenAI, model `gpt-5-nano` | Cheapest OpenAI model |
| **@ai-sdk/google** | 4 | Talks to Google Gemini, model `gemini-2.5-flash-lite` | Cheapest Gemini model |
| **@ai-sdk/anthropic** | 4 | Talks to Anthropic, model `claude-haiku-4-5` | Cheapest Claude model |
| **zod** | 4 | Defines the task list the orchestrator must return | The AI SDK turns it into a JSON schema the model has to follow |

Each adapter calls the vendor directly. There is no middleman such as OpenRouter, so there is no extra fee and the demo can honestly say which vendor handled a run.

### Data

| Piece | Version | What it does here | Why we chose it |
|---|---|---|---|
| **PostgreSQL** | any recent | Stores runs, agent tasks, and the event log | The team's standard database |
| **Drizzle ORM** + drizzle-kit | 0.45 / 0.31 | Typed queries and the schema-to-database push | Schema is plain TypeScript; migrations are generated from it |
| **postgres** (postgres-js) | 3 | The database driver | Small and fast; works with serverless and pooled connections |

### How the pieces talk to each other

```
Browser                          Server (Next.js route handlers)              Vendors
-------                          --------------------------------             -------
Goal + vendor + key  --POST-->   /api/runs
                                   create run row  ------------------>  Postgres
                                   orchestrator (generateObject) ---->  OpenAI / Gemini / Claude
                                   agents in parallel (streamText) -->  OpenAI / Gemini / Claude
                                   synthesizer (streamText) --------->  OpenAI / Gemini / Claude
Diagram updates   <--SSE stream--  every event, as it happens
                                   save tasks, events, result  ------>  Postgres
Show result       --GET-------->   /api/runs/{id}  <-------------------  Postgres
```

Server-Sent Events (SSE) is a plain HTTP response that stays open and sends one small message per event. The browser reads it with `fetch`, so no extra library is needed on either side.

### Developer tooling

| Piece | What it does here |
|---|---|
| **ESLint** with `eslint-config-next` | Lint rules, including the React hooks rules |
| **tsx** | Runs the terminal pipeline script without a build step |
| **dotenv** | Lets drizzle-kit read `.env` and `.env.local` |

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
4. Press **Show result** next to the Merge stage, or open **History** to bring back a previous run.

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
