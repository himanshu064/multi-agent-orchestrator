# Multi-Agent Orchestrator Demo: Specification

Proof of concept for showing clients how a multi-agent AI pipeline works. Written in plain words so anyone on the team can follow it.

## 1. What we are building

A web page where someone types a goal, presses **Run pipeline**, and watches a team of AI agents complete it live.

- One **orchestrator** reads the goal and splits it into smaller tasks.
- Several **agents** each take one task and work on it at the same time.
- A **synthesizer** merges everything into one final result.

The page shows every step as it happens: which agent is working, what it is writing, how long it took, and what it cost. Nothing is static or faked. Every run calls Claude for real.

## 2. What the audience sees

The page has four areas.

**Top bar.** The goal input, a **Run pipeline** button, three example goals you can click to fill the box, and a **History** button.

**Pipeline diagram.** The same picture as our reference image, drawn live.

```
             [ Orchestrator ]
            /       |        \
     [Agent 1]  [Agent 2]  [Agent 3]   (2 to 5 agents, chosen per run)
            \       |        /
               [ Result ]
```

Each node has a colour and icon for its state.

| State | How it looks |
|---|---|
| Waiting | Grey, dimmed |
| Working | Pulsing border, spinner, text streaming in |
| Done | Green border, checkmark, time taken |
| Failed | Red border, short error message |

Agent boxes show the role the orchestrator gave them, for example "Market Researcher", and the first lines of their output as it streams in. Clicking a box opens the full output.

**Status strip.** One line that always says what is happening right now, plus a live timer.

- "Orchestrator is planning the work"
- "3 of 3 agents working"
- "1 of 3 agents done"
- "Merging results"
- "Done in 14.2s"

**Right panel with two tabs.**

- **Activity**: a timestamped log of every event in the run.
- **Result**: the final answer rendered as formatted text, with a summary underneath: total time, tokens in and out, and estimated cost in dollars.

**History drawer.** A list of past runs. Clicking one loads it into the page exactly as it finished, so a good run can be replayed on stage without waiting.

## 3. How one run works, step by step

1. The user submits a goal. The server creates a **run** row in the database with status `planning`.
2. The server opens a stream to the browser. From now on every change is sent as an event and also saved in the database.
3. **Orchestrator.** Claude is asked to split the goal into 2 to 5 independent tasks. It replies in a fixed JSON shape: a list of tasks, each with a role name, a one-line title, and detailed instructions. Each task becomes an **agent_task** row.
4. **Agents.** All tasks start at the same time. Each one is a separate streaming call to Claude with the role as its system prompt and the instructions as the user message. As text arrives it is sent to the browser in small chunks. When an agent finishes its output and token counts are saved.
5. **Synthesizer.** Once every agent is done, Claude receives all outputs and the original goal and writes the final answer. This also streams.
6. The run is marked `completed` with the result, total tokens, and timing. The stream closes.
7. If anything fails, the failing task or the run is marked `failed` with the error, and the page shows it. Other agents keep running.

## 4. Data model

Three tables in Postgres, managed with Drizzle.

**runs**

| Column | Meaning |
|---|---|
| id | Unique id |
| goal | What the user typed |
| status | `planning`, `running`, `synthesizing`, `completed`, `failed` |
| model | Model id used for this run |
| result | Final text, filled when done |
| input_tokens, output_tokens | Totals across every call in the run |
| error | Error message if failed |
| created_at, completed_at | Timing |

**agent_tasks**

| Column | Meaning |
|---|---|
| id | Unique id |
| run_id | Which run it belongs to |
| position | Order on the diagram, 0 to 4 |
| role | Short name shown on the box, e.g. "Market Researcher" |
| title | One-line description of the task |
| instructions | Full prompt given to the agent |
| status | `pending`, `running`, `completed`, `failed` |
| output | What the agent wrote |
| input_tokens, output_tokens | Usage for this agent |
| error | Error message if failed |
| started_at, completed_at | Timing |

**events**

| Column | Meaning |
|---|---|
| id | Unique id |
| run_id | Which run it belongs to |
| seq | Order within the run |
| type | Event name, see section 5 |
| payload | JSON with the details |
| created_at | When it happened |

## 5. Events

Every event has the shape `{ type, runId, at, ...details }`. The browser and the database both receive the same list.

| Event | When | Details |
|---|---|---|
| `run_started` | Run row created | goal, model |
| `plan_started` | Orchestrator call begins | |
| `plan_completed` | Orchestrator returned tasks | list of tasks with position, role, title |
| `agent_started` | An agent call begins | position |
| `agent_delta` | Text chunk arrived from an agent | position, text |
| `agent_completed` | Agent finished | position, tokens, duration |
| `agent_failed` | Agent errored | position, error |
| `synthesis_started` | Synthesizer call begins | |
| `synthesis_delta` | Text chunk from the synthesizer | text |
| `run_completed` | Everything done | result, totals, duration, cost |
| `run_failed` | Unrecoverable error | error |

Text chunks are batched about every 50 ms so the stream stays smooth without flooding the browser. Delta events are not stored in the database; the final text is stored instead.

## 6. API

| Method and path | What it does |
|---|---|
| `POST /api/runs` | Body `{ goal }`. Creates the run and returns a Server-Sent Events stream of the events above until the run ends. |
| `GET /api/runs` | List of recent runs for the history drawer: id, goal, status, duration, cost. |
| `GET /api/runs/{id}` | One run with its tasks and stored events, used to replay a past run. |

Server-Sent Events is a plain HTTP response that stays open and sends one line per event. It needs no extra libraries and works with the browser's built-in `EventSource` style reading through `fetch`.

## 7. AI calls

All three stages use the Anthropic SDK and the model set by `ANTHROPIC_MODEL`, which defaults to `claude-haiku-4-5`, the cheapest current model.

**Orchestrator.** One call with structured output so the reply is guaranteed to be valid JSON matching our task schema. Asked for 2 to 5 tasks that do not depend on each other, each with a distinct role.

**Agent.** One streaming call per task. System prompt: "You are the {role}. Complete only your assigned task. Be concise and concrete." Max output about 1,500 tokens so agents stay fast.

**Synthesizer.** One streaming call. Receives the goal and every agent output, labelled by role, and is asked to write one polished answer in markdown.

**Prompt caching.** The fixed system prompts are marked cacheable so repeat runs pay less for the same instructions.

**Cost estimate.** A small table of price per million tokens by model. Haiku 4.5 is $1 in and $5 out. Shown on the result panel after every run. A typical three-agent run is well under one cent.

## 8. Screens and components

```
src/app/page.tsx                         Loads recent runs, renders the demo
src/app/api/runs/route.ts                POST (start + stream) and GET (list)
src/app/api/runs/[id]/route.ts           GET one run for replay

src/components/pipeline/
  Demo.tsx                               Holds run state, wires everything together
  GoalForm.tsx                           Input, example chips, Run button
  StatusStrip.tsx                        Current step and timer
  PipelineCanvas.tsx                     React Flow diagram with live nodes
  nodes/OrchestratorNode.tsx
  nodes/AgentNode.tsx
  nodes/ResultNode.tsx
  ActivityLog.tsx                        Event list
  ResultPanel.tsx                        Markdown result and cost summary
  RunHistory.tsx                         Drawer listing past runs
  useRun.ts                              Starts a run, reads the stream, updates state

src/lib/agents/
  client.ts                              Anthropic client and model from env
  orchestrator.ts                        Plan the tasks
  worker.ts                              Run one agent, stream text
  synthesizer.ts                         Merge outputs
  pipeline.ts                            Runs the whole thing, emits events, saves to DB
  events.ts                              Event types shared by server and browser
  pricing.ts                             Cost table

src/lib/db/
  schema.ts                              The three tables
  index.ts                               Drizzle client
```

## 9. Decisions already made

- **Agent count is dynamic**, 2 to 5, chosen by the orchestrator. The diagram lays itself out to fit. This is more impressive than a fixed three and costs nothing extra.
- **Agent text streams live** into the boxes. This is the moment the audience watches, so it is worth the extra code.
- **Any goal is allowed.** Three example goals are offered as chips so a demo can start in one click.
- **Haiku 4.5 everywhere** for cost. The model is one env variable if we ever want a stronger orchestrator.
- **No Docker.** Postgres and env values are provided by the developer.
- **No login.** This is a local or single-tenant demo.

## 10. Not in scope for the proof of concept

- Agents talking to each other or using tools such as web search.
- Multiple rounds of planning or retries by the orchestrator.
- Authentication, multi-user, or deployment hardening.
- Mobile layout. The demo is for a laptop or projector.

## 11. Build order

1. Database schema and `npm run db:push`.
2. Agent modules and the pipeline, tested from a small script that prints events to the terminal.
3. API routes with the SSE stream.
4. `useRun` hook and the status strip, so the page reflects a live run in plain text.
5. React Flow canvas with the three node types and animated edges.
6. Activity log, result panel with cost, and history drawer.
7. Polish: example chips, empty states, error states, final visual pass.

Each step is committed on its own so the project works at every point.

## 12. Running it

```bash
npm install
# create .env.local with DATABASE_URL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL
npm run db:push
npm run dev
```

Open http://localhost:3000, click an example goal, press **Run pipeline**.
