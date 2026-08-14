# Masterwork

Redesigned 2026-08-14 (supersedes the flat one-benefit-per-item table of 2026-07-16, which survives below as the base grades). A Masterwork item is a **base grade** plus an à-la-carte menu of **Qualities**.

## Where it's sold

- **Home market only.** Masterwork gear of any kind is sold only in its **home market** — the Regional Market of the place famous for making it (see [markets.md](markets.md), Regional Markets). Not commissioned elsewhere, not stocked elsewhere. This applies at character creation too: a PC from the right region can arrive with one fine piece nobody else can buy. May loosen in play later; this is the standing rule.
- **Named goods.** Masterwork bought in a home market carries that market's regional name — **Mantlethorn Leather** *(Masterwork Leather Armour)*. Regional name leads; the canonical item type sits in the parenthetical so the rules always resolve. One name per market; names are authored, never generated. *(Names: [[add text]] per market.)*
- A Masterwork item can be **brought back to its home market** to have further Qualities added later.
- PC crafting of masterwork: open question, deferred.

## The base grade

**Masterwork = +1 to the thing the item is for.** One idiom everywhere; it is the sanctioned paid-for exception to the training caps (design-principles §2).

| Item | Base benefit | Days | Surcharge |
|---|---|---|---|
| Shield | −5 lb | 5 | 50 sp |
| Tools | +1 to its checks | 10 | 100 sp |
| Weapon | +1 attack | 20 | 200 sp |
| Armour | **+1 AC** | 30 | 300 sp |

Armour's old benefit (−10 lb, one drawback eased) is replaced: worn armour carries no Load, so weight had no game effect. The surcharge is still the master's wage (10 sp/day) × the days — derived, not picked.

## Qualities

- A Quality attaches **only to a Masterwork item**, bought at the item's home market at purchase or retrofitted later.
- **Maximum 2 Qualities per item** — flat, universal, every category. Each Quality once per item.
- Each home market offers a menu of **4 Qualities per item**: **two good** (10 days · 100 sp) and **two great** (20 days · 200 sp). Priced as wage × days, like the base.
- The two greats may be **mutually exclusive** where the craft demands it (you can't boil and layer the same hide) — then the top build is base + one great + one good.
- Menus hold the category's character; the base grade is uniform. Prefer conditional effects over flat numbers for greats (design-principles §2).

## Leather Armour — Mantlethorn Castle Market

Covers Leather, Studded Leather, and Hide. Sold at **Mantlethorn Castle Market** (see [markets.md](markets.md)); the named good is **Mantlethorn Leather** *(Masterwork Leather Armour)*.

| Name | Quality | Days | Cost | Notes |
|---|---|---|---|---|
| Blackened | +1 Stealth | 10 | 100 sp | |
| Fur Lined | Resist Cold 1 | 10 | 100 sp | +2 lb wt. Leather & Studded only |
| Grim Trophy | +1 Intimidate | 10 | 100 sp | Hide only |
| Boiled Leather | +1 DR vs. Slashing, Piercing | 20 | 200 sp | Can't be taken with Layered |
| Layered | +1 Dex Defence, +1 Dex Save, +1 DR vs. Area Effects | 20 | 200 sp | Can't be taken with Boiled Leather |

- Hide swaps Fur Lined for Grim Trophy — hide is already fur. First case of a Quality slot varying by item within a category.
- DR never stacks; use the better line.

## Still to author

- Weapon menus (next), shield and tool menus, the other armour categories and their home markets.
- Code sweep once weapons settle: `MASTERWORK` in `app/src/lib/equipment.ts`, market data, equipment page display, item instances carrying Qualities.
- Terminology sweep: older mechanics docs still say "Reflex" — canonical is **Dex Defence / Dex Save**.
