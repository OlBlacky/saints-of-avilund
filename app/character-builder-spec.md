# Character Builder — Specification

The working spec for the Character Builder, a new section of the website. Built up chunk by chunk in conversation; each section below is a settled decision. **No building until the whole machine is specced.**

---

## 1. Commercial Posture & Portability

**The plan:** the builder attaches to the existing compendium site now. Eventually the whole site becomes a commercial product at a proper domain — and that move should be a button-press, not a rebuild.

**What's free vs. paid:** the game itself is free — compendium, rules, and the builder, all of it. The only pay-gated products will be the GM's manual and adventures. Those live outside this repo entirely (the repo is public; GM secrets are already banned from it), so the paid layer will be a separate service added alongside the free site when the day comes.

**The free/paid line and the account line are different lines.** All static content (rules, compendium, lore) is browsable anonymously, forever. Characters and Campaigns are the account-holding part of the commercial site — still free, but behind a sign-in. See §2 for the roles, and note the v1 build has no accounts at all (local-first; §2 "Timing").

**Three build rules that follow:**

1. **No hardcoded addresses.** Every link and asset path goes through Astro's `site`/`base` config. Moving from `olblacky.github.io/saints-of-avilund/` to a custom domain must be a config change plus a CNAME — nothing else.
2. **The builder is a bounded module.** Its code, pages, and styles live in clearly-marked folders of their own, touching the compendium only through defined seams (shared layout, shared theme, the data layer).
3. **Rules data is its own layer.** All game data (classes, abilities, ladders, feats) lives in typed data modules with no knowledge of presentation — the same pattern as `saints.ts`. The data layer is the long-term asset; the builder is just its first consumer, and any future product (GM tools, exports) feeds from the same source.

---

## 2. Users, Roles & Access

**How people interact with the commercial site:** anyone can browse the static site (rules, compendium, lore) like any other website, no account needed. An account unlocks the interactive parts: **Characters** and **Campaigns**. Accounts are free — the pay-gate (§1) is only on GM products, not on having an account.

### Site-wide roles

| Role | Who | What they get |
|---|---|---|
| **Visitor** | anyone, no account | All static content. Can try the builder as a sandbox — nothing saves. |
| **Member** | free account | Owns Characters. Can create and join Campaigns. |
| **Admin** | Les & Gus | Everything, plus draft/playtest content (unfinished classes, variants) hidden from ordinary visitors. |

### Per-campaign roles — where the real RBAC lives

A Character belongs to one Member. A Campaign links Members together, one of them as GM.

| Role | What they get |
|---|---|
| **GM** | Created the campaign. Invites players, sees every character in it, attaches adventures/GM material (the eventual paid layer) to it. |
| **Player** | Joined by invite. Brings a character; sees their own material and whatever the GM shares. Whether players see each other's sheets is a GM toggle. |
| **Quartermaster** | A player role over the Party Inventory: any character can *put in*; only Quartermasters can take out, sell, or distribute. Players choose their Quartermaster(s); the GM assigns the role. |

### Timing — local-first now, accounts later (decided)

The v1 builder has **no accounts and no backend**. Characters save to the user's own browser (their device is the database), with export-to-file and print so nothing is ever trapped. The Character and Campaign data model is designed *as if* accounts exist, so when the commercial backend arrives it slots in underneath — sign-in appears, local characters upload, nothing gets rebuilt.

---

## 3. Character States & Versions

A **Character** is an identity — name, portrait, concept, description — owned by a Member. It isn't itself playable; it's the thing versions are versions of.

### Versions

Playable sheets are **versions** of a Character. A version is forked from the Character (or from another version), and **once forked it is tethered to nothing** — it starts as a copy of the identity and the source build, but nothing ever syncs afterward, in either direction. It's *similar* to its siblings, with no real association. A character renamed in one campaign stays renamed only there. Alternate universes, fully independent.

Two kinds of version:

| | **Official version** | **Sandbox build** |
|---|---|---|
| Belongs to | one campaign | nobody — scratch space |
| Changes by | **granted events** — GM awards a milestone, player spends the advances; gear and handouts arrive because the GM handed them out | free editing |
| History | append-only change log; the sheet is always audit-able back to legal | none |
| Lifespan | permanent (see End states) | disposable |

The classic sandbox use: fork your official sheet, preview next level, throw it away. Sandboxes can also start fresh — playing around with builds requires no campaign and no Character.

### Joining a campaign

The GM sets the campaign's entry level. The player builds (or forks) a version to match. The GM approves it, and it becomes the character's official version in that campaign.

### v1 (local-first) behaviour

With no accounts there's no GM connected, so the granting machinery can't be *enforced* — but the local builder still **simulates the shape**: you mark "milestone granted" yourself, gear is added as granted events, and the log accrues exactly as it will under real accounts. One data model from day one; honest tables get the audit trail now.

**v1 shows one version per Character** (ruled Aug 11 2026): the roster presents each Character as a single playable sheet. The file format still models identity + versions from day one — the machinery stays under the hood until Campaigns make forks real.

### End states

**Dead** and **Retired** versions are kept forever — memorials, not garbage. Deleting a character (or any official version) should be genuinely hard: deliberate confirmation, never a casual swipe, never a side effect.

---

## 4. The Chronicle

The Chronicle is the lore of the game, as a corpus of **Chronicle Entries** ("CE" — settled term). A CE is a discrete text, roughly the size and shape of a Library document. Every character offers a **Chronicle view** — a sibling view to the Character Sheet (opening a Character, you choose one or the other): the world's lore as *that character* knows it, one reader merging the public corpus, the Party Chronicle, and everything they've been granted.

**The Map Book** (added Aug 11 2026): a section of the Chronicle whose entries are maps — and they behave exactly like CEs. Everyone starts with some (the public corpus — the continent, the city); others are **discovered, earned, or activated in a campaign** through the same granting machinery, with the same visibility rule (locked maps are invisible, no teasers), provenance, and sharing. A Campaign's maps come from its Adventure Module (§12): some reveal **on enrollment**, others the **DM activates later**.

### Visibility

Every CE is either **public** (on the website, anyone can read — the existing compendium material) or **assignable** (locked until granted). Locked entries are **invisible** — no teasers, no "entry 34: ungranted" stubs, and never a browsable list to pick from. Avilund is a mysterious place that doesn't owe the players an explanation.

**Spoiler posture:** pre-commercial, assignable CEs may live in the public site bundle (unlisted, not truly secret) — we're not worried about determined snoops before launch. Real secrets — CEs belonging to paid adventures — arrive later with the backend/paid layer and never touch this public repo.

### How lore reaches a character

Granting a CE is the §3 granted-event machinery — **handouts and CEs are the same system**, logged on an official version, copied-then-untethered on fork. Routes in:

1. **The GM's Distribute button** (campaign era) — the party discovers something; the GM clicks distribute; the lore appears on those characters.
2. **Entry codes** — every assignable CE has a short code; a printed adventure or a GM at the table says "you've earned K-17," the player types it in, the grant is logged. The primary route in v1 (no GM connected). Feels like opening a sealed envelope.
3. **Character creation grants** — some Backgrounds (and possibly other build choices) come with starting lore, auto-granted.

### Targeting & sharing — the Party Chronicle and private grants

The DM issues a CE to one of two targets:

- **The Party Chronicle** — a Chronicle belonging to the *campaign* itself. Every enrolled character's Chronicle view merges it in alongside their personal entries and the public corpus.
- **A specific character** — a private grant: the scrap of paper only he was meant to read. Visible to that character (and the DM) alone.

**Sharing:** the holder of a private CE may choose to share it. Once shared, the CE enters the receiving characters' Chronicles **permanently — sharing is irreversible** (perfect record-keeping and/or memory is assumed; you cannot unread the letter). The provenance chain (§ Provenance) extends accordingly: *granted to Piotr by the DM, Session 3; shared by Piotr with the party, Session 5.*

Sharing may target **the entire party or just selected characters** — conspiracies within the party are fully supported. And a character **joining a campaign late sees the full Party Chronicle**, history included: it belongs to the campaign, not to the moment you arrived (the DM issues privately when something shouldn't reach newcomers).

### Homebrew & player-authored CEs

GMs can author their own CEs for their table — homebrew entries live alongside canon ones in their campaign, marked as such.

**Players write CEs too.** A player may author a CE on their own character — journal entries, in-character letters, a record of what the party saw — which enters their Chronicle and can be shared like any private CE (party-wide or selected characters). Submitted journals are a rich way to grow a campaign's Chronicle. The **Origin** tag gains a third value: Canon / Homebrew *(GM)* / **Player**.

### Tags & classification

Each CE carries:

- **Origin:** Canon / Homebrew.
- **Sort:** General Lore vs. Adventure — the player-facing split for filtering the reader.
- **Topic tags** (optional, small set): saint, place, era, subject — reusing the compendium's existing vocabulary. Exact tag list settled when the entry corpus is inventoried.

### Provenance — the character's copy has its own story

The canon text of a CE is immutable, but each granted copy carries in-campaign metadata: **when** it was received, **from where/whom** (session, place, the NPC who handed it over), stamped at grant time. Room is left for player margin-notes on their own copy later. Two characters holding the same CE hold the same text with different histories — which is very Avilund.

---

## 5. Scope & Play Model

**We are not making a self-contained game.** The product is three things: the **Setting** (compendium + Chronicle), the **System** (rules + builder), and the **System of Record** (Characters and Campaigns — the authoritative state of who exists, what they have, and what happened). Play happens elsewhere — at a table with printed sheets, maps, and real dice, or on a VTT (a Foundry VTT source pack is planned). The site is what you consult before the session and update after it.

### In and out of scope

- **Out:** play-time tools — dice rollers, initiative trackers, combat automation. That's the table's job, or Foundry's.
- **In:** a **phone-friendly character sheet and Chronicle reader** — for reference at the table without printing.
- **In:** excellent **print output** — character sheets, Ability cards, CE handouts (the sealed envelope, literally), adventure text and maps.
- **Someday:** Foundry export. One-way, site-authoritative — the source pack ships setting + system into Foundry; characters export outward. Two-way sync is explicitly not being designed for yet. But **everything we build must be translatable to a Foundry package** — this is a standing engineering rule (see `.claude/ENGINEERING.md`): structured data over prose, stable IDs, machine-readable effects.

### The Session log — the meta-Chronicle

Campaigns are made of **Sessions**, and the Session is a real object in the record: who played, when, what happened, and the granted events that hang off it (milestones, gear, CEs distributed, loot). The Session log sits alongside the Chronicle as its meta-layer: players see who played last weekend and what happened, then follow the link into the Chronicle to read the CE that was awarded that night. Campaigns get a journal for free.

### Pretty from the get-go

No functional-first-beauty-later phase. The parchment aesthetic, proper typography, sheets worth handing out — from v1. First real audience: **playtest with Les's group in roughly October 2026.** Best foot forward.

---

## 6. The Creation Flow

Creation has three parts with three different rules of motion: a free-edit box, an ordered spine, and a rolled finale.

### The Identity Box

Top-line details — name, height, weight, age, appearance — live in a box that's editable at any moment during creation, in any order, with no mechanical consequences.

**Place of Origin has graduated out of the box and into the spine** (Aug 13 2026), as the watch-item anticipated. It is now a recorded creation choice (`origin-chosen`), it locks at crystallization, and it carries two mechanical consequences: it **dictates the Home Language** — the free second tongue is the vernacular of where you were raised, never a separate pick — and it **gates the Regional Market Feats**, which the replay now enforces rather than merely hiding. The registry of places is `app/src/lib/places.ts`, one list serving the origin dropdown, the Quirk `{place}` slot, and the Feat gates. It still displays in the Identity Box, read-only once crystallized. Weighting the Starting Gear draw's `{place}` fills toward home remains unbuilt.

### The Spine — ordered, reversible, keep-and-flag

The mechanical build is step-wise by nature and done in order, following the live Character Creation page (the current canon): **Class → Subclass → spend 11 Major Advances (Attributes, Abilities, extra Classes) → spend 11 Minor Advances (Offences/Defences, HP, Skills, Proficiencies, Feats, languages)**. Each step unlocks the next. The optional **Flaw** (up to 2 Attributes to −1, +1 Major each) is not a separate step: stepping an Attribute below +0 in the Attributes list takes it, with the rule on the control's tooltip (ruled Aug 7 2026). **The first Ability from each of the first Class's two Categories is free** (ruled Aug 12 2026 — builds were converging on 1–2 Abilities because Attributes ate the Majors); every further Ability costs 1 Major, added Classes grant no freebies (multi-classing interplay deliberately parked until after the first playtest block), and the freebie follows the Category under keep-and-flag (engine: `abilityCost` in `lib/record/replay.ts`). Walking back is always allowed, and edits at the front invalidate work at the back under one policy:

**Keep-and-flag, never wipe.** Change an upstream choice and every downstream choice that's still legal survives untouched; now-illegal choices (an Ability from an abandoned Subclass's Category, say) become visible errors — "no longer available, replace this" — which block *finishing* creation, never *browsing* it. Silently deleting a player's choices is the cardinal sin.

### The Finale — Quirk & Starting Gear, the point of no return

Last comes the game's quirkiest moment. **Quirk and Starting Gear are rolled, together, as one package** — a specific feature (and a strange, maybe-powerful, maybe-not bit of unique gear: a cursed rabbit's foot, a rare musket, a broken orb) that the character didn't bargain for.

- **The app rolls digitally.** No table dice, no typed-in results.
- **The seesaw (confirmed Aug 7 2026, built):** Quirks and Gear each come in three categories — Bad / Neutral / Good — and the package balances them: a Bad Quirk pulls a Good Gear roll, and vice versa; Neutral pulls Neutral. Category rolls first, even thirds; then a uniform draw within each pool. The wildness lives inside each roll; only the sum is tamed — no double-cursed starts, no double jackpots. Categories are judged by the **mechanical net alone** (the esoteric sting never counts). Engine: `rollPackage` in `lib/gear.ts`; design record in `mechanics/characters/quirks.md`.
- **Rerolls: 2, take-the-last.** A reroll rerolls the *whole package* — Quirk and Gear update together (the seesaw makes every reroll a devil's bargain, not shopping). Each reroll discards what you had; there is no going back and no picking among results seen. Accept the current package (or exhaust your rerolls) and the character can be **Finished**: the spine locks, creation ends, and the character is **Complete** (term ruled Aug 11 2026 — "crystallize" is retired as a verb; the event id `crystallized` stays frozen in the log format).
- **Sandbox builds reroll freely** — it's the play-around space, and the GM-approval gate (§3) protects campaigns from Quirk-fishing.
- **Starting coin** (decided Aug 7 2026, built): fixed by the **Gear** category — Bad Gear 200 sp / Neutral 150 sp / Good 100 sp. The Quirk plays no part. Not rolled: the package already carries all the dice this step needs. Derived from the gear card at replay (`STARTING_COIN` in `lib/gear.ts`); becomes the Wealth ledger's opening balance when Markets land. **Deliberate asymmetry:** Bad and Neutral starts net ≈ 200 sp; a Good gear start **nets a little more** (100 sp + a 150–350 sp thing) — an unasked-for windfall is allowed to overshoot.
- **Context-aware draws (planned, decided Aug 7 2026 — not yet built):** the gear picker will read the **character**, not just the dice. Two inputs: (1) **Proficiencies** — a character proficient with, say, Heavy Blades has a real chance that the fine weapon (or the masterwork one) is one he can actually use; likewise masterwork artisan tools and kits should lean toward his trade skills. (2) **Place of Origin** — the Identity Box's dropdown-to-be biases `{place}` fills toward home. Engine implication: `rollPackage` grows an optional character-state argument and slot draws gain weighting; pure-random stays the fallback (sandbox, demo button, no-context rolls).
- **Shopping happens last.** After the roll, creation closes with a shopping step: spend your starting coin at the Markets you can access (the open Waldheim Markets, plus anything a Quirk or Feat just opened). The Basket stays open until the flow's Finish — one act commits the Basket and completes the character. See §11 and `mechanics/markets.md`.

### Mechanics Prerequisites (authoring work this flow is waiting on)

- **Starting Gear** — ✅ the rolled-gear mechanic, its three price-anchored tables (`lib/gear.ts`, 18 cards: 6 Good / 4 Neutral / 8 Bad), and starting coin (200/150/100 sp by Gear category) all exist; still to author: more cards (Good and Neutral pools are thinner than Bad).
- **Quirk category tags** — ✅ done (Aug 7 2026): every Quirk carries a category; roster now 12 (6 Good / 3 Neutral / 3 Bad — Bad and Neutral need growth).
- **Doc cleanup** — `mechanics/characters/character-creation.md` is stale AP-era design; the live site page `system/character-creation` is the canon but needs: a check against §7's Level derivation (corrected Aug 10 2026: play begins at Level 0, Level 1 is the first Milestone — the page's "out of Level 0 and working on 1" framing is right again), and the **new Skill track** (ruled Aug 6 2026 — Untrained −1 / Trained +0, Class Skills Trained free, Ranks 1 Minor each climbing +1 → +2 @L3 → +3 @L5, off-list Trained buyable but capped +1; the page and its Gareth example still show the old "+1 any / +2 Class Skill" model). The `system/skills` page needs the same, plus a **Can't-Use-Untrained flag** inventoried across the Skill roster.

---

## 7. The Advancement Flow

### One master number

The **Milestone count** is the fundamental quantity; everything else derives from it. Nobody ever "sets level."

- **A finished character begins play at Level 0** (corrected Aug 10 2026 — supersedes "play begins at Level 1"), having spent the creation allotment (11 Major + 11 Minor). **Level 1 is the first Milestone.**
- Milestones group in **triads** (1–3, 4–6, …), and a new Level arrives at the **first Milestone of each triad**: Level 1 at Milestone 1, Level 2 at 4, Level 3 at 7. **Level = ⌈Milestones ÷ 3⌉** (0 before the first Milestone), capped at Level 11. Every Level is three Milestones, the last included: Level 11 arrives at Milestone 31 and its triad completes the **33-Milestone** journey. The once-per-Level windows already open on the same boundaries.
- **Once-per-Level allowances** (chiefly HP) refresh at the *first* Milestone of each triad (1, 4, 7, …). Attribute gates (+4 at 5th Level, +5 at 10th) and Ladder pacing (≤1 Rank per Level per Ladder) all key off the same derived level.

### Grants fill a bank; spending is separate

A granted Milestone (§3 machinery; the DM's to grant — v1 records it on the sheet at the DM's word, sourced `gm`; sandbox builds grant freely) adds **+1 Major and +1 Minor to the character's banked pool**, logged. Spending from the bank happens whenever the player likes — banking toward a big purchase is explicitly canon. Every individual purchase is its own logged event.

### Spending happens on the sheet, not in a wizard

Level-up is a small, frequent pleasure, not a ceremony. Everything buyable shows its cost *in place* — Attributes on the attribute block, Ranks on the Ability card, Feats in the browsable list — lit up when affordable from the bank. "What would I look like later?" is §3's answer: fork to sandbox and dream.

### Enforcement: hard

The builder **hard-blocks** illegal purchases — caps, pacing, gates, category access. That's what a system of record is for. GM house-rule overrides are a far-off someday feature (and will be loudly logged when they exist); they are not v1.

### Undo & Retraining

- **Undo:** purchases are freely undoable **until the next Session or Milestone is logged**. After that boundary, unwinding needs the GM — or, in v1 local, a deliberate "retcon" action that is recorded as such in the log.
- **Retraining:** once per triad (every 3 Milestones), a character may **unclick one Major purchase and one Minor purchase** and respend them. The result must still be a legal sheet — you can't retrain away something other purchases stand on (the keep-and-flag validator from §6 does this checking). Retraining is a logged, legal move — not a retcon.

---

## 8. The Character Sheet

**One sheet, one data source, three costumes.** Screen, phone, and print render the same character record — never separately-maintained layouts. Print and phone are reference-first; screen is also where spending and managing happen. The existing example sheet's structure is canonized, now at **five pages**.

### Universal principles

- **Everything derivable is derived.** Totals are computed from the record + rules data, never hand-typed. The sheet cannot drift from the build.
- **Every number shows its work.** Anything derived opens into Attribute + Ranks + named bonuses, each bonus carrying its source ("Masterwork tools +1"). No mystery modifiers, ever.
- **Conditional bonuses are labeled lines, never merged.** "AC 17 · *19 while shield raised*" — computed but kept separate; a total never lies when the condition is false. (Serves shields, stances, Load Bands, auras.)
- **Brief + full.** Every entity appearing as a sheet line (Feat, Quirk, gear property, condition…) carries two authored texts: a one-liner (small italic, on the sheet) and the full rules text (tooltip/tap on screen; Page 5 in print). No bare names.
- **Canonical order, optional presence.** Fields render in one fixed order but only when they have something to say.
- **Modes:** **play** (the default — only what the character owns; no ladders, costs, or teasers), **advance** (§7 spending — ladders with owned Ranks and priced next steps), and **Session Adjustment** (the reconciliation changeset, §13). Print always renders play mode.

### Page 1 · The Character

Identity, portrait, Class · Subclass · Level with Milestone pips. **Attributes table: ATTR · VAL · OFF · SAVE · UN · ARM** — Save is its own column (= Attribute + Defence Ranks; bonus sources can diverge from Defence). **Vitals** each decomposed (HP from base + purchases − Wounded; Speed from base − armour + recoveries; DR itemized; AC per formula), plus the **Load** line (weight · Band, thresholds computed from Str with Feat/Quirk shifts itemized — `mechanics/encumbrance.md`). **Skills** with Total · Attr · Ranks · Misc columns, Misc itemized. **Proficiencies** as a table with current rank, distinguishing *advanceable* (Class/Subclass) from *fixed at +0* (bought). **Feats** with one-liners; Feat Ladders show owned Ranks only (in play mode).

### Page 2 · Attacks & Abilities

**Abilities are cards; attacks are projections.** Every owned Ability renders as a card: header (name · category · frequency in the standard vocabulary: ∞ · ●/enc · ●/day), the cost strip (Action cost leads · Range · Targets · vs-Defence — canonical order, omit-if-empty), effect block with **numbers resolved for this build** (never `[W]+Str` — the sheet does the math), conditional hooks (Specializations), flavour behind a tap. Attack Abilities are **weapon-parameterized**: the card lists a resolved attack & damage line for **every weapon the character owns** (location noted when not in hand), and the player curates the list by hiding weapons — hidden, never deleted, as in the Attacks table. A builder copy states **what it was built around**: a choice that owns a Ladder (a Malediction) resolves that Ladder at the copy's Rank as its own row; a choice that names a damage type (a New Magic element) rides on the damage line. A **Specialization** the character actually holds for that choice prints its standing Hook on the card. The card closes with its **Keywords** (the Category's Skill and Language). The **Attacks table is auto-generated** from (attack Abilities × carried weapons) + a Basic Attack per weapon + Basic Unarmed; the player curates by *hiding* lines, never by typing them. Conditions tracker sits here.

### Page 3 · Gear

Sections: Weapons · Armour · Equipment · Wealth. Weapons and armour reproduce their **full stat blocks** (from rules data — these blocks are what pages 1–2 compute from), including weight. **Every item has a location** — the three Gear States (re-ruled Aug 14 2026, `mechanics/encumbrance.md`): **Worn** (needs the wearable tag; weightless where the item is **0-Enc**, which armour and clothing are) / **Equipped** (at the ready, a Move to draw, and it spends a slot against the **Equipped Limit** of 5 + Str + Dex + Con, min 5) / **Stored** in *[container]* / at **Home** (weightless, every character has one) / Party Inventory (campaign). *Held was cut: what is in your hands is a moment, not a state — a VTT layer may track it as runtime state, never as sheet data.* Armour is Worn and shields are Equipped, and the first of each feeds the Vitals box; a Container is always Worn, never Equipped. **Load and the Equipped Limit lead the Gear page side by side**, each showing its arithmetic, since that is where the decision is made; Load draws its whole three-Band track with the occupied Band picked out. **Containers** hold anything and carry three dials — **Capacity** (checked against raw weight), **Coefficient** (applied to contents' Load), and **Access** (the action to retrieve one item; nested Containers take the slowest link). Each prints a **box** beneath its row showing both weights — raw against Capacity, and the Load it actually costs — plus its Access and any plain rules text. Stored items never spend an Equipped slot, whatever the Access, which is what a bandolier buys. The sheet totals carried **Load** and warns in amber past either limit; neither is a wall. **The kits are Containers** (×1 — their Supplies live inside the bag), and **stacks split** (Aug 11 2026): an `item-split` event carves a quantity into a new stack with inherited provenance, which then moves, sells, or trades on its own. **Sell prices appear only where an accessible Market buys the item**, source noted ("3 sp — Black Market"), In Play filter respected. **In-box / Out-box** for transfers (player-to-player, DM grants) with quick actions: **Accept** (and place) · **Decline** · **Sell** (auto-filled best price with its math). Wealth carries a currency field (single coinage today; Currencies is a future Campaign Option).

**The sheet's arrangement is the player's** (Aug 13 2026). Stored items are drawn **nested beneath the Container that holds them**, indented one step per depth, and a Stored item draws there and nowhere else — so a packed sword leaves the Weapons block for the pack (its attack lines on page 2 are unaffected). The **order of the blocks is dragged**, not fixed: a row's name cell is its grip, dropping between rows sets the order, and dropping on a Container's middle packs the item into it. Ordering runs **within one block** — a row cannot be ordered into a block it would vanish from — while packing is accepted from anywhere on the page. Dropping beside a neighbour joins that neighbour's Container; where neither is Stored, the Gear State is the player's own and a reorder leaves it alone. The arrangement is durable, carried on `item-moved` as an optional `position` (an anchor and a side): it is a decision, so the record keeps it, and an anchor that later leaves the inventory leaves the item where it stands.

### Page 4 · Log

The character's **unified event log** (grants, purchases, retrains, retcons, gear, transfers, CEs, transactions, adjustments) **filtered to build events** — every Advance in order, the build back-trackable to legal. On screen the same log offers its other filters; print keeps the clean build log.

### Page 5 · Full Detail

Auto-generated appendix: the **full text of everything abbreviated on pages 1–4** — Feats, Abilities, the Quirk, gear properties. A printed sheet is self-contained; no devices needed at the table.

### In Play — the game-time switch

**In Play** (introduced for Markets) is the character's general game-time state. Toggling it: filters Market reach to what the DM authorized (`mechanics/markets.md`), and **enables play-state tracking** — current HP, frequency pips, active Conditions become tappable. Play-state is *scratch*: it never enters the event log and resets freely. Durable consequences reach the record through grants and Session Adjustment, not through the tap-tracker.

### Placement rulings

- **The Quirk has pride of place on Page 1** — it's who you turned out to be.
- **The Chronicle is not a sheet page.** Opening a Character offers two views: the **Character Sheet** or the **Chronicle**. (CE handouts print as individual documents.)

### No cut-out card deck (ruled)

There is **no** print option for individual cut-out Ability cards. Abilities live on the sheet: Page 2's cards on screen, the Page 2 listing + Page 5 full text in print.

---

## 9. The Data Model (draft for review)

Two layers and a bridge. **Layer A** is the game — read-only rules data shipped with the site. **Layer B** is the player's property — the character record. The bridge is the computation that turns one applied to the other into a character sheet.

### Layer A — Rules data

**One typed module per pillar**, all under `app/src/lib/` (several already exist):

| Pillar | Status |
|---|---|
| Abilities (chassis + all Category corpora) | ✅ exists (`abilities.ts`, `category-abilities.ts`) |
| Skills | ✅ exists |
| Quirks (engine, slots, typed effects) | ✅ exists |
| **Classes & Subclasses** | ❌ extract — mechanical data currently lives in markdown tables; it moves to a typed `classes.ts` and the class pages **render from data** (single-source rule; the prose and cues stay in markdown) |
| **Feats** | ❌ new — with `brief` + `full` texts and the shared effect vocabulary |
| **Gear** (weapons, armour, equipment) | 🟡 started — `gear.ts` holds the Starting Gear corpus + the package roll; still to come: stat blocks, weight, traits, sell-criteria tags, container coefficients |
| **Markets** | ❌ new — per `mechanics/markets.md` |
| Chronicle Entries | ❌ new — content collection with metadata (visibility, tags, codes) |

**Three rules that govern all of it:**

1. **Stable IDs.** Every entity — class, Ability, Feat, item, Market, CE — carries a permanent `id` that never changes once published. Renaming changes the display name, never the id. Save files, the event log, and Foundry export all reference ids only.
2. **The notation, formalized.** Card values stay authorable strings — `1[W]+Str`, `30'`, `Wis rounds`, `1/enc` — but the notation becomes *defined*: a small grammar with a build-time parser. Every value in the corpus must parse, or **the build fails loudly** with the card and field named. This is the bridge that makes twenty-six hundred existing lines of ability data machine-computable (sheet math, Foundry export) **without re-authoring any of it** — and it keeps future authoring human-friendly.
3. **One effect vocabulary.** The typed effects already in `quirks.ts` (`skillMod`, `attackMod`+condition, `grantProficiency`…) grow into the shared vocabulary for Feats, Quirks, and gear properties — the long-promised Feat/Quirk convergence, now load-bearing: it's how a Feat's +1 shows up itemized in a skill's Misc column automatically.

### Layer B — The character record

**The record is a log of events, and the sheet is always a replay.** A character file is not a bag of current numbers — it is the ordered list of everything that ever happened: every grant, purchase, roll, transfer, transaction, share, and adjustment. The "current character" is *computed* by replaying the log against the rules data. This is the design §§3–8 have been assuming all along, made explicit:

- **Audit-ability** (§3): the sheet is back-trackable because the log *is* the sheet.
- **Undo & Retraining** (§7): undo removes a recent event; retraining appends a retrain event. Nothing is ever silently edited.
- **Provenance** (§4), **transfers** (§8), **Session Adjustment batches**, **the Quirk roll with its reroll count** — each is just an event type with a payload.
- **No drift, structurally**: derived state is never stored, so it can never disagree with the build.
- **The log stores decisions, not outcomes.** Events reference rules by stable id and record the choice made — never the resulting numbers. So retuning an Ability rewrites *nobody*: every sheet replays against current rules and is simply correct on next load. Changes that invalidate a past decision surface through the keep-and-flag validator plus the rules-version stamp ("the rules changed — here's what it means for you": Chunk 2's review flow). And the growing corpus costs boot nothing: the corpus is validated **at build time** (a malformed card fails the deploy); the browser only ever replays one character's log — milliseconds, cacheable.

Around the log, the small cast of §3: a **Character** (identity fields — mutable, not logged; the Identity Box writes here) owning **versions** (official, campaign-bound | sandbox), each version owning its own log. **Forking copies the whole log** — history travels, then unteathers. Sandbox builds may additionally be edited loosely (their privilege); official versions only ever append.

**Play-state lives outside the log entirely** — the In Play scratch layer (current HP, pips, active Conditions) is a separate, resettable blob that the log never sees.

**Every record file carries two version stamps**: its own schema version, and the rules-data version it was last valid against — the hooks that Chunk 2 (saving & rule drift) will hang migrations on.

### The bridge — computation, and where the tests live

Pure functions, all of it (per `.claude/ENGINEERING.md`): `replay(log) → state`, `validate(state, rules) → flags` (the §6 keep-and-flag validator and §7 hard-blocker are the same function), and `derive(state, rules) → the sheet`. One design rule with teeth: **derivation returns breakdowns, not bare numbers** — every computed value comes back as a list of labeled components ("Str +3", "Offence Rank +1", "Masterwork +1"). Show-the-work (§8) is therefore not a display feature bolted on; it is the shape of the engine's output. These three functions plus the notation parser are where the bulk of the Vitest suite lives — data in, results out, zero mocks.

### Migration path (no big-bang)

The builder consumes pillars in v1 order: classes (extracted first), abilities, skills — then feats, gear, markets as their data lands. Nothing existing is re-authored wholesale; the parser meets the corpus where it is.

---

## 10. Saving, Files & Rule Drift (draft for review)

### Where characters live (v1)

In the browser's local database (IndexedDB), on the player's own device — the §2 promise made concrete. **Every event autosaves as it's appended** — the diary design makes saving atomic and continuous; there is no Save button to forget.

Local storage is fragile (clearing browser data deletes it), so the app is politely paranoid:

- After significant moments — completing creation, a Milestone, a Session Adjustment — it **nudges the player to export a backup**.
- **Deleting is hard** (§3): a deliberate typed confirmation, and the app always offers an export first. No swipe, no side effect, no bulk delete.

### The character file

One export format: a single JSON file (friendly extension, e.g. `.avilund.json`) containing the whole Character — identity, every version, every log, both version stamps. Fully self-contained and re-importable anywhere; this is the backup format, the move-to-another-device format, and — deliberately — **the future wire format**: when accounts arrive, uploading a local character *is* this file, designed once. Print/PDF is output, never a save format.

### Schema migrations

The record file carries its **schema version**; the app ships pure, tested migration functions (v1→v2→…) applied on load. A file is never silently rewritten — it migrates in memory, and persists in the new format on the next write.

### Rule drift — "the rules changed while you were away"

The record's second stamp is the **rules version** it was last valid against (bumped whenever rules data changes; the site build knows its own version). On load, if the stamps differ, the app replays and validates against current rules:

- **Clean replay** (the common case — most retunes don't invalidate decisions): the sheet is simply current, the stamp updates, and a small notice says the rules moved on with nothing affecting this character.
- **Flags raised** (an Ability removed, a Ladder shortened, a Category reassigned): the player gets the **review flow** — "The rules changed since you last played. Here's what it means for Gareth" — with each broken decision listed. Resolving works like §6's keep-and-flag: invalidated purchases are **refunded automatically as a logged reconciliation event** (system-sourced, labeled — not a retcon, not a retrain) and the player respends. The log stays honest: anyone reading it later sees exactly when the world shifted underfoot.

During the playtest era this will fire often — that's by design; it's the mechanism that makes mid-playtest retuning *safe*. In the campaign era, a GM sees their players' reconciliations.

### Devices

v1 has no sync: one device holds the truth, and export/import is how a character travels. Accounts (someday) turn the same file into an upload.

---

## 11. Markets & Shopping (settled Aug 10 2026)

The game rules live in `mechanics/markets.md` (the Waldheim family, access, coin, the one-Session lock). This section is the builder's behaviour.

### One Shop view — "The Markets"

The shopping view's player-facing name is **The Markets** (ruled Aug 11 2026) — Step 6 of creation wears it, and the Character Management screens reuse the same term when they land. The same view serves creation, downtime, and In Play — only the reachable Markets and the spending purse differ. Sections mirror the equipment page's folds (Weapons, Armour, Adventuring Gear…), with search across it. Each Market shows its own prices.

### Market visibility in the shop

The **Waldheim family is always listed**: open markets show their catalogs; locked ones show **only the title, that you lack access, and the Feat that opens them** — build advertising. GM-granted custom Markets and the Black Faith Market are invisible until granted, like CEs.

**Display format everywhere: Market Name — Location — Market Type** (e.g. *Theobald's Row — Sebald's Isle — Occult*). The named roster (Anselm's Buttery, the St. Ignatius College Archive, and the rest) lives in `mechanics/markets.md`, each hosted by a ward of the Waldheim gazetteer.

**Regional Markets** (`mechanics/markets.md`) chain their gates through the Feat system: the Market Feat is **location-gated** (visible in the Feat list only if Place of Origin qualifies), the Market is **Feat-gated** — and Regional Markets are **never listed locked** in the shop (no grey rows; discovery happens in the Feat list; dozens are anticipated). First example: *St. Dunstan's Magazine — Abbey of the Artillery, Lysander — Firearms Market* (origin gate: Lysander natives and Bishopric of St. Dunstan residents; all firearms-related items at 50% of list). Place of Origin is mechanically load-bearing, and has graduated into the spine (Aug 13 2026): the gate is enforced in the replay, not merely hidden in the Feat list.

### Open Commerce (ruled Aug 11 2026)

On the sheet, the Markets are hidden behind a deliberate act: **Open Commerce** reveals them; **Leave the market** closes them (an emptied Basket leaves nothing behind); **Finish the trip** commits and closes. The trip is a *mode*, not a record entry — nothing logs until the trip commits, and the committed transaction IS the Commerce session in the log. An unfinished Basket persists and re-opens Commerce on return (you are still at market). **The neutral sheet never offers selling**: gear rows grow their Sell buttons only while Commerce is open (ruled Aug 11 2026) — and a buyer paying zero after rounding is no buyer at all.

### The Basket

- Buys and sells share one Basket; the total is the **net**. Committing is **Finish** — one logged transaction per trip (items, net sum, Markets involved).
- Identical items stack (quantity on the line). Purchases arrive *carried*; organizing into containers is Page 3's job.
- Kits sell empty; Supplies are their own line.

### Shop quality of life (Aug 11 2026)

- **Price hints — inform, never auto-decide**: when another *reachable* Market sells an item cheaper, the row (and any stale Basket line) carries a clickable note — "100 sp at St. Dunstan's Magazine" — that buys from (or reroutes to) the cheaper door. Reachability respects the In Play filter when it lands.
- **Proficiency chips**: weapons, armour, and shields the build isn't trained for wear an *untrained* chip stating the exact penalty (weapons −1 to attack; Light/Medium armour and Light Shield −1, Heavy armour and Heavy Shield −2 to physical skill checks, and shields a further −1 to hit when bashed with); Str-short heavy armour adds *needs Str +N*. Buying stays unrestricted.
- **All Gear / Gear I can Use** toggle (default All): the second view hides chipped rows; sundries always show.
- **Purchase-time item choices** (`mechanics/markets.md`): Artisan's tools pick their Craft, Saint's medals their saint, Supplies their kit — dropdown (plus free-text Other where the space is open); a Market can **replace** an item's option list wholesale (`choiceOverrides`: Black's Road offers Poison alone, no Other). The pick rides the transaction line, names the instance, and separates stacks.
- **Kit fill (Page 3, later)**: kit instances carry a Supply gauge 0–20; a named spare stack ("Supplies (Healer's Kit) ×100", in a backpack or at Home) refills it as a Gear-page action. Loose stacks are ordinary located items — the gauge is kit state, not inventory.

### Creation shopping

The last step of the flow (§6). The Basket stays open until the flow's Finish — commit and character completion are **one act**. Free swaps at full value until then; **no selling during creation** (no Market's buy-side is open yet). Starting coin (from the Gear category) is the purse; a Quirk-opened door is shoppable immediately and permanently.

### The first-Session sell lock

Nothing can be sold until the character has ≥1 Session logged — a **New** character sells nothing (ruled Aug 12 2026; this generalizes the old Starting-Gear-only lock and closes the buy-at-creation, sell-at-once arbitrage). Player-facing: items show no sell price, no explanation (the no-machinery rule). Enforcement is on the Session count in the engine. The Character State wires the rest of access: the Markets open in **Downtime** only.

### Coin

Wealth is a single value (stored in cp), always **displayed reduced to fewest coins** ("1 sp 1 cp", never "11 cp"). Weightless. Fractions stay in the math; the final price rounds to the nearest cp. A currency field rides along for the future Currencies Campaign Option (§ Parking Lot).

### Data model notes

- **Catalogue** (Layer A): `lib/equipment.ts` — the equipment tables as structured data; the `system/equipment` page's tables generate from it (prose stays hand-written). Prices internally in cp.
- **Owned items** (Layer B): instances referencing a catalogue entry (or free-named for found/unique gear), with quantity, location, masterwork flag, Supply count where relevant, and provenance via the event log.
- **Markets** (Layer A + campaign data): what it sells (catalogue refs ± modifiers ± stock), what it buys (rates + purse), access rules. The Waldheim Market is "everything at list, buys back at 25%, bottomless".
- **Per-market prices on items**: an item can carry bespoke buy-list entries at named Markets (the Havilah trade goods and stock certificates — `mechanics/markets.md`), overriding the default 25% rule; stock certificates are weightless items.

---

## 12. Characters & Campaigns on the site (draft, Aug 11 2026)

### Placement

**Two new top-level nav items: "Characters" and "Campaigns"** (no umbrella section — ruled). They are the account-shaped areas: in v1 the browser is the account (§2); when real accounts land, these pages gain sign-in and upload and nothing else moves.

- **Characters** — the roster: every Character with a state badge, *New Character* (opens the creation flow), import/export of `.avilund.json`. A Character opens to **Sheet or Chronicle**.
- **Campaigns** — the campaign list; each Campaign opens to its home (below).
- `/builder/` remains the creation flow's address and the visitors' sandbox; players reach it through *New Character*.
- Storage moves from the single localStorage draft to the §10 IndexedDB roster (per-event autosave); the existing draft migrates in as the first roster entry.

### Character lifecycle (v1 surface)

**In Creation** → **Complete** (advancing by DM-granted Milestones, recorded on the sheet) → optionally **in a Campaign** → **Retired** or **Dead** (memorials; deleting is hard, §3). Sandbox builds sit beside the lifecycle; **In Play** is a game-time toggle, not a state.

### What a Campaign is

A Campaign is: **a DM · Players · Characters · an Adventure Module.** (v1: one browser wears every hat; the shape is real, the enforcement waits for accounts.)

The **Adventure Module** is the authored content package (the §1 paid layer, eventually):

- **Information for the DM** — the module's GM text.
- **CEs** — some load immediately on attach; others are held back as Rewards.
- **Maps** — entries for the Chronicle's **Map Book** (§4): some reveal to players on enrollment, others the DM activates later; the module's private maps stay DM-only in its Information.
- **Encounters** — the DM's prepared set pieces (monster profiles with DCs when the bestiary lands).
- **Rewards** — what completing things grants: CEs · treasure/gear/physical rewards · Milestone Advancement · and **Marks** (term ruled Aug 11 2026) — the lasting non-physical awards: access to new Markets, reputation bonuses, even small debilitations or hindrances. The world marks you, for good or ill. All Rewards land as **granted events** on character records.

Campaign data besides the Module: name, entry level, roster, the **Session log** (the meta-Chronicle — "Log a Session" belongs to the Campaign once it exists), and DM-togglable Campaign Options (Party Inventory, someday Currencies). The v1 "Market code / CE code" entry mechanism (§11, mechanics/markets.md) is the print-era shape of what a Module does natively.

---

## 13. Campaigns — the framework (settled Aug 18 2026)

### Where a Campaign lives

A Campaign is its own record in the **DM's** browser — its own IndexedDB store beside the character roster, never inside a character. Characters do not depend on campaigns: a `.avilund.json` replays whole with no campaign attached. When a campaign gives a character something, a **copy** of the grant is written into the character's own log as a `source: 'gm'` event (§9, Layer B); the Campaign keeps its own ledger entry. The two records agree because the table made them agree, not because they share storage.

### The table is the wire (v1)

There is no backend and no browser-to-browser link. The table itself carries every grant, by three routes:

1. **Codes** — CEs, maps, and Market access travel by short entry codes (§4, §11): the DM reads out "K-17", the player types it in.
2. **Verbal grants** — Milestones, gear, Marks: the DM says it, the player records it on their own sheet, as tables have always worked.
3. **Session Adjustment** — the paper-reconciliation flow (promoted from the Parking Lot; below).

The DM's campaign screen is a **ledger and a prompter**: it tracks what the DM has issued, to whom, in which Session — even though the players' sheets are updated by the players themselves. When accounts land, the Distribute button (§4) starts pushing grants over the wire for real; the record shapes do not change.

### The Campaign record

What the DM's browser stores per Campaign:

- **Name** and **entry level**.
- **The attached Adventure Module** (below) — or none; a homebrew campaign is a Campaign with no Module, or one the DM authors.
- **Roster** — player name + character name, as text: the characters live on the players' devices, so the roster is the DM's list of who is at the table, not a link to their records.
- **The Session log** — the meta-Chronicle (§5); "Log a Session" belongs to the Campaign.
- **The grant ledger** — every issue: what, to whom (a roster entry), which Session.
- **Campaign Options** — the DM-togglable rule-module flags (§12): Party Inventory first, Currencies someday.

### The Adventure Module file (structure ruled Aug 18 2026)

**One format, three sources.** An Adventure Module is a content package in a single file shape, the same whether **we** authored it (free one-offs and paid campaigns shipped with the site), **a DM** built it in the Campaign Builder (a later UI), or it was **bought** (the later store delivers the same file). The format is the foundation; the Builder UI and the store sit on top of it.

The structure:

- **Identity** — id, title, author, version, recommended entry level.
- **The Campaign Summary** — the Module's first page, for the DM: an overview of the whole campaign in prose, followed by the outline — every Book and Chapter with its short summary. The outline is assembled from the Chapters' own summary fields, never written twice, so reorganizing Chapters keeps the page true.
- **Front matter** — the DM introduction, and the CEs and maps revealed on enrollment.
- **Chapters**, in order — the constituent unit of a campaign. Each Chapter holds its short summary, its DM text, its CEs, maps, and encounters (monster profiles with DCs when the bestiary lands), and its **Reward** at the end. CEs and maps held back for later live in the Reward of the Chapter that pays them out; reveal rules (*on enrollment* / *DM-activated* / *DM-only*) ride with each entry.
- **Books** — an optional grouping of Chapters, with a bigger Reward at the Book's end. Small campaigns never see them.

**A one-off is a Module with one Chapter.** There is no campaign "type" flag: a one-off becomes a campaign by adding Chapter 2, and the DM reorganizes — reordering or regrouping Chapters, content moving with its Chapter — at any time. Chapters are content-time; Sessions are table-time (a Chapter may span several Sessions); Rewards attach to Chapters, the Session log stays the table record.

Repo-shipped Modules live as data in `lib/modules/` (the `texts.ts` / `saints.ts` pattern); **St. Carpathi is the first** — three Chapters, no Books. The file is versioned like the character file (§10), so a bought Module can be updated.

### Rewards & Marks (ruled Aug 18 2026)

A **Reward** is a bundle, any part empty: **CEs · maps · gear/treasure · Milestone Advancement · Marks.** All of it lands as granted events on character records — in v1 by the table-is-the-wire routes.

A **Mark** is the lasting non-physical award (§12): the world marks you, for good or ill. Its v1 shape is **a name + rule text** — display-only on the sheet (per the Aug 12 ruling) — plus machine teeth only where the engine already has them: **Market access and standing discounts** enforce through the Markets machinery. Numeric effects can join the Feat effect vocabulary later without reshaping the Mark.

The **Reward Builder** (a later DM UI) is a small form over this shape: pick CEs and maps, list gear, grant Milestones, and author Marks — name, rule text, tick any Market access.

### The In Box and the Out Box (ruled Aug 18 2026)

**The In Box is the one door into a character.** Everything that arrives from outside — a Milestone, gear and treasure, a Mark, a CE, a map, a transfer from another PC, a Party Inventory payout — stages in the character's In Box, and nothing is written to the record until the player accepts it.

**What the DM sends is not negotiable.** A DM grant carries only **Accept** — the click is receipt, and that's that.

**PC to PC carries Accept and Decline.** Declining informs the sender; tangible goods return to the sender's In Box (the one door in, even for your own returning sword). A declined CE or map simply never entered — the sender keeps theirs and is told.

**The Out Box is the door out.** A PC sends a physical thing to another PC: the item leaves the sender's inventory as a logged transfer and lands in the receiver's In Box. A PC shares a CE or a map: it **copies** — sharing is irreversible once accepted (§4) — the sender keeps theirs, and the receiver's copy carries its provenance.

**v1: the doors are real, the wire is the table.** A DM grant reaches the In Box by entry code, or by the player staging what the DM said aloud; staging and accepting may be one motion in the v1 UI. PC-to-PC transfers happen at the table, each side logging its half — the Out Box is the sender's record of what left their hands. When accounts land, Distribute and Send push straight into In Boxes, and none of the shapes change.

### Session Adjustment (promoted from the Parking Lot)

After a Session played on paper, the player edits inventory and wealth freely in a **draft changeset** (coin spent, herbs picked); nothing touches the record until they commit, and the whole batch writes as **one logged event tied to the Session**. v1: self-approved, labelled as an adjustment batch. Accounts era: the batch goes to the DM, who approves or rejects with a note — the same shape, with an approval step inserted.

### First build increment

The thin shell, in order: the Campaign store + create/open a Campaign · Roster · Session log · Session Adjustment on the character side. Module packaging follows once St. Carpathi is authored.

---

## Parking Lot — flagged for later chunks

- **Custom-input Abilities** — *instances built Aug 7 2026*: builder cards (spell/curse builders) mint named copies, each with a validated build choice (element, Malediction), its own Ladders and pacing, renameable, bought repeatedly at 1 Major. Still open: **Companion sub-sheets** (the Shepherd's Dog as a little character on the same engine, invested-advance refunds; the validator must catch orphaning the dog) and **in-play collections** (spellbooks — found spells arrive as granted events; recipe books).
- **GM NPC-building** — do GMs use the builder for NPCs? (From §2 discussion.)
- **Currencies** (spec another day) — multiple currencies whose worth varies by region of Avilund; travellers convert (at a cost) or pay more. Notably, this is a **Campaign Option** — a rule module the DM activates per campaign, a concept that will likely grow more members (the data model should expect DM-togglable option flags on a Campaign). Wealth/Markets machinery should keep a currency field in mind rather than assuming one coinage.
- **Per-market standing discounts** (flagged Aug 11 2026) — a character may earn a lasting discount at a named Market as an adventure reward (a Friar completing an adventure gains 10% at a specific religious market). Grantable in play like Market access; stacks with Commerce percentages; keeping stock sorted by Market (the Imperial Square shelf) is what makes such rewards land on the right goods.
- **Party Inventory** (canonical name — "Party Stash" retired): a **Campaign Option** (DM decides whether it exists — for one-offs, maybe not): a campaign-owned inventory (a keep, a wagon) visible to characters the GM chooses. Items move between sheets and Party Inventory as logged transfers; the DM can send items to it directly, as to any character's In-box. Access: any member deposits; only **Quartermasters** (players choose, DM assigns — see §2) withdraw, sell, or distribute. Its **Sell** button optimizes across the whole party — every member's reachable Markets (In Play-filtered) × their Commerce modifiers — and shows the math: *Bottle of Poison — 9 sp — sold by Piotr (Chaffer, +10%) — via Black Market access*. **Divide Spoils**: a Quartermaster pays out currency from the Party Inventory — stating an amount or a % of the purse — split equally across the chosen recipients (default: the whole party), delivered automatically to each PC's In-box as a logged transfer; indivisible remainders stay in the Party Inventory.

---

*Further chunks land here as they're settled.*
