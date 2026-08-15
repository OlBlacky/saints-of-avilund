---
title: Encumbrance &amp; Carrying Gear
summary: The three Gear States, the Equipped Limit, and the Load Bands.
---

Everything on your person sits in one of three **Gear States**, and two numbers govern them: the **Equipped Limit**, which caps what you keep at the ready, and your **Load**, which is what it all weighs.

## Gear States

Where a thing rides is your choice, and the choice is a trade: the readier it is, the fewer of them you can keep that way.

| State | Where it is | To get it in hand | Load |
|---|---|---|---|
| **Worn** | on the body: clothing, armour, and every Container | not retrieved — you are already wearing it | full weight, unless **0-Enc** |
| **Equipped** | at the ready on your person: a dagger in the belt, a quiver, a shield | `move` | full weight |
| **Stored** | inside a Container | the Container's **Access** | after the Container's Coefficient |

- **Only tagged items may be Worn.** Clothing, armour, and Containers carry the tag; a greatsword does not.
- **Armour is Worn. Shields are Equipped.** The first Equipped shield feeds your AC and DR. Changing what you wear happens out of combat.
- **A Container is never Equipped.** You do not draw a backpack, you open it, and the action for that is its Access.
- **You still have two hands.** Weapons state the hands they fill, and a shield fills one.
- Putting a thing away costs the same action as getting it out.

### The 0-Enc Tag

Some Worn items carry the **0-Enc** tag: their weight does not count toward Load.

- **Armour** carries it — its burden is already priced into its own Speed and Stealth penalties. A *spare* suit packed in a bag counts in full.
- **Clothing** carries it.
- **Containers never carry it.** A Container's own weight always counts.

## The Equipped Limit

**Equipped Limit = 5 + Str + Dex + Con** *(minimum 5)*.

Past the Limit the Game Master adjudicates. It is not a wall.

Items in a Container are **Stored**, not Equipped, whatever the Container's Access. They never count against the Limit.

## Load

Your **Load** is the total weight of everything Worn, Equipped, or Stored on your person, Containers included, less anything tagged 0-Enc.

**Base Load = 40 + (10 × Str) lb**, plus **15 lb per Rank** of the Strongback Ladder.

| Band | Carrying | Effect |
|---|---|---|
| **None** | up to Base Load | no effect |
| **Light** | up to 2 × Base Load | −5' Speed · −1 to all physical skill checks |
| **Heavy** | anything beyond | −10' Speed · −2 to all physical skill checks |

*Physical skill checks* are checks with [Skills](../skills/) governed by Str, Dex, or Con — the same set the armour non-proficiency penalty touches.

There is no hard maximum. Heavy has no upper edge; when someone shoulders something absurd, the Game Master adjudicates.

| Str | Base Load | With 1 Rank | With 2 Ranks | Light to (2 Ranks) |
|---|---|---|---|---|
| −1 | 30 lb | 45 lb | 60 lb | 120 lb |
| +0 | 40 lb | 55 lb | 70 lb | 140 lb |
| +2 | 60 lb | 75 lb | 90 lb | 180 lb |
| +3 | 70 lb | 85 lb | 100 lb | 200 lb |
| +5 | 90 lb | 105 lb | 120 lb | 240 lb |

## Containers

A **Container** is any item that holds other items. Each has three dials:

- **Capacity** — the weight it holds, in lb, checked against the **raw** weight of its contents. What exceeds Capacity is the table's problem, and the Game Master adjudicates.
- **Coefficient** — multiplies its contents' Load. A purpose-built carrier packs at ×0.9, a **Masterwork** carrier at ×0.8, a bulk vessel at ×1.
- **Access** — the action to get one item out of it.

Every Container and its three dials are on the [Equipment](../equipment/#gear) page.

- **Nested Containers** compound their Coefficients and take the **slowest Access** in the chain.
- **Ammunition Containers** — quiver, bolt case, sling stone bag, powder horn — take no Coefficient discount, and drawing from one is not an action of its own: it is folded into the reload the weapon already charges for. Packed inside something slower they lose that, because then the pack has to be opened first.
- **Ammunition is the shot; what carries it is a Container.**
- Keep the fractions in the math; round the final Load to the nearest pound.

## Feats

### Strongback

A **Feat Ladder** is a [Feat](../feats/) with Ranks, climbed on the same advance economy as any other Ladder — no more than one Rank per Level.

| Rank | Effect | Cost |
|---|---|---|
| 1 | +15 lb to your Base Load | m |
| 2 | +30 lb to your Base Load | m |
| 3 | And Heavy Loads only count as Light Loads | M |

Ranks 1 and 2 grant pounds, not Strength.

### Quick Draw

| Feat | Effect |
|---|---|
| **Quick Draw** | Retrieving an item improves by one rung on the action ladder: drawing or swapping an Equipped item costs a `minor` instead of a `move`, and every Container's Access advances a rung. |
