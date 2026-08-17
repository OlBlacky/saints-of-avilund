# Armour

*Source of truth: `app/src/lib/equipment.ts` (`ARMOURS`, `SHIELDS`, `ARMOUR_TIER_AC`). The tables below mirror it; when they disagree, the code is right.*

## How Armour Works

Every attribute carries two Defence Targets — an **Unarmoured Defence** and an **Armoured Defence**. Worn armour raises the Armoured one:

**Armoured Defence = 10 + Attribute + Defence Ranks + Armour + other bonuses**

Your **AC** — the number most physical attacks must beat — is your Armoured Constitution Defence.

Armour does two things at once:

- **AC**, flat **by tier**: Light **+1**, Medium **+2**, Heavy **+3**. Every armour in a tier gives the same bonus. This is the whole of it — a piece never buys more AC by being heavier.
- **Damage Reduction (DR)**, subtracted from the damage of each hit that lands. *Within* a tier, the heavier pieces buy DR at the price of weight, coin, and drawback.

DR runs on a deliberately short ladder — **0 to 3** across the entire catalogue, with **Full Plate** alone at the top (small numbers, design-principles §1). Several sources of DR stack, so no single one needs to be large.

Unarmoured is a fighting **style** you take Feats in, not a thing to buy.

---

## Armour Types

| Armour | Tier | AC | DR | Trait | Speed | Stealth | Str | Cost | Weight |
|---|---|---|---|---|---|---|---|---|---|
| Leather | Light | +1 | 0 | — | — | — | — | 10 sp | 15 lb |
| Studded Leather | Light | +1 | 1 | — | — | — | — | 25 sp | 20 lb |
| Hide | Light | +1 | 1 | Resist Cold 1 | — | — | — | 15 sp | 25 lb |
| Chain Shirt | Medium | +2 | 1 | — | −5' | −1 | — | 50 sp | 25 lb |
| Scale / Ring Mail | Medium | +2 | 2 | — | −5' | −1 | — | 100 sp | 30 lb |
| Breastplate | Medium | +2 | 2 | Mobility | — | −1 | — | 200 sp | 20 lb |
| Chain Mail | Heavy | +3 | 1 | — | −5' | −2 | +1 | 150 sp | 40 lb |
| Splint / Banded Mail | Heavy | +3 | 2 | — | −10' | −2 | +1 | 200 sp | 45 lb |
| Full Plate | Heavy | +3 | 3 | — | −10' | −2 | +2 | 750 sp | 50 lb |

**Str** is a required **modifier**, not a score: **+1** means an attribute modifier of +1 or better.

The drawbacks by tier:

- **Light** armour carries **no penalties** at all.
- **Medium** armour takes **−1 Stealth**. The **Breastplate** keeps the Stealth penalty but loses the Speed penalty — its **Mobility**.
- **Heavy** armour takes **−2 Stealth** and needs the listed **Strength**. Speed is **−10'**, except **Chain Mail**, which bends enough to cost only **−5'**.

Masterwork armour and Armour Specialization Feats can ease these drawbacks.

---

## Shields

A shield gives **both its AC and its DR only while it is raised** — nothing about it is passive but its weight and its Speed penalty. Each occupies a hand, so a two-handed weapon and a shield are exclusive.

| Shield | Proficiency | AC | DR | Bash | Speed | Cost | Weight |
|---|---|---|---|---|---|---|---|
| Buckler | Light Shield | +1 | — | 1d3 Blunt | — | 5 sp | 3 lb |
| Standard Shield | Light Shield | +1 | 1 | 1d4 Blunt | — | 12 sp | 6 lb |
| Heater / Kite / Round | Heavy Shield | +2 | 1 | 1d4 Blunt | −5' | 30 sp | 12 lb |
| Tower Shield | Heavy Shield | +2 | 2 | 1d4 Blunt | −10' | 60 sp | 25 lb |

A shield's AC stacks on your armour's. **Raising a shield** can be done two ways:

- **Anyone proficient** may raise their shield as a **Standard Action**, gaining its AC and DR until the start of their next turn — re-paid every turn.
- The **Raise Shield** Ability (Arms) does it far better: from a Move Action down to **Free**, and its Feats extend your Shield DR to the allies you protect.

A shield is also a weapon, and its Shield Proficiency is its Weapon Proficiency. Bashing is a **Standard Action** like any Basic Attack — **Strength** vs AC, dealing the shield's **Bash** die, at **−1** Untrained, **+0** Trained, **+1** per Rank. The **Shield Bash** Ability (Protection) sets all of that aside: it carries its own attack line and its own action, and only borrows the shield's die — written **1[S]** on the card.

---

## Armour Proficiencies

Every **Class** grants some Armour Proficiencies; some **Subclasses** grant additional ones. You receive **all** of your Class's and Subclass's Armour Proficiencies automatically.

*Example — the **Soldier** comes with Light Armour, Medium Armour, and Light Shield. The **Vanguard** Subclass additionally grants Heavy Armour and Heavy Shield.*

The five Proficiencies and what they unlock:

| Proficiency | Unlocks |
|---|---|
| Light Armour | Leather, Studded Leather, Hide |
| Medium Armour | Chain Shirt, Scale / Ring Mail, Breastplate |
| Heavy Armour | Chain Mail, Splint / Banded Mail, Full Plate |
| Light Shield | Buckler, Standard Shield |
| Heavy Shield | Heater / Kite / Round, Tower Shield |

Beyond your Class/Subclass grants, **any character may buy any Armour Proficiency** for a **Minor Advance** — but a Proficiency gained this way stays at base and **can never be advanced**. Only your Class/Subclass Armour Proficiencies climb the scale below.

### Non-Proficiency Penalty

Using armour or a shield you aren't proficient with imposes a penalty to **physical skill checks**:

| Without Proficiency in… | Penalty |
|---|---|
| Light Armour · Medium Armour · Light Shield | −1 |
| Heavy Armour · Heavy Shield | −2 |

Being proficient is +0. Attack rolls are untouched; a shield's bash runs off its Proficiency as a weapon (see [Core Mechanics](core-mechanics.md), Bashing With a Shield).

### Advancing a Proficiency

Armour Proficiencies advance exactly as Weapon Proficiencies do. Only your Class/Subclass Armour Proficiencies can be advanced: a **Minor Advance** buys **+1**, a second **+1** unlocks at **5th Level**, capped at **+2**. The bonus applies to your **AC** while wearing armour (or bearing a shield) of that Proficiency.

### Armour Specialization Feats

Some Classes and Subclasses have access to **Armour Specialization Feats**, gated by Class/Subclass. These **modify your defensive Abilities** when wearing the relevant armour type — the armour counterpart to the Weapon Specialization Feats that modify offensive Abilities (see [weapons.md](weapons.md)).

Armour Specialization Feats can only be taken at **Level 2 or higher**.

---

## Masterwork Armour

The Masterwork base grade for armour is **+1 AC** — 30 days, a 300 sp surcharge (see [masterwork.md](masterwork.md)). It is the sanctioned paid-for exception to the caps: the +1 stacks past both the **+2** Armour Proficiency ceiling and the tier's flat bonus. Masterwork is commissioned at its home market, never stocked.

---

## Balance Reference

| Build | AC | DR |
|---|---|---|
| Scoundrel in Studded Leather *(Con +2, Defence Ranks +2)* | 10 + 2 + 2 + 1 = **15** | 1 |
| Soldier in Scale / Ring Mail + Standard Shield *(Con +2, Ranks +2)* | **16**, or **17** raised | 2, or 3 raised |
| Vanguard in Splint / Banded + Heater *(Con +3, Ranks +2)* | **18**, or **20** raised | 2, or 3 raised |
| Vanguard in Full Plate + Tower Shield *(Con +3, Ranks +2)* | **18**, or **20** raised | 3, or 5 raised |

The light and heavy builds land nearer each other on **AC** than the tiers suggest — the gap that matters is **DR**, and it is paid for in Speed, Stealth, Strength, and coin. The Full Plate and Tower Shield build is the hardest in the game to hurt, and the slowest, loudest, and dearest thing on the field.
