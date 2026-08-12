# Encumbrance & Carrying Gear

How a character carries their gear, how much it weighs on them, and what it takes to get a thing into hand. Deliberately light: four states, one number, three bands, no bookkeeping beyond a weight column.

## Gear States

Everything on your body is in one of four states. Where a thing rides is the player's choice, and the choice is a trade: the readier it is, the more it weighs on you.

| State | Where it is | To get it in hand | Load |
|---|---|---|---|
| **Held** | in your hands | — | full weight |
| **Worn** | on the body: clothing, armour | — | full weight; worn armour none |
| **Equipped** | at the ready on your person: a dagger in the belt, a quiver | **Move action** | full weight |
| **Stored** | inside a Container | **Standard action** | Container coefficient |

- **You have two hands.** Weapons state the hands they fill; a shield fills one. Held gear beyond two hands is the table's problem — the sheet warns, the GM adjudicates.
- **Armour and shields are never Equipped.** On your person they are Worn or Stored — there is no drawing a cuirass, and strapping on a shield takes longer than a Move.
- Putting a thing away costs the same action as getting it out. Dropping a Held item is free.
- Feats and gear can improve these actions. *(Cues: a bandolier, a quick-draw scabbard, a Quick Draw Feat — for the Feats and equipment sessions.)*

## Load

Your **Load** is the total weight of everything Held, Worn, Equipped, or Stored on your body, Containers included.

**Worn armour does not count toward Load.** Its burden is already priced into its own Speed and Stealth penalties — counting its weight too would charge twice. A *spare* suit of armour packed in a bag counts in full.

## Load Bands

**Base Load = 25 + (5 × Str) lb** *(minimum 5 lb)*.

| Band | Carrying | Effect |
|---|---|---|
| **None** | up to Base Load | no effect |
| **Light** | up to 2 × Base Load | −5' Speed · −1 to all physical skill checks |
| **Heavy** | anything beyond | −10' Speed · −2 to all physical skill checks |

*Physical skill checks* are checks with skills governed by Str, Dex, or Con — the same set the armour non-proficiency penalty touches.

There is no hard maximum. Heavy has no upper edge; when someone shoulders something absurd, the GM adjudicates.

## Containers

A **Container** is any item that holds other items (backpack, sack, saddlebag). Each carries two numbers *(re-ruled Aug 12 2026 — capacities are now tracked, and the discount standardized at 10%/20%)*:

- **Capacity** — the weight it holds, in lb. The sheet lists it beside the Container. What exceeds it is the table's problem — the sheet warns, the GM adjudicates.
- **Coefficient** — a purpose-built carrier multiplies its contents' weight by **×0.9** (a 10% discount); a **Masterwork** carrier by **×0.8** (20%). Bulk vessels carry at full weight (×1). The Container's own weight always counts in full.

| Container | Capacity | Coefficient |
|---|---|---|
| Belt pouch | 2 lb | ×0.9 |
| Satchel | 15 lb | ×0.9 |
| Backpack | 50 lb | ×0.9 |
| Saddlebags | 60 lb | ×0.9 |
| Kit bags (Healer's Kit and kin) | 3 lb | ×0.9 |
| Sack, large | 40 lb | ×1 |
| Basket | 25 lb | ×1 |
| Chest, wooden | 150 lb | ×1 |
| Strongbox | 50 lb | ×1 |
| Barrel | 250 lb | ×1 |

- Masterwork versions of the ×0.9 carriers pack at ×0.8; they join the catalogue with the Masterwork gear batch.
- Nested Containers compound their coefficients.
- Keep the fractions in the math; round the final Load to the nearest pound.

The data lives in `app/src/lib/equipment.ts` (`CONTAINERS`, `KITS`: `capacityLb` + `coefficient`).

## Feats & Quirks

Character traits touch Encumbrance in two ways: **counting your Str as greater (or lesser) for Load purposes** — the fine-grained hook — and **Band shifts** — the big moves. Gear coefficients handle the multiplicative fun.

### The Encumbrance Feat Ladder

A **Feat Ladder** is a Feat with Ranks, climbed on the same advance economy as any other Ladder (≤1 Rank per Level):

| Rank | Effect | Cost |
|---|---|---|
| 1 | Count your Str as +1 greater for the purposes of Encumbrance | m |
| 2 | …as +2 greater | m |
| 3 | And Heavy Loads only count as Light Loads | M |

*(Feat name: [[add text]] — working title "the Encumbrance Feat Ladder".)*

### Quirk hooks

Quirks may count Str as ±1 for Load, or shift a Band in either direction (an unlucky Quirk makes you carry heavier). Flagged for the next Quirks session.

## Still to author

- ~~**Item weights**~~ — ✅ done: the equipment page (`app/src/content/rules/equipment.md`) carries a weight column across all its tables.
