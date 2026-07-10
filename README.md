# Holiday Lighting Mockups

A small MVP for a Christmas light installation company. Add a customer,
upload a photo of their house plus a style reference photo, and generate an
AI mockup of what their house would look like with lights installed. Every
mockup is saved to that customer's record permanently.

## Stack

- **Next.js 14** (App Router, TypeScript) — one framework for both the UI
  and the API routes, no separate backend needed.
- **SQLite** (`better-sqlite3`) — a `customers` table and a `mockups` table
  (linked by `customer_id`). Simple, file-based, zero setup — fits an MVP.
- **OpenAI `gpt-image-1`** (image edit endpoint) — takes the house photo +
  the style reference photo + a text prompt, returns an edited image.
- Uploaded photos and generated mockups are saved to `/public/uploads/<customerId>/`
  so they're directly servable as static files and organized per customer
  on disk too, not just in the database.

## Setup

```bash
npm install
cp .env.example .env.local
# then paste your OpenAI key into .env.local:
# OPENAI_API_KEY=sk-...
npm run dev
```

Open `http://localhost:3000`.

**No API key?** The app still runs. `lib/generateMockup.ts` checks for
`OPENAI_API_KEY` — if it's missing, it runs in demo mode and just saves the
original house photo instead of calling the AI, so you can still test
customer creation, uploads, and the saved-mockup gallery end to end.

## How the AI part works (`lib/generateMockup.ts`)

`gpt-image-1`'s edit endpoint accepts more than one input image. This app
sends two:

1. **The house photo** — told explicitly to keep the real architecture,
   siding, windows, and landscaping unchanged.
2. **The reference photo** — told to use it only for lighting *style*
   (warmth, thickness, spacing of the strands), not to copy its house or
   background.

That split is the main piece of prompt engineering here: without it, the
model tends to blend the two houses together instead of just borrowing the
lighting style. The full prompt is in `buildPrompt()` in that file, plus
whatever notes the user types in on the customer page (e.g. "warm white
only, add a wreath on the gable") get appended.

## Project structure

```
app/
  page.tsx                    dashboard: add customer + customer list
  customers/[id]/page.tsx     customer detail: generate + view mockups
  api/customers/route.ts      GET (list) / POST (create) customers
  api/customers/[id]/route.ts GET one customer + their mockup history
  api/mockups/route.ts        POST: upload photos, call AI, save everything
lib/
  db.ts                       SQLite schema + queries
  generateMockup.ts           the OpenAI integration + prompt
data/                         app.db lives here (gitignored)
public/uploads/<customerId>/  saved photos + mockups per customer
```

## What I'd do next with more time

- Swap SQLite for Postgres if this needed to run on serverless hosting
  (better-sqlite3 needs a persistent filesystem).
- Add a delete/archive action for old mockups.
- Add a simple before/after slider on the mockup tiles instead of opening
  the image in a new tab.
- Queue generation jobs instead of blocking the request, since image edits
  can take 10–20 seconds.
