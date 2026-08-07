# Quirks

The wild card of character creation. A quirk is rolled, not chosen — the last step
of building a character, after everything else is spent. Every quirk **gives
something and takes something away**, and no attempt is made to balance them
against one another. That is the point: two Soldiers built identically are still
two different people once they have rolled.

Quirks are **optional** and **one per character**.

---

## The shape of a quirk

Every quirk has two halves:

- A **mechanical clause** — one small, specific modifier (a ±1, a proficiency, a
  language).
- An **esoteric clause** — a behavioural sting with no dice attached. Roleplay,
  not rules.

**The authoring standard: the esoteric half must explain the mechanical half.**
The two clauses are one idea seen from two sides, not two facts about the same
character. *Gutter Auld* — you speak the church tongue, but with a parish accent
that costs you a point of Diplomacy — is one idea. A quirk that grants a swim
penalty *and, separately,* a superstition about fish is two ideas wearing one
name. If you cannot state a quirk as a single sentence, it is two quirks, and
probably neither is good.

---

## Categories and the seesaw

Every quirk carries a category — **Good, Neutral, or Bad** — judged by the
**mechanical net alone**. The esoteric sting never counts toward the category:

- **Good** — the give outweighs the take. The cost lives in the sting.
- **Neutral** — the gives and takes balance. Most give-and-take quirks land here.
- **Bad** — the take outweighs. The gift, if any, lives in the story.

The authoring standard is unchanged by the category: every quirk, in every pool,
still has both halves and still passes the one-idea test. A Good quirk is not a
sting-free quirk; it is a quirk whose sting has no dice attached.

**The seesaw.** Quirk and Starting Gear are rolled together, as one package, at
the very end of creation. The roll goes:

1. **Roll the category** — even thirds. (The seesaw already tames the sum, so
   the extreme packages — the fun ones — stay common.)
2. **Roll a quirk** from that pool, uniformly.
3. **Roll gear from the opposite pool** — a Bad quirk pulls Good gear, a Good
   quirk pulls Bad gear, Neutral pulls Neutral.

No double-cursed starts, no double jackpots: the wildness lives inside each
roll, and only the sum is tamed. Rerolls (two, whole-package, take-the-last),
crystallization, and the sandbox exemption are the builder's business — see
`app/character-builder-spec.md`, §The Finale. **Starting coin rolls separately**
and is not seesawed.

The engine lives in `app/src/lib/gear.ts` (`rollPackage`); the demo button on
the rules page still rolls quirks freely across all three pools.

---

## Slots

Quirks are hand-authored, but the esoteric half is fill-in-the-blank. A slot is
written `{place}`, `{saint}`, `{language}`, `{weapon}`, and is resolved at roll
time against the setting's own data — the saint catalogue, the polity list, the
language list, the 17 weapon groups. One authored card therefore yields many
distinct results, and every result is setting-true, because the fill came from
canon rather than from a word generator.

Slots may be tagged to constrain the draw: `{place:centre}` draws only from the
Republican Centre; `{saint:fundator}` only from the nine Fundatores.

Slot tokens may appear in the quirk's name, either clause, or inside an effect.

---

## The effect vocabulary

A quirk's mechanical clause is never a free-floating number. It is **a modifier
plus the condition it fires under**. An unconditional bonus is simply the same
object with no condition attached.

| Kind | What it does | Targets |
|---|---|---|
| `skillMod` | ±1 to a named skill | one of the 39 skills |
| `saveMod` | ±1 to a save with one attribute | one of the six attributes |
| `defenceMod` | ±1 to an attribute Defence | one of the six attributes |
| `attackMod` | ±1 to hit — **condition required** | set by the condition |
| `grantProficiency` | a Weapon Proficiency the Class/Subclass would not allow | one of the 17 groups |
| `grantLanguage` | a language | one of the seven |
| `socialPenalty` | −1 on social checks, scoped | by language, region, culture, or faith |

**The one enforced rule:** an `attackMod` must carry a condition. A flat +1 to
hit is a Feat's job, not a quirk's; a quirk's attack bonus is always *against
Ferals*, *with polearms*, *at night*, *on holy ground*. The schema rejects an
unconditional one. Everything else trusts the author, because the other kinds are
small and already scoped by the thing they name.

A `grantProficiency` from a quirk behaves like any bought proficiency: it sits at
**+0 forever and can never be advanced** (see `mechanics/weapons.md`). It is a
door, not a career.

### Shared with Feats

This is deliberately the **same vocabulary the Feat pillar needs**. A Feat is a
*chosen* conditional modifier; a quirk is a *rolled* one with a sting attached.
Both emit the same effect objects, so the character sheet resolves everything in
a single pass — collect all effects, filter by condition, sum. A quirk may also
simply grant a Feat rather than restating its mechanics.

### Real handles only

An effect must name something that exists in the system. There is no Swim skill
(it is **Athletics**), no Persuasion (it is **Diplomacy**), no Lore (it is
**History**, **Arcana**, or **Local Knowledge**), and no Fortitude/Reflex/Will —
saves are taken with an **attribute**. Authoring against the real list is what
lets the character sheet apply a quirk automatically instead of leaving it as
prose the player has to remember.

---

## The corpus

Twelve so far. The list lives in `app/src/lib/quirks.ts` as the machine-readable
source; this section is the design record of what each one is *for*.

| Quirk | Category | The one idea |
|---|---|---|
| **Veteran of the Ferals War** | Good | You learned one enemy and one weapon too well to sleep easy. |
| **Left the Order at Compline** | Good | You walked out with your conviction intact and your welcome spent. |
| **Bought a Bow in Waldheim** | Good | You own a weapon your training never gave you, and a debt with it. |
| **The Third Milestone** | Good | The habit that keeps you quick is the habit that owns you. |
| **Hands Like a Cooper** | Good | The eye that makes a thing well will not let you break one. |
| **Owed a Saint's Debt** | Good | The saint who keeps you standing also keeps your calendar. |
| **Gutter Auld** | Neutral | You have the church's tongue and the parish's mouth. |
| **Cousin to the Kellish** | Neutral | The tongue that opens one door closes another. |
| **Read One Page Too Many** | Neutral | You always read it before you resist it. |
| **Pulled from the Water** | Bad | You drowned once, and the water knows it as well as you do. |
| **The Arrow Stayed In** | Bad | The wound healed around what it could not give back. |
| **The Magistrate's Mark** | Bad | The brand answers a question you hope nobody asks. |

*Salt-Blooded*, the corpus's original counter-example — a swim penalty and a
fish taboo, two ideas wearing one name — was rewritten in August 2026 as
*Pulled from the Water*, where the near-drowning explains the penalty, the
behaviour, and a hook besides. The lesson stands in the authoring standard
above.

### Target size

Thirty quirks is enough that a table of five sees no repeats. A hundred is enough
that a player on their twelfth character is still surprised — but at this
standard a hundred is real authoring work, and it goes stale if burned through in
one sitting. Add in batches; let slots do the multiplying.

**Authoring priority:** grow the pools toward parity. The give-and-take habit
naturally produces Good quirks (a mechanical plus, an esoteric sting), so Bad
and Neutral need the deliberate effort — and a thin pool means the same card
comes up every time its third of the seesaw lands.

---

## Where they surface

- **Now** — a *Show me a Quirk* button on `/system/character-creation/`, as
  Step 5. The button rolls freely: on a rules page it is a *demonstration* of the
  system, and pressing it repeatedly is how a reader learns what quirks are.
- **Later** — the character generator, where the roll is committed to a sheet and
  stops being rerollable. Same engine, different job.

Players are never shown the table. This is a curtain, not a lock: the site is
static and the repo is public, so the corpus ships to the browser and a
determined reader can find it. That is an acceptable trade — it deters shopping,
which is all it needs to do.

---

## Starting Gear

The other half of the package. A gear card is authored exactly like a quirk —
same slot resolution, same effect vocabulary, same one-idea discipline — but
its two halves are:

- A **mechanic** — what the thing is and does, with typed effects where the
  shared vocabulary reaches.
- A **provenance** — where it came from; the story riding on the object. The
  provenance is to gear what the esoteric clause is to a quirk: it must explain
  the mechanic.

The corpus lives in `app/src/lib/gear.ts`. Full weapon and armour stat blocks
are the Gear pillar's job later; until then each card is self-contained.

### What each pool means

- **Good gear is a genuinely fine thing** — masterwork, rare, sacred, or
  simply worth real coin. It may trail a story, but the story has no dice.
- **Bad gear is a problem you carry** — a curse, a debt, contraband, a stolen
  crest. Never merely a shoddy version of normal kit: a junk sword is a dull
  result, a stolen one is a story. Bad gear pairs with a Good quirk, so it can
  afford to be genuinely inconvenient.
- **Neutral gear is a strange thing** — no modifier, all hook. A broken orb, a
  key without a lock. The maybe-powerful, maybe-not pieces live here.

The rolled piece sits **on top of** ordinary equipment: shopping with starting
coin happens after the roll (see `mechanics/markets.md`), so nobody is armed or
unarmed by the seesaw alone.

### The gear corpus

Fourteen to start.

| Gear | Category | The one idea |
|---|---|---|
| **A Master's Work** | Good | A weapon better than your station, and questions to match. |
| **A Relic of {saint}** | Good | A dying pilgrim's mistake is your blessing. |
| **A Letter of Passage** | Good | A door your grandparents opened is still ajar. |
| **A Wheellock Pistol** | Good | A year's wages that fires twenty times. |
| **A Physician's Kit, Fully Stocked** | Good | A dead man's trade, ready for a living pair of hands. |
| **A Broken Orb** | Neutral | It does nothing, except on feast days, when it hums. |
| **A Dead Man's Diary** | Neutral | The last entry stops mid-sentence. |
| **A Key Without a Lock** | Neutral | Your mother sewed it into her hem and never said why. |
| **A Soldier's {weapon}** | Neutral | Seventeen notches, and room left for more. |
| **A Dog of No Particular Breed** | Neutral | It was waiting at your door as though you were late. |
| **A Cursed Rabbit's Foot** | Bad | You cannot lose it, and it will not let you be lucky. |
| **A Debt Come Due** | Bad | You do not remember signing. It is your signature. |
| **Another Man's {weapon}** | Bad | A fine blade wearing somebody else's crest. |
| **A Black Tongue Pamphlet** | Bad | You cannot read it, and you keep it anyway. |

### Still to author

- More cards in every pool, Bad and Neutral quirks first.
- The starting-coin roll (separate, not seesawed — amount and dice TBD).
- Gear cards that open a Market (the Black Tongue Pamphlet gestures at this;
  see `mechanics/markets.md` for access rules).
