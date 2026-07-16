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
| `grantProficiency` | a Weapon Proficiency the Class/Path would not allow | one of the 17 groups |
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

Ten to start. The list lives in `app/src/lib/quirks.ts` as the machine-readable
source; this section is the design record of what each one is *for*.

| Quirk | The one idea |
|---|---|
| **Veteran of the Ferals War** | You learned one enemy and one weapon too well to sleep easy. |
| **Salt-Blooded** | *(weakest of the ten — the swim penalty and the fish taboo are two ideas; rewrite or cut.)* |
| **Gutter Auld** | You have the church's tongue and the parish's mouth. |
| **Left the Order at Compline** | You walked out with your conviction intact and your welcome spent. |
| **Bought a Bow in Waldheim** | You own a weapon your training never gave you, and a debt with it. |
| **Cousin to the Kellish** | The tongue that opens one door closes another. |
| **The Third Milestone** | The habit that keeps you quick is the habit that owns you. |
| **Read One Page Too Many** | You always read it before you resist it. |
| **Hands Like a Cooper** | The eye that makes a thing well will not let you break one. |
| **Owed a Saint's Debt** | The saint who keeps you standing also keeps your calendar. |

*Salt-Blooded* is kept as a deliberate counter-example: it is the failure the
authoring standard exists to catch.

### Target size

Thirty quirks is enough that a table of five sees no repeats. A hundred is enough
that a player on their twelfth character is still surprised — but at this
standard a hundred is real authoring work, and it goes stale if burned through in
one sitting. Add in batches; let slots do the multiplying.

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

## Gear

The gear roll rides the same engine: same slot resolution, same rolling, a
different table. It is not built yet.
