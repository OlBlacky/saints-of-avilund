---
title: Conditions
summary: The laddered conditions — ongoing damage and the debuff scales — and how they are applied, advanced, and ended.
---

A **Condition** is a lasting effect an Ability hangs on its target — as opposed to an instant Effect, which resolves at once. Rather than a long list of separate conditions, Avilund uses a handful of **laddered scales**: each is four Ranks deep, and the familiar names (Dazed, Stunned, Slowed, and the rest) are simply labels for Ranks on those Ladders.

## How a condition works

- **Four ranks.** Rank 1 usually comes with the Ability; **Ranks 2 and 3 each cost a Minor** Advance (<span class="pip pip--m">m</span>), and **Rank 4 costs a Major** (<span class="pip pip--M">M</span>).
- **Flat numbers only.** Avilund uses no advantage or disadvantage — conditions apply flat penalties and bonuses.
- **Ending a condition.** Most are **save ends**: at the end of the target's turn they make a save — **d20 + the attribute of the defence the condition struck, against the Ability's DC** (its to-hit bonus + 10). Some end instead through **an action and a check** (First Aid to stop a Bleed), or simply run out on the Ability's **Duration**.

## The ladders

### Ongoing Damage
Typed damage each round — **Bleed, Fire, Poison** (and Acid, Cold, Necrotic, Lightning, Radiant, Eldritch). The type lets resistance, immunity, and Vulnerable interact. **Eldritch Damage** ignores Temp HP — the mark of [The Outside](../abilities/#the-outside).

| Rank | Effect | Cost |
|---|---|---|
| 1 | 1 damage per round | — |
| 2 | 2 per round | <span class="pip pip--m">m</span> |
| 3 | 3 per round | <span class="pip pip--m">m</span> |
| 4 | 3 per round, and the target saves at **−2** | <span class="pip pip--M">M</span> |

### Action Denial
Strips actions from the target — the Dazed-to-Stunned axis.

| Rank | Effect | Cost |
|---|---|---|
| 1 | no Reactions or Interrupts (Dazed) | — |
| 2 | + no Minor action (Dazed) | <span class="pip pip--m">m</span> |
| 3 | + no Move action (Dazed) | <span class="pip pip--m">m</span> |
| 4 | no actions at all (Stunned) | <span class="pip pip--M">M</span> |

### Movement
Slows the target, then stops it.

| Rank | Effect | Cost |
|---|---|---|
| 1 | Slowed −5' | — |
| 2 | Slowed −10' | <span class="pip pip--m">m</span> |
| 3 | Slowed −15' | <span class="pip pip--m">m</span> |
| 4 | Immobilized | <span class="pip pip--M">M</span> |

### Sensory
Dims the senses — blinds and deafens.

| Rank | Effect | Cost |
|---|---|---|
| 1 | −1 to attack & Perception rolls | — |
| 2 | −2 to attack & Perception rolls | <span class="pip pip--m">m</span> |
| 3 | −2 to attack & Perception, and no Interrupts or Reactions | <span class="pip pip--m">m</span> |
| 4 | Blind or Deaf | <span class="pip pip--M">M</span> |

### Flat Debuff
A penalty to a chosen defence, escalating into Vulnerable.

| Rank | Effect | Cost |
|---|---|---|
| 1 | −1 to a chosen defence | — |
| 2 | −2 | <span class="pip pip--m">m</span> |
| 3 | −2 and Vulnerable 1 | <span class="pip pip--m">m</span> |
| 4 | −2 and Vulnerable 3 | <span class="pip pip--M">M</span> |

The penalty caps at −2; powerful abilities may apply it to all physical or all mental defences at once. **Vulnerable N** means the target takes N extra damage — either from a chosen damage type, or against a specific defence.

### Control
Bends the target's will toward the source of the effect.

| Rank | Effect | Cost |
|---|---|---|
| 1 | **Confused** — at the start of each of its turns, roll on the **Confusion table** below | — |
| 2 | **Charmed** — cannot attack the source | <span class="pip pip--m">m</span> |
| 3 | **Ensorcelled** — cannot attack the source, and may be compelled to strike the nearest creature | <span class="pip pip--m">m</span> |
| 4 | **Dominated** — the source dictates the target's actions | <span class="pip pip--M">M</span> |

**The Confusion table.** A **Confused** creature, at the start of each of its turns, rolls a d6 to see what it does that turn:

| d6 | The creature… |
|---|---|
| 1–2 | attacks the **nearest** creature it can reach — ally or foe |
| 3–4 | lurches its full Speed in a **random direction**, and does nothing else |
| 5 | stands **inert** — no actions |
| 6 | acts **normally** |

### Fear
Drives the target away from the source — the *object*, which is the caster by default, or whatever the Ability designates.

| Rank | Effect | Cost |
|---|---|---|
| 1 | −1 to attack rolls | — |
| 2 | −1 to attack, and cannot move closer to the object | <span class="pip pip--m">m</span> |
| 3 | as above, and cannot attack the object | <span class="pip pip--m">m</span> |
| 4 | flees the object until the Duration expires | <span class="pip pip--M">M</span> |

### Madness
The mind coming apart — it worsens the Confusion roll, then breaks it entirely. The signature ladder of [The Outside](../abilities/#the-outside).

| Rank | Effect | Cost |
|---|---|---|
| 1 | **Confused** — roll on the Confusion table (under Control, above) | — |
| 2 | Confused, and **−1** to the Confusion roll *(a lower roll is worse)* | <span class="pip pip--m">m</span> |
| 3 | Confused, and **−2** to the Confusion roll | <span class="pip pip--m">m</span> |
| 4 | **Insane** — no roll: it may take only a single action each turn, an unarmed attack against itself | <span class="pip pip--M">M</span> |
