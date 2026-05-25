# CLAUDE.md — Saints of Avilund

This file provides Claude Code with persistent context for working in this repository.

---

## What This Project Is

Saints of Avilund is a tabletop RPG (TTRPG) with a planned browser-based companion application.

Current phase: **TTRPG mechanics design**, plus a **setting-compendium website** in `app/` — the project's first code (begun May 2026).

Long-term goal: a browser-based app with a rules reference, character generator, and GM tools. The website is the first step toward that app: it begins as a lore/setting compendium (the saints, the Library, history, geography) and will grow to include rules and tools as the mechanics stabilize.

---

## Repo Layout

```
mechanics/        # The design layer — raw rules as they actually work
  characters/     # Character creation, classes, skills, advancement
rulebook/         # Players Rule Book — formatted, player-friendly prose
setting-book/     # Players Setting Book — in-world documents (epistolary)
gm/               # Game Master folder — secrets, encounters, campaign tools
app/              # Browser companion app — an Astro website (the setting compendium); see "The Website" below
source/           # Original source archive — reference only
```

---

## Working Conventions

- Primarily a design and documentation project; the one code component is the website in `app/` (see "The Website" below)
- Write mechanics in plain language first, formal notation second
- Do not commit unless explicitly asked
- Do not push unless explicitly asked

## Shorthand Commands

**CLEAN** — When the user writes this word, commit all outstanding changes and push to remote (sync). Stage everything, write a sensible commit message based on what changed, commit, and push.

---

## The Website (`app/`)

An **Astro 6** static site — a setting compendium — deployed to **GitHub Pages** at `https://olblacky.github.io/saints-of-avilund/`. Modeled on the Daggerdale campaign site.

**Stack:** Astro 6 + MDX, Pagefind (full-text search), SCSS, pnpm. Deploys via GitHub Actions (`.github/workflows/deploy.yml`) on pushes that touch `app/`.

**Dev commands** (run inside `app/`): `pnpm install`, then `pnpm dev` (localhost:4321), `pnpm build`, `pnpm preview`.

**Where content lives (in `app/src/`):**
- `lib/saints.ts` — the saint catalogue data (33 saints + Minores): tiers, offices, Fundatores, blurbs. The catalogue index and per-saint pages are generated from this file.
- `content/library/` — in-world texts as markdown with frontmatter (e.g. On the Side of Heaven). Copied from `setting-book/`.
- `pages/` — routes: home, `saints/`, `library/`, `history/`, `geography/`, `search/`.
- `styles/global.scss` — the parchment / ecclesiastical theme.

**Editing the saints:** edit `app/src/lib/saints.ts`; keep it in sync with the canon in `setting-book/` and memory.

**One-time setup:** in repo Settings → Pages, set the source to "GitHub Actions" so the workflow can publish.

**Cross-referencing (standing order):** when writing site content, hyperlink named entities (saints, places, documents) that have their own page — wiki-style. Saints link to `saints/<slug>/`.

---

## Primary User

Non-developer founder/designer. Plain language always. No assumed technical knowledge.
