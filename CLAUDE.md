# CLAUDE.md — Saints of Avilund

This file provides Claude Code with persistent context for working in this repository.

---

## What This Project Is

Saints of Avilund is a tabletop RPG (TTRPG) with a planned browser-based companion application.

Current phase: **TTRPG mechanics design only.** No code, no digital systems yet.

Long-term goal: a browser-based app with a rules reference, character generator, and GM tools. Mechanics come first; the app is built once rules are stable.

---

## Repo Layout

```
mechanics/        # The design layer — raw rules as they actually work
  characters/     # Character creation, classes, skills, advancement
rulebook/         # Players Rule Book — formatted, player-friendly prose
setting-book/     # Players Setting Book — in-world documents (epistolary)
gm/               # Game Master folder — secrets, encounters, campaign tools
app/              # Browser companion app — specs now, code later
source/           # Original source archive — reference only
```

---

## Working Conventions

- This is a design and documentation project for now — no source code
- Write mechanics in plain language first, formal notation second
- Do not commit unless explicitly asked
- Do not push unless explicitly asked

## Shorthand Commands

**CLEAN** — When the user writes this word, commit all outstanding changes and push to remote (sync). Stage everything, write a sensible commit message based on what changed, commit, and push.

---

## Primary User

Non-developer founder/designer. Plain language always. No assumed technical knowledge.
