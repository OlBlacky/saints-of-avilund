# Lessons

A running log of corrections and patterns. Claude appends an entry whenever Les corrects it: the rule first, then **Why** and **How to apply**. Read this at the start of every task.

## Never define a component inside another component's render

**Why:** the Companion box (Aug 2026) was a component defined inside CreationFlow. Every keystroke in its Name field re-rendered CreationFlow, minted a new component identity, and Preact rebuilt the subtree — dropping input focus after every letter. Les: "Every time I type a letter, I have to reclick the cell."

**How to apply:** helpers that render JSX inside a component either live outside the component (stable identity, context passed as props) or are plain functions invoked as `{helper(props)}` — never `<Helper />` — so no component boundary exists. Any nested render helper containing an `<input>` or `<textarea>` is the red flag; buttons tolerate identity churn, focus does not.

## Demos speak the project's language, and state their purpose first

**Why:** the first engine demo page (Aug 2026) dressed its sections as "Act I–IV" and led with a raw event ledger, with no statement of what the page was for. Les couldn't tell whether he was looking at a product proposal, a character presentation, or a test — and the invented theatrical labels matched nothing in the project's vocabulary (which already bans decorative naming).

**How to apply:** any demo or presentation artifact opens by saying what it is and is not ("engineering proof, not a design"); section labels use the project's own terms (the Diary/event log, the Sheet, the validator) or plain descriptive ones; and the content order serves the viewer's question, not the system's internal causality, unless the causality is the point being demonstrated — in which case say so explicitly.

## Player-facing rule text: state the rule, then stop

**Why:** a builder tooltip read "…one Minor and one Major advance per Level — the 0-level allotment included." Les (Aug 2026): "I ALWAYS dislike your narratives after the description" — the trailing em-dash clause was an authorial aside restating an edge case the rule already covered, and it could be omitted entirely.

**How to apply:** in tooltips, help text, and card text, write the rule as plain declarative sentences and end there. No trailing "— …" afterthought, no parenthetical reassurance, no edge-case footnote unless the edge case changes what the player does. If a clarification genuinely earns its place, give it its own plain sentence — and first ask whether it is needed at all.

**Recurrence (Aug 16 2026) — item notes.** The Moorish Pasty read "Consuming it grants 1 Temp HP until your next full rest. One ration's benefit at a time." Both halves were cuttable: the second sentence restated a *global* rations rule on a single item, and "Consuming it grants" narrated an action the item type already implies. Correct note: "1 Temp HP until your next full rest." Two tests for any item note — (1) does this sentence state what *this* item does, or a category-wide rule that belongs in the rules text? (2) can the leading verb phrase go without loss? If a rule governs a whole class of items, it lives in `mechanics/` once, not on every card.

## Never add flavour text that wasn't asked for

**Why:** the Belt pouch carried an authored note — "Coin and small trinkets, at the belt…" — that Les never requested. Les (Aug 2026): "You don't need to add any colour text I don't specifically ask you for and approve." Unrequested colour is in my voice, not his, and he ends up rewriting or deleting it.

**How to apply:** when authoring data or UI — items, cards, Quirks, Feats, blurbs, tooltips — write the mechanics and stop. Leave descriptive/flavour fields empty unless Les asked for that text and approved it. If a cue would help him write it later, say so in chat rather than committing prose to the file.

## Eligibility filters never test affordability

**Why:** the builder's Feats "Eligible" view used the full validation verdict (`why()`), so an empty Advance bank flagged every candidate and the list collapsed to "Eligible (0)". Les (Aug 2026): "I think we have a bug in the Feats." Eligibility is about the build (gates, requirements, caps); affordability is transient and belongs on the buy control, which disables with its reason.

**How to apply:** when filtering a list of purchasable things down to "what this character qualifies for", ignore `insufficient-advances` (and any other purse-of-the-moment flag) — filter on the remaining flags only. The Take/Buy button keeps the full verdict.

## Player-facing text never explains the machinery

**Why:** the builder's finale blurb spelled out the seesaw ("pairs a Good Quirk with Bad Gear… 200 sp for Bad, 150 for Neutral, 100 for Good"). Les (Aug 2026): this breaks the Setting/System theme of **Mystery and Discovery** — "we don't owe players an explanation." He would say only: they are rolled randomly together, two rerolls, keep the last. The same principle already existed as "players are never shown the table" (quirks) and "no teasers, no stubs" (Chronicle) — this extended it to *all* player-facing UI text.

**How to apply:** player-facing text states what the player does and what they got — never how the system decided. No pool names, no category tags on rolled results, no odds, no compensation logic, no breakdown labels that name hidden machinery. The full explanation lives in the design records (`mechanics/`, the builder spec) for us; the players get the experience. When writing any player-visible string, ask: does this describe *their* action or *our* mechanism? Cut the mechanism.

## A rule the build unlocks must reach the sheet as arithmetic

**Why:** Wulfric took Specialization — Heavy Blades, and Martial Strike's Longsword line still read `+4 vs AC · 1d8 + 1` — the Hook lived only in the card's build-time option block. Les (Aug 2026): "Math has to math." A number the player has to remember to add is a number that gets forgotten at the table.

**How to apply:** when a Feat, Quirk, or Hook grants a bonus, it lands in the line the player actually rolls from — the weapon row, the Attacks table — with the source named in the breakdown tooltip. State it as text only when the sheet cannot judge the condition ("within the first increment"), and never both, or it gets counted twice. Authored prose that carries math needs a parser with a data-gate test that fails, named, when a new line is worded outside the vocabulary.

## Broaden the permission allowlist instead of asking again

**Why:** the project allowlist was a pile of one-off literal commands, so ordinary `pnpm build` / `pnpm vitest` runs prompted every time. Les (Aug 2026): "quit asking me all the time."

**How to apply:** when a routine command prompts, add a prefix rule (`Bash(pnpm:*)`, `PowerShell(Get-ChildItem:*)`) to `.claude/settings.json` rather than accepting the prompt as the cost of doing business. Build, test, and read-only inspection commands belong on the list permanently.

**Recurrence (Aug 18 2026) — page ledes.** The Campaigns page carried an authored lede ("A Campaign gathers a DM, players, and their characters…") that Les removed: "Please don't add in words where I don't ask you to." The rule covers page introductions, ledes, and section blurbs, not just item notes and card text — a new page gets its heading and its machinery; any framing prose is Les's to write.
