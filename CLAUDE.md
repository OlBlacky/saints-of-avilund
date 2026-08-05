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
- **Read `mechanics/design-principles.md` (the Rails) before authoring any new mechanic, Ability, Feat, or Quirk** — it holds the cardinal rules: small numbers, the +5 ceiling, reuse of standard ladders and cards, pacing caps, benchmarks
- Write mechanics in plain language first, formal notation second
- Do not commit unless explicitly asked
- Do not push unless explicitly asked

## Must-Never-Miss Rules

These are inlined here because this is the only file Claude auto-loads. The Required Reading below expands on them.

1. **Ask before git.** Never commit, push, or otherwise publish without explicit permission. **CLEAN** (see Shorthand Commands) is that permission.
2. **Plan first when the blast radius is real.** Architectural decisions, multi-file refactors, anything hard to reverse: plan and check in before building. Clear bug fixes and small edits: just do them.
3. **Verify, don't guess.** Never trust training data for package/tool versions — check live sources. Marking work done is a claim that it works: run it, test it, open the page. If you can't verify, say so.
4. **Tests are part of the work.** New logic in `app/` ships with tests (Vitest). Rules-engine code especially — pure functions, testable without mocks.
5. **Red-team non-trivial changes.** Before finishing anything that touches shared structure or data models, ask "is there a more elegant way?" and "how does this break?" If a fix feels hacky, redo it.
6. **Learn from corrections.** When the user corrects you, append the pattern to `.claude/LESSONS.md`, and read that file at the start of a task.

## Required Reading

Not auto-loaded — open these at the start of a task:

- `.claude/WORKING_AGREEMENT.md` — how we collaborate on this solo project. Applies to every task.
- `.claude/ENGINEERING.md` — code, test, and site conventions. Applies whenever you write or change code in `app/`.
- `.claude/LESSONS.md` — running log of corrections and patterns to avoid.

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

**Images (standing order):** every content page must carry at least one image, and content pages should be kept short enough that a single image feels like sufficient visual interest. If a text runs long, split it into smaller pages (the multi-part `texts` reader) so each page is short enough to stand on one image.

**Library entry headers (standing order):** every Library entry's first content page (single doc, or the contents page of a multi-part work) must show at the top: **Author**, **Publication Date**, and optionally **Context**. Set `author` and `date` in the frontmatter (library docs) or in the `WORKS` entry (multi-part works in `src/lib/texts.ts`). The `kind` field is the optional Context (rendered as the eyebrow above the title). Render order: Context → Title → Author · Date.

**Artist credit (standing order):** any Source Material that carries artwork must also credit the **artist** at the top, in the same fashion as the author, with the **art medium** noted (e.g. *Albrecht Türmann of Waldheim · Woodcut* on _Adnihilo Inter Nos_). Set `artist` and `medium` in the frontmatter (library docs) or the `WORKS` entry (multi-part works). It renders as a second byline line just under Author · Date. Only credit a named artist; leave it off where the illustrator is unknown.

---

## Primary User

Non-developer founder/designer. Plain language always. No assumed technical knowledge.
