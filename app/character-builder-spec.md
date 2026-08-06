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

### End states

**Dead** and **Retired** versions are kept forever — memorials, not garbage. Deleting a character (or any official version) should be genuinely hard: deliberate confirmation, never a casual swipe, never a side effect.

---

## 4. The Chronicle

The Chronicle is the lore of the game, as a corpus of **Chronicle Entries** ("CE" — settled term). A CE is a discrete text, roughly the size and shape of a Library document. Every character offers a **Chronicle view** — a sibling view to the Character Sheet (opening a Character, you choose one or the other): the world's lore as *that character* knows it, one reader merging the public corpus, the Party Chronicle, and everything they've been granted.

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

Top-line details — name, country of origin, height, weight, age, appearance — live in a box that's editable at any moment during creation, in any order, with no mechanical consequences. *(Watch-item: if country of origin ever drives mechanics like languages, it graduates out of the box and into the spine.)*

### The Spine — ordered, reversible, keep-and-flag

The mechanical build is step-wise by nature and done in order, following the live Character Creation page (the current canon): **Class → Subclass → spend 11 Major Advances (Attributes, Abilities, extra Classes) → spend 11 Minor Advances (Offences/Defences, HP, Skills, Proficiencies, Feats, languages) → optional Flaw (drop up to 2 Attributes −1 for +1 Major each)**. Each step unlocks the next. Walking back is always allowed, and edits at the front invalidate work at the back under one policy:

**Keep-and-flag, never wipe.** Change an upstream choice and every downstream choice that's still legal survives untouched; now-illegal choices (an Ability from an abandoned Subclass's Category, say) become visible errors — "no longer available, replace this" — which block *finishing* creation, never *browsing* it. Silently deleting a player's choices is the cardinal sin.

### The Finale — Quirk & Starting Gear, the point of no return

Last comes the game's quirkiest moment. **Quirk and Starting Gear are rolled, together, as one package** — a specific feature (and a strange, maybe-powerful, maybe-not bit of unique gear: a cursed rabbit's foot, a rare musket, a broken orb) that the character didn't bargain for.

- **The app rolls digitally.** No table dice, no typed-in results.
- **The seesaw (working design):** Quirks and Gear each come in three categories — Bad / Neutral / Good — and the package balances them: a Bad Quirk pulls a Good Gear roll, and vice versa. The wildness lives inside each roll; only the sum is tamed — no double-cursed starts, no double jackpots. (Every Quirk therefore needs a category tag, and Gear needs three tables — authoring work noted.)
- **Rerolls: 2, take-the-last.** A reroll rerolls the *whole package* — Quirk and Gear update together (the seesaw makes every reroll a devil's bargain, not shopping). Each reroll discards what you had; there is no going back and no picking among results seen. Accept the current package (or exhaust your rerolls) and the character **crystallizes**: the spine locks, creation ends, and the character enters normal state.
- **Sandbox builds reroll freely** — it's the play-around space, and the GM-approval gate (§3) protects campaigns from Quirk-fishing.
- **Starting coin** rolls separately and is not seesawed. *(Confirm when the gear mechanic is built.)*
- **Shopping happens last.** After the roll, creation closes with a shopping step: spend your starting coin at the Markets you can access (the Default Market, plus anything a Quirk or Feat just opened). See `mechanics/markets.md`.

### Mechanics Prerequisites (authoring work this flow is waiting on)

- **Starting Gear** — the rolled-gear mechanic, its three tables, and starting coin.
- **Quirk category tags** — Bad/Neutral/Good classification across the Quirk roster.
- **Doc cleanup** — `mechanics/characters/character-creation.md` is stale AP-era design; the live site page `system/character-creation` is the canon but needs the Level-derivation correction from §7 ("out of Level 0 and working on 1" is no longer right).

---

## 7. The Advancement Flow

### One master number

The **Milestone count** is the fundamental quantity; everything else derives from it. Nobody ever "sets level."

- **Level 0 is creation only.** A finished character begins play at **Level 1**, having spent the creation allotment (11 Major + 11 Minor).
- Each Level's climb is **3 Milestones**, and those Milestones belong to the level they build toward: Milestones 1–3 are Level 2's, Milestones 4–6 are Level 3's, and so on. Completing a triad completes the level. **Level = 1 + ⌊Milestones ÷ 3⌋**, capped at Level 11 (Milestone 30).
- **Once-per-Level allowances** (chiefly HP) refresh at the *first* Milestone of each triad (1, 4, 7, …). Attribute gates (+4 at 5th Level, +5 at 10th) and Ladder pacing (≤1 Rank per Level per Ladder) all key off the same derived level.

### Grants fill a bank; spending is separate

A granted Milestone (§3 machinery; GM-granted in campaigns, self-marked in v1) adds **+1 Major and +1 Minor to the character's banked pool**, logged. Spending from the bank happens whenever the player likes — banking toward a big purchase is explicitly canon. Every individual purchase is its own logged event.

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
- **Modes:** **play** (the default — only what the character owns; no ladders, costs, or teasers), **advance** (§7 spending — ladders with owned Ranks and priced next steps), and **Session Adjustment** (the reconciliation changeset, see Parking Lot). Print always renders play mode.

### Page 1 · The Character

Identity, portrait, Class · Subclass · Level with Milestone pips. **Attributes table: ATTR · VAL · OFF · SAVE · UN · ARM** — Save is its own column (= Attribute + Defence Ranks; bonus sources can diverge from Defence). **Vitals** each decomposed (HP from base + purchases − Wounded; Speed from base − armour + recoveries; DR itemized; AC per formula), plus the **Load** line (weight · Band, thresholds computed from Str with Feat/Quirk shifts itemized — `mechanics/encumbrance.md`). **Skills** with Total · Attr · Ranks · Misc columns, Misc itemized. **Proficiencies** as a table with current rank, distinguishing *advanceable* (Class/Subclass) from *fixed at +0* (bought). **Feats** with one-liners; Feat Ladders show owned Ranks only (in play mode).

### Page 2 · Attacks & Abilities

**Abilities are cards; attacks are projections.** Every owned Ability renders as a card: header (name · category · frequency in the standard vocabulary: ∞ · ●/enc · ●/day), the cost strip (Action cost leads · Range · Targets · vs-Defence — canonical order, omit-if-empty), effect block with **numbers resolved for this build** (never `[W]+Str` — the sheet does the math), conditional hooks (Specializations), flavour behind a tap. Attack Abilities are **weapon-parameterized**: the same card instantiates per chosen weapon. The **Attacks table is auto-generated** from (attack Abilities × carried weapons) + a Basic Attack per weapon + Basic Unarmed; the player curates by *hiding* lines, never by typing them. Conditions tracker sits here.

### Page 3 · Gear

Sections: Weapons · Armour · Equipment · Wealth. Weapons and armour reproduce their **full stat blocks** (from rules data — these blocks are what pages 1–2 compute from), including weight. **Every item has a location**: equipped / carried / in *[container]* / at **Home** (weightless, every character has one) / Party Inventory (campaign). **Containers** hold anything, apply their coefficient to contents, show subtotals; the sheet totals carried **Load**. **Sell prices appear only where an accessible Market buys the item**, source noted ("3 sp — Black Market"), In Play filter respected. **In-box / Out-box** for transfers (player-to-player, DM grants) with quick actions: **Accept** (and place) · **Decline** · **Sell** (auto-filled best price with its math). Wealth carries a currency field (single coinage today; Currencies is a future Campaign Option).

### Page 4 · Advancement Log

The character's **unified event log** (grants, purchases, retrains, retcons, gear, transfers, CEs, transactions, adjustments) **filtered to build events** — every Advance in order, the build back-trackable to legal. On screen the same log offers its other filters; print keeps the clean Advancement Log.

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

## Parking Lot — flagged for later chunks

- **Custom-input Abilities** (for the data-model chunk): some Abilities carry player input — purchase-time choices (damage type, weapon group), free-text naming, **sub-sheets** (Companions run as little characters on the same engine, with invested-advance refunds), and **in-play collections** (spellbooks — spells are found, so a new spell is a granted event like gear/CEs; Malediction/recipe builders). The validator must understand dependencies on these (retraining away the Companion ability orphans the dog); print treats them as first-class cards.
- **GM NPC-building** — do GMs use the builder for NPCs? (From §2 discussion.)
- **Campaign internals** — roster, session log mechanics, Distribute flow, homebrew CEs (deferred; v1 is local-first).
- **Currencies** (spec another day) — multiple currencies whose worth varies by region of Avilund; travellers convert (at a cost) or pay more. Notably, this is a **Campaign Option** — a rule module the DM activates per campaign, a concept that will likely grow more members (the data model should expect DM-togglable option flags on a Campaign). Wealth/Markets machinery should keep a currency field in mind rather than assuming one coinage.
- **Session Adjustment** *(working name)* — the paper-reconciliation mode: after a session played on paper, the player edits inventory/wealth freely in a draft changeset (coin spent, herbs picked); nothing commits until the **DM approves**, then the batch writes to the record as one logged event tied to the Session. DM can reject with a note. v1 local: self-approved, still logged as a labeled adjustment batch.
- **Party Inventory** (canonical name — "Party Stash" retired): a **Campaign Option** (DM decides whether it exists — for one-offs, maybe not): a campaign-owned inventory (a keep, a wagon) visible to characters the GM chooses. Items move between sheets and Party Inventory as logged transfers; the DM can send items to it directly, as to any character's In-box. Access: any member deposits; only **Quartermasters** (players choose, DM assigns — see §2) withdraw, sell, or distribute. Its **Sell** button optimizes across the whole party — every member's reachable Markets (In Play-filtered) × their Commerce modifiers — and shows the math: *Bottle of Poison — 9 sp — sold by Piotr (Commerce Feat, +10%) — via Black Market access*. **Divide Spoils**: a Quartermaster pays out currency from the Party Inventory — stating an amount or a % of the purse — split equally across the chosen recipients (default: the whole party), delivered automatically to each PC's In-box as a logged transfer; indivisible remainders stay in the Party Inventory.

---

*Further chunks land here as they're settled.*
