# Lessons

A running log of corrections and patterns. Claude appends an entry whenever Les corrects it: the rule first, then **Why** and **How to apply**. Read this at the start of every task.

## Demos speak the project's language, and state their purpose first

**Why:** the first engine demo page (Aug 2026) dressed its sections as "Act I–IV" and led with a raw event ledger, with no statement of what the page was for. Les couldn't tell whether he was looking at a product proposal, a character presentation, or a test — and the invented theatrical labels matched nothing in the project's vocabulary (which already bans decorative naming).

**How to apply:** any demo or presentation artifact opens by saying what it is and is not ("engineering proof, not a design"); section labels use the project's own terms (the Diary/event log, the Sheet, the validator) or plain descriptive ones; and the content order serves the viewer's question, not the system's internal causality, unless the causality is the point being demonstrated — in which case say so explicitly.

## Player-facing rule text: state the rule, then stop

**Why:** a builder tooltip read "…one Minor and one Major advance per Level — the 0-level allotment included." Les (Aug 2026): "I ALWAYS dislike your narratives after the description" — the trailing em-dash clause was an authorial aside restating an edge case the rule already covered, and it could be omitted entirely.

**How to apply:** in tooltips, help text, and card text, write the rule as plain declarative sentences and end there. No trailing "— …" afterthought, no parenthetical reassurance, no edge-case footnote unless the edge case changes what the player does. If a clarification genuinely earns its place, give it its own plain sentence — and first ask whether it is needed at all.

## Player-facing text never explains the machinery

**Why:** the builder's finale blurb spelled out the seesaw ("pairs a Good Quirk with Bad Gear… 200 sp for Bad, 150 for Neutral, 100 for Good"). Les (Aug 2026): this breaks the Setting/System theme of **Mystery and Discovery** — "we don't owe players an explanation." He would say only: they are rolled randomly together, two rerolls, keep the last. The same principle already existed as "players are never shown the table" (quirks) and "no teasers, no stubs" (Chronicle) — this extended it to *all* player-facing UI text.

**How to apply:** player-facing text states what the player does and what they got — never how the system decided. No pool names, no category tags on rolled results, no odds, no compensation logic, no breakdown labels that name hidden machinery. The full explanation lives in the design records (`mechanics/`, the builder spec) for us; the players get the experience. When writing any player-visible string, ask: does this describe *their* action or *our* mechanism? Cut the mechanism.
