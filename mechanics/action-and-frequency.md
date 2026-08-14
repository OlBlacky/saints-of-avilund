# Action & Frequency — the token vocabulary

**Status:** ruled and built (Aug 13 2026). The whole corpus speaks this
vocabulary, and `action-frequency.test.ts` holds it there.

Every Ability Card answers two questions the player asks constantly, and answers
them today only in free text:

- **Frequency** — *have I still got it?* Asked before committing, tracked across
  the session. It wants a state you can tick off.
- **Action** — *does this fit in what's left of my turn?* Asked mid-turn while
  scanning several cards. It wants instant sorting.

So each field becomes a **token** (a closed vocabulary the card must choose from)
plus optional **detail** (the prose, kept verbatim). The token drives the badge,
the sorting, the tests, the printed sheet, and later the Foundry Actor. The
detail keeps everything the cards currently say.

Corpus surveyed: 150 Ability Cards in `app/src/lib/category-abilities.ts`.

---

## Frequency — five tokens

Counts below are **base rungs** — where a card starts. At-Will and Encounter
are mostly bought, not started with, so they read low here and are everywhere
once a character has climbed.

| Token | Reads as | Badge | Base rungs |
|---|---|---|---|
| `passive` | Passive | a rail down the card, no badge | 15 |
| `at-will` | At-Will | ∞ | 1 |
| `encounter` | Encounter | ☐ (one box per use) | 5 |
| `daily` | Daily | ☐ | 122 |
| `uncapped` | Uncapped | ∞ | 7 |

`uses` (a number, default 1) rides with `encounter` and `daily`. It is what
collapses the three spellings the corpus currently carries — *Twice per
encounter*, *Twice per Encounter*, *2 / encounter* — into one token with
`uses: 2`. On the sheet, `encounter` with `uses: 2` prints ☐☐.

`detail` carries the rest: *one prepared dose per use*, *limited by time and
makings*, *the dog is always with you*.

The standard Frequency ladder is unchanged — Daily → Encounter → Encounter ×2 →
At-Will. It just stops being spelled three ways.

### The mapping

| Current string | Token |
|---|---|
| `Daily` | `daily` |
| `Encounter` | `encounter` |
| `Twice per encounter` · `Twice per Encounter` · `2 / encounter` | `encounter`, uses 2 |
| `At-Will` | `at-will` |
| `At-Will — one prepared dose per use` | `at-will` + detail |
| `Passive (always on)` | `passive` |
| `Passive (the dog is always with you)` | `passive` + detail |
| `Uncapped` · `Uncapped (limited by time)` · `Uncapped (limited by time and makings)` | `uncapped` (+ detail) |
| `24 hours of care, per patient` | **needs a ruling** — see Open Decisions |
| *(blank — Conduct Ritual, ×2)* | **needs a ruling** |

---

## Action — the combat ladder, then everything else

Two groups, because they answer different questions, and only one of them is
asked under time pressure.

### In your turn — glyphed, because you scan these fast

| Token | Reads as | Glyph | Base rungs |
|---|---|---|---|
| `full-round` | Full Round | ◆◆ | 8 |
| `standard` | Standard | ◆ | 66 |
| `move` | Move | ➤ | 11 |
| `minor` | Minor | ▪ | 5 |
| `free` | Free | ○ | 0 (bought, never started with) |
| `reaction` | Reaction | ↺ | 4 |
| `interrupt` | Interrupt | ⚡ | 2 |
| `none` | — | *(no badge)* | 15, all Passives |

`reaction` and `interrupt` always carry a `trigger` string — *when an adjacent
ally is hit*. The trigger is the rule; it is not optional prose.

The distinction stays as written: a **Reaction** resolves after its trigger, an
**Interrupt** resolves before or during it.

### Outside your turn — worded, not glyphed

Nobody scans these mid-combat, so they get plain muted chips. A glyph here would
be noise pretending to be signal.

| Token | Reads as | Carries | Count |
|---|---|---|---|
| `ritual` | Ritual | `time` (4 hours, 1 minute) | 4 |
| `rest` | During a rest | detail | 6 |
| `scene` | A scene | detail (*an evening's cavorting*) | 15 |
| `downtime` | Downtime | `time` (8 hours, a full day) | 7 |
| `check` | *[Skill]* Check | `check` (the Skill rolled) | 1 |
| `varies` | As written | detail | 6 |

`check` is the cost of an Ability you declare on a roll you were making anyway
— Marksman's Eye rides a Perception Check. One card holds it today, but it is
a genuinely distinct shape and Feats will want it.

`time` is a separate field from `detail` because four cards climb a **time
ladder** — *8 hours of study → 6 → 4 → 1 hour*, *24 hours setting up the con →
12 → 6 → 1*. The token holds still while `time` shortens, which is exactly what
those ladders do.

`varies` is the escape hatch for cards whose cost is inherited or genuinely
open — *the ritual's own casting time*, *the artefact's own activation*, *the
orb's own activation*, *depends on Target and Duration*. It should stay rare;
six cards is acceptable, twenty would mean the vocabulary is wrong.

### Cards that are both

Five cards read *"a few minutes of questioning (Standard in a tense scene)"* —
they cost a scene out of combat and a turn-action inside it. That is a real
pattern, not sloppy authoring, so it gets a real shape: a `combat` fallback
token alongside the main one.

```
action: { token: 'scene', combat: 'standard', detail: 'a few minutes of questioning' }
```

The badge shows the scene chip plus a small **◆ in a tense scene**.

Cards affected: *Minor (in combat) / instant (out of combat)* ×2, *Minor (in
combat) / a few minutes' watching*, *a few minutes of questioning*, *a few
minutes of preaching*, *a conversation (a Standard in a tense standoff)*.

### The ladders

Action ladders climb like everything else, and every rung is a token:

- `standard → move → minor → free` (23 + 4 cards)
- `full-round → standard` (7 cards)
- `move → minor → free` / `move → minor → interrupt` (6 cards)
- `ritual → full-round → standard` (1 card)
- time ladders inside `downtime` and `ritual` (4 cards)

So an advance is `{ token: 'move', cost: 'm' }` rather than a bare string, and
the sheet badges whichever rung the character has bought.

---

## What it looks like on the sheet

```
Marksmanship · Attack
AIMED SHOT
[ ◆ STANDARD ]  [ DAILY ☐ ]
Range 60' · Targets 1 · Attack Dex (+5) vs AC
```

```
Protection · Attack
SHIELD BASH
[ ➤ MOVE ]  [ ENCOUNTER ☐☐ ]
Attack Str (+4) vs AC
```

Two chips, hard-edged, sitting under the title where the eye lands. The Move
chip is the whole point of the exercise: fanned out on the table, the player
sees at a glance which cards do not cost their Standard.

An alternative to the glyph chip, worth considering: a **turn strip** — three
cells `[S][M][m]` with the one this Ability eats filled in. It answers "does
this fit in what's left of my turn" more literally than a glyph does, at the
cost of taking more width. Both are cheap once the tokens exist.

Frequency prints one box per use — a card showing one lonely box reads as
precious without a word of explanation. The box is pencilled in at the table;
the app does not track it.

Passive cards carry neither chip. They get a rail down the left edge and sink to
the bottom of the Abilities box, out of the way of the cards you read on your
turn — but only until the player arranges the box themselves. Every card has a
grip; drag one into place and your order stands from then on, kept in the
record with the character.

---

## The rulings

Four cards forced a ruling the vocabulary could not make for them:

1. **Physician's *24 hours of care, per patient*** — Frequency `uncapped`, with
   the limit as detail: *one patient at a time; 24 hours of care each*.
2. **Conduct Ritual** (Letters and Occult) had no Frequency. Now `uncapped` —
   as often as you have scrolls, time, and components.
3. **Stand Watch** had no Action. It is set during a rest: `rest`.
4. **Marksman's Eye** had no Action. Ruled: it costs a **Perception Check** —
   which is what added the `check` token.

Four Interrupt rungs also climbed to Interrupt without stating what they
interrupt. A trigger is a rule, not prose, so the test now demands one, and
these four were written to satisfy it:

| Ability | Trigger |
|---|---|
| Parry | when you are hit by an attack |
| Guard | when you or an adjacent ally is hit by an attack |
| Memory of Celestia | when the target attacks or makes a Perception check |
| Lessons from Dark Places | when a delving hazard is sprung |

---

## What it changed in code

1. `abilities.ts` holds the tokens, the formatters that generate the display
   line from them, the `frequency()` / `actionCost()` authoring helpers, and the
   badge builders.
2. All 150 cards in `category-abilities.ts` are authored as tokens.
3. `action-frequency.test.ts` asserts every rung carries a legal token, that
   Reactions and Interrupts state their trigger, that a Passive is never sold an
   action cost, and that `varies` stays rare.
4. Badges render on the Character Sheet, the builder's full card, and the site's
   reference card. Passives sort to the bottom of the Abilities box and take a
   grey rail instead of a badge.

The Frequency box is a printed box, not a control — you pencil it in at the
table. It carries the signal (one lonely box reads as precious) without asking
the app to track a session's spending.

The tokens outlive the badges. The printed sheet, the character export, and the
Foundry module all want the same closed vocabulary.
