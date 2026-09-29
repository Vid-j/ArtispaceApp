# Artispace

Where emerging artists and the galleries looking for them find each other.

Artists build a portfolio they design themselves, hung like an exhibition rather than posted to a feed ("hung, not posted"). Galleries, curators and commissioners describe their program. A matching engine built on **context, not popularity** connects the two sides and shows the reasons for every match.

This repository is the real build (Next.js + Supabase). The planning work that came before it lives in the **artispace-handoff** package, summarised below.

---

## Running the app

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:3000. From the parent `Artispace` folder, `.claude/launch.json` defines an `artispace-dev` configuration that runs the same command.

Supabase needs two environment variables in `.env.local` (not committed):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## What is built so far

| Path | What it does |
|---|---|
| `src/app/page.tsx` | Landing page: a full-screen live painting (WebGL canvas) with the hero copy, "Create your portfolio" and "Find artists" buttons, and a wall label ("Untitled, painting now") with a pause control. |
| `src/lib/live-painting.ts` | The generative painting: shader-based flow field blending strata, rosettes, facets and blocks, plus texture presets. Falls back to a static element when WebGL is unavailable. |
| `src/app/texture-lab.tsx` | Dev-only panel (shown when `NODE_ENV=development`) for tuning the painting texture: bristle streaks, sharpen, soften, relief, gloss, linen weave, grain, riso offset, calm flow. Settings persist in localStorage under `artispace-texture`. |
| `src/app/site-header.tsx` | Shared header: wordmark, section tabs (Portfolios, Discover, Galleries & curators) and Sign in. All link to the coming-soon page for now. |
| `src/app/coming-soon/page.tsx` | "Still in the studio" page previewing the three sections with invented example artists, a search mock and an open call mock. |
| `src/lib/supabase/` | Browser and server Supabase clients (`@supabase/ssr`). |
| `supabase/migrations/001_initial.sql` | First schema: `profiles`, `posts`, `galleries`, `gallery_items`, with row-level security (public read, owners manage). |

The earlier `dashboard` and `feed` pages have been removed.

---

## Handoff summary

Source: `artispace-handoff` package (currently at `Downloads/artispace-handoff/artispace-handoff`). Its `CLAUDE.md` is the most complete record of decisions; the detail lives in its `docs/` folder.

### Handoff contents

- `CLAUDE.md`: every decision made during planning.
- `docs/product-spec.md`: problem, journeys, matching engine, data model, business model, architecture, roadmap, risks.
- `docs/brand-guide.md`: logo rules, palette, typography, wall label, voice.
- `docs/prototype-notes.md`: how the single-file prototype works.
- `docs/Artispace_Collaborator_Brief.docx`: 20-page brief and brand guide.
- `prototype/artispace.html`: working vanilla JS prototype (open in a browser) and screenshots.
- `design/canvas-source/`: source of the design canvas boards (concept, mood board, brand, three landing explorations). They need the claude.ai canvas runtime to render; read them for layout, copy and colour logic.
- `brand/logo/`: logo SVGs and PNGs, app icon. `brand/Gloock-Regular.ttf`.
- `brand/references/`: original logo sketch, neutral palette reference, texture references, approved white-on-dark lockup.

Live links (open while signed in to claude.ai):
- Prototype: https://claude.ai/artifact/HKmaLdmu1uZiVUTQ7WzVoh
- Design canvas: https://claude.ai/artifact/QPdrsE1dtbLWk3WFr5ZPj3
- Pitch deck: https://claude.ai/artifact/GeweMMgSEdTm1AbuZHnmqR

### Settled decisions

- **Core users:** emerging artists, defined by career stage, not age (no long-term representation, few or no solo shows).
- **Opportunity side:** galleries, independent curators, artist-run centres, juried exhibitions, commissioners. The public audience is a secondary benefit.
- **Discovery:** ranked by fit (medium, shared themes, adjacent themes, city, budget). Never by likes, followers or posting frequency. Every match explains itself. A share of exposure is reserved for newer artists.
- **Two-way:** artists see curators ranked for them; curators see artists ranked for their program. Introductions go both ways.
- **Pricing:** artists $5 CAD/month (about $48/year annual). Curators and galleries pay more, in tiers (prices TBD). Free pilot for founding curators. Never charge artists submission fees.
- **First market:** Toronto.
- **Stack:** Next.js + Tailwind, Supabase (Postgres, auth, row-level security, pgvector), Cloudflare R2 with pre-generated display sizes, Vercel, Stripe.
- **Logo:** Vee's hand-drawn mark (a line looping into a frame in perspective, hatched floor) beside a lowercase "artispace" wordmark in Gloock. Always one colour: black #1C1C1B on light, white on dark. Simplified mark below about 64 px.
- **Type:** Gloock (display) and Figtree (text).
- **Site palette:** Onyx #1C1C1B, Walnut #6A5D52, Ash #979086, Greige #B7AC9B, Stucco #E2E2DE. Red Dot #C8322B only for "sold".
- **Landing page:** the only place with the full colour wheel. The top banner stays neutral (Onyx).
- **Voice:** plain, specific, warm, never hyped. "Not now", not "Rejected". No em dashes in anything written for Artispace.

### Matching engine (prototype scoring, out of 100)

| Signal | Points |
|---|---|
| Medium overlap | 25 |
| Direct shared themes | 15 each, max 45 |
| Adjacent themes (theme graph) | 7 each, max 21 |
| Same city (6) or curator works nationally (3) | up to 6 |
| Available work within curator budget | 5 |
| Likes, followers, posting frequency | never used |

Production plan: CLIP image and text embeddings in pgvector for visual adjacency, capped curator-action affinity, reserved exposure for newer artists, audits for popularity creep.

### Target data model

Artist, Artwork (title, year, medium, category, width, height, price, availability, series, tags), Series, WallLayout (JSON blocks: series, work, pair, text, space), Theme, Organization (type, city, scope, budget, program text, themes, media), OpenCall, Submission, Selection, Introduction, Shortlist, ActivityEvent.

### Open decisions (ask Vee before assuming)

1. **Accent colour** for actions and match scores. Recommended Cobalt #3346C8; alternatives Viridian #1F6F5C, Rose madder #C2305F, Cadmium yellow #E8B21E (dark only).
2. **Landing texture direction:** A pinned swatches, B glass tiles, C colour wheel collage. The current live painting is a fourth direction and should be weighed against these.
3. **Artist wall styles:** coloured walls or tonal walls from the neutral palette.
4. Curator prices, roadmap dates, collaborator terms.

---

## Gaps between the handoff and this repo

- **Fonts:** the app loads Bricolage Grotesque and Newsreader; the brand calls for Gloock and Figtree.
- **Palette:** `globals.css` uses its own warm tones (ink #1C1714, paper #EFE8DC, focus #B3541E) rather than Onyx, Walnut, Ash, Greige and Stucco. Tailwind has no brand tokens yet.
- **Wordmark:** the header renders "Artispace" as text; the brand calls for the lowercase logo lockup from `brand/logo/`.
- **Schema:** `001_initial.sql` models a post and gallery feed (`posts`, `galleries`). The target model is artworks with wall label fields, wall layouts, organizations, open calls, selections, introductions and themes.
- **Copy:** the coming-soon examples are set in Rotterdam, Dakar and elsewhere; the first market is Toronto. The hero says "professional artists" where the handoff focuses on emerging artists.
- The handoff prototype, brief colour section, mood board and pitch deck still use the earlier palette (Gallery Wall #ECEFEA, Ink #1C2230).

## Next steps

1. Confirm the accent colour and landing direction with Vee.
2. Bring fonts, palette tokens and the logo into the app.
3. Replace the initial schema with the target data model (migration `002`).
4. Build the artist portfolio (wall editor) first, since it is useful on day one, then matching and curator tools.
