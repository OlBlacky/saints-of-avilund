# Encumbrance & Carrying Gear

How a character carries their gear, how much it weighs on them, and what it takes to get a thing into hand. Deliberately light: three states, two numbers, three bands, no bookkeeping beyond a weight column.

## Gear States

Everything on your person is in one of three states. Where a thing rides is the player's choice, and the choice is a trade: the readier it is, the fewer of them you can keep that way.

| State | Where it is | To get it in hand | Load |
|---|---|---|---|
| **Worn** | on the body: clothing, armour, and every Container | not retrieved — you are already wearing it | full weight, unless **0-Enc** |
| **Equipped** | at the ready on your person: a dagger in the belt, a quiver, a shield | `move` | full weight |
| **Stored** | inside a Container | the Container's **Access** | Container Coefficient |

- **Only tagged items may be Worn.** Clothing, armour, and Containers carry the tag; a greatsword does not. The sheet offers a state only where it is legal.
- **Armour is Worn. Shields are Equipped.** A shield rides on the arm at the ready, and the first Equipped shield feeds AC and DR on the sheet. There is no drawing a cuirass — changing what you wear happens out of combat.
- **A Container is never Equipped.** You do not draw a backpack, you open it, and the action for that is its Access — so a Container's own state answers only whether it is on you. Worn covers a barrel as readily as a bandolier; the Load Bands are what make hauling a barrel a bad idea.
- **You still have two hands.** The sheet does not track what is in them; the table does. Weapons state the hands they fill, and a shield fills one.
- Putting a thing away costs the same action as getting it out.

### The 0-Enc Tag

Some Worn items carry the **0-Enc** tag: their weight does not count toward Load.

- **Armour** carries it because its burden is already priced into its own Speed and Stealth penalties. Counting the weight too would charge twice. A *spare* suit packed in a bag counts in full.
- **Clothing** carries it because it is trivial.
- **Containers never carry it.** The thing doing the carrying is not clothing, and its own weight always counts.

## The Equipped Limit

**Equipped Limit = 5 + Str + Dex + Con** *(minimum 5)*.

All three physical attributes contribute: how much you can keep at the ready is a matter of strength, deftness, and the stamina to wear it all day.

The minimum of 5 is deliberate. A floor lower than that does not make a frail character interesting, it gives them a per-session inventory chore — everyone can carry a staff and a few things besides.

The Limit and its arithmetic lead the Gear page alongside Load, where the decision is actually made. Past the Limit the sheet warns in amber and the GM adjudicates. It is not a wall.

**Items in a Container are Stored, not Equipped, whatever the Container's Access.** They never count against the Limit. This is why a bandolier is worth buying: it buys you readiness that the Limit does not charge you for, bounded instead by the Container's Capacity and its price.

## Load

Your **Load** is the total weight of everything Worn, Equipped, or Stored on your person, Containers included, less anything tagged 0-Enc.

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

A **Container** is any item that holds other items. Each has three dials:

- **Capacity** — the weight it holds, in lb, checked against the **raw** weight of its contents. A good bag carries easier, not more. What exceeds Capacity is the table's problem — the sheet warns, the GM adjudicates.
- **Coefficient** — multiplies its contents' Load. A purpose-built carrier packs at **×0.9**, a **Masterwork** carrier at **×0.8**, a bulk vessel at **×1**.
- **Access** — the action to get one item out, on the standard action ladder. `standard` by default; quick-draw carriers do better.

| Container | Capacity | Coefficient | Access |
|---|---|---|---|
| Belt pouch | 2 lb | ×0.9 | `move` |
| Bandolier | 5 lb | ×1 | `move` |
| Quiver | 3 lb | ×1 | `free` — part of the reload action |
| Bolt case | 1 lb | ×1 | `free` — part of the reload action |
| Sling stone bag | 1 lb | ×1 | `free` — part of the reload action |
| Powder horn | 2 lb | ×1 | `free` — part of the reload action |
| Kit bags (Healer's Kit and kin) | 3 lb | ×0.9 | `standard` |
| Satchel | 15 lb | ×0.9 | `standard` |
| Backpack | 50 lb | ×0.9 | `standard` |
| Saddlebags | 60 lb | ×0.9 | `standard` |
| Sack, large | 40 lb | ×1 | `standard` |
| Basket | 25 lb | ×1 | `standard` |
| Strongbox | 50 lb | ×1 | `standard` |
| Chest, wooden | 150 lb | ×1 | `standard` |
| Barrel | 250 lb | ×1 | `standard` |

- The **Bandolier** takes no Coefficient discount. Its edge is speed, so it is not also the best pack.
- **Ammunition Containers** — quiver, bolt case, sling stone bag, powder horn — take no Coefficient discount either. Drawing from one is not an action of its own: it is folded into the reload the weapon already charges for. Packed inside something slower they lose the qualifier along with the rung, because then the pack has to be opened first.
- **Ammunition is the shot; what carries it is a Container.** A quiver is a bag with an Access rung, not a kind of arrow, so it lives with the Containers.
- Masterwork versions of the ×0.9 carriers pack at ×0.8; they join the catalogue with the Masterwork gear batch.
- **Nested Containers** compound their Coefficients and take the **slowest Access in the chain**.
- Keep the fractions in the math; round the final Load to the nearest pound.

### Two Weights, Always

A Container shows both of its numbers, because they answer different questions:

- **Capacity used** — raw weight against Capacity (*18 / 50 lb*)
- **Load contribution** — after the Coefficient (*16.2 lb*)

### The Container Box

Every Container prints a box on the sheet carrying its three dials and a line of plain rules text. Whatever is unusual about a Container is stated there, at the point of use, rather than learned from a table elsewhere.

The data lives in `app/src/lib/equipment.ts` (`CONTAINERS`, `KITS`: `capacityLb` + `coefficient` + `access`).

## Feats & Quirks

Character traits touch Encumbrance in four ways: **counting your Str as greater (or lesser) for Load purposes** — the fine-grained hook — **Band shifts**, **the Equipped Limit**, and **Access rungs**. Gear Coefficients handle the multiplicative fun.

### The Encumbrance Feat Ladder

A **Feat Ladder** is a Feat with Ranks, climbed on the same advance economy as any other Ladder (≤1 Rank per Level):

| Rank | Effect | Cost |
|---|---|---|
| 1 | Count your Str as +1 greater for the purposes of Encumbrance | m |
| 2 | …as +2 greater | m |
| 3 | And Heavy Loads only count as Light Loads | M |

*(Feat name: [[add text]] — working title "the Encumbrance Feat Ladder".)*

### Quick Draw & Deft Hands

Two Feats, one Minor each, on two different rungs with no overlap between them:

| Feat | Effect |
|---|---|
| **Quick Draw** | Drawing or swapping an Equipped item costs a `minor` instead of a `move`. |
| **Deft Hands** | Advance a Container's Access by one rung. A bandolier in quick hands gives up its contents on a `minor`. |

Both are cues awaiting flavour text: [[add text]].

### Quirk hooks

Quirks may count Str as ±1 for Load, shift a Band in either direction, or move the Equipped Limit. Flagged for the next Quirks session.

## For the Sheet

Every number here is derived, built from `{ label, value }` contributors the way AC and Speed already are, so a Feat, Quirk, or item can add a line to any of them.

**Character:** `strForLoad` (Str as counted for Encumbrance only, separate from Str) · `baseLoad` · `load` · `loadBand` (with a band-shift modifier applied *after* the raw band) · `equippedCap` · `drawCost`.

**Per Container:** `capacityLb` · `coefficient` · `access` · `contentsRaw` · `contentsEffective` · `overCapacity`.

**Per item:** `countsForLoad` (from 0-Enc) · `effectiveWeight` · `allowedLocations` (from the `wearable` and `carrier` tags).

Store `access` and `drawCost` as **indices on the action ladder** (`full-round` → `standard` → `move` → `minor` → `free`), not as strings. Then Deft Hands is arithmetic, and nested Access is a `max()`.

## Still to author

- ~~**Item weights**~~ — ✅ done: the equipment page (`app/src/content/rules/equipment.md`) carries a weight column across all its tables.
- ~~**Quick Draw Feat**~~ · ~~**Access-modifying Feats**~~ — ✅ specified above; the Feat cards themselves still want authoring.
- **Bandolier pricing** — joins the catalogue with the next gear batch. Watch whether its 5 lb against the belt pouch's 2 lb is edge enough; that is the dial to turn.
- **Held, for the VTT** — deliberately cut from the sheet: what is in your hands is a moment, not a state, and a printed sheet cannot hold a moment. A VTT or app layer should track it as runtime state, never as sheet data.
