# NaviGraph

Turn any floor plan into robot memory.

NaviGraph turns a floor plan into a semantic **Spatial Graph**. At navigation time
it localizes the robot from a single camera frame and returns a rich, plain-text
**context** for any navigation model (Robostral, OpenVLA, GR00T, …) — no 3D
reconstruction required.

## Free hosted app

NaviGraph runs as an entirely free hosted web app at
**[navigraph.cloud](https://navigraph.cloud)**. Create an account and, at no cost:

- **Upload** a floor plan — a navigation graph is built automatically.
- **Adjust & enrich** the spatial graph — rename rooms, fix connections, and add
  photos for localization and landmark detection.
- **Generate API keys** to query the context endpoint from your own robots or
  backend.

No setup, no billing.

## Pipeline

1. **Builder** — upload a plan; the vision layer extracts rooms, doors, stairs and
   elevators into an editable Spatial Graph laid over the plan.
2. **Knowledge** — an assistant fills the gaps (names, photos, connections); each
   room gains landmarks/tags and a semantic embedding.
3. **Localization** — a camera frame is matched (pgvector) against reference photos
   to find the current room.
4. **Context** — `POST /api/context` returns the location, destination, path,
   landmarks and a plain-text context string.

## Stack

Next.js 16 · TypeScript · Tailwind · shadcn/ui · Zustand · Supabase (Postgres +
pgvector + Storage + Auth) · OpenAI (vision + embeddings).

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Publishable/anon key (safe in the browser) |
| `VISION_PROVIDER` | no | `mock` (default) or `openai` |
| `OPENAI_API_KEY` | if `openai` | Server-side secret (vision + embeddings) |
| `OPENAI_VISION_MODEL` | no | Defaults to `gpt-4o` |

## API

```bash
curl -X POST https://navigraph.cloud/api/context \
  -H "Authorization: Bearer navi_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<projectId>",
    "instruction": "Go to the supply room",
    "image": "data:image/jpeg;base64,...optional camera frame..."
  }'
```

- `projectId` — the building id from the project URL `/projects/<projectId>`.
- `instruction` — natural-language goal.
- `image` — optional base64 camera frame for localization.
- `current_location` — optional fallback room name (skips image localization).

Generate and manage keys at `/dashboard/api`.
