# Markets

Where characters buy and sell. A **Market** is a defined catalog with access rules. Access arrives four ways: everyone has the open Waldheim Markets; the GM opens a Market (to one character or a whole party); a Feat buys access; a Quirk rolls it. A door opened by Quirk or Feat is open **permanently**.

A door can also be **closed for good**: an Ability that renounces a faith shuts its Market, and no Feat reopens it. The first: the **Renunciation of Nicetus** (Witchcraft) closes the Saintly Market. A closed Market drops off the shop entirely — its prices, its sell lines, its listing. (In code: `closedBy` on the Market, `app/src/lib/markets.ts`.)

Every transaction is a logged event touching Wealth and Gear — the record always knows where the poison came from.

## The Waldheim Markets

The standard price list is grounded in a place: **Waldheim**. The plain city market is the game's reference market, and each magic tradition has its own market in the city, each hosted by a ward or institution from the gazetteer (`app/src/pages/geography/waldheim.astro`). Named Aug 10 2026; **display format everywhere: Market Name — Location — Market Type.**

| Market Name | Location | Market Type | Access |
|---|---|---|---|
| **Waldheim Market** | Sever's Cross | *(the Default Market)* | Open to everyone |
| **Imperial Square Market** | Saints' Island | Saintly | Open to everyone |
| **Anselm's Buttery** | Lord's University | New Magic | Feat |
| **St. Ignatius College Archive** | Elder Isle | Elder Magic | Feat |
| **Theobald's Row** | Sebald's Isle | Occult | Feat |
| **Society of Astronomers** | Newton Hill | The Outside | Feat |
| **The Green Market** | The Green | Old Magic | Feat |
| **Black's Road Market** | Black's Road | Black Market | Feat |

Why these hosts: Sever's Cross "holds most of the city's markets" (the reference list *is* Sever's Cross); the Saintly stalls stand in the Cathedral of Saint Avitus's shadow; a buttery is a college's provisions room, and **Saint Anselm** (Coaevi, Letters) "broke the Elder magic and remade it" — the New Magic patron; **St. Ignatius College**'s society still excavates the Elder ruins Waldheim is built on, and its **Archive** sits among the gutted palaces of Elder Isle; **Saint Theobald** is the Minores "whose Canon was granted only a loose Writ" — a market of loose writ; **Newton Hill** hosts the astronomers among the villas; The Green's market hides the Drymanns' stalls in plain sight among the greengrocers; and **Black's Road** is already named for a highwayman — "the Black Market" is a literal place name.

The **Black Faith Market** exists but is **fully hidden** — never listed, never named in the shop. Lore-wise it brushes up against Black's Road in Kingston's lawless sprawl.

## Regional Markets

A **Regional Market** opens by **Place of Origin alone** (re-ruled Aug 15 2026 — the earlier Feat toll is retired): each Market carries an origin tag naming the places it serves, and a character from one of them simply has the door. No Feat, no Advance spent. (In code: `access: { kind: 'origin', places: [...] }` on the Market, values matching `lib/places.ts`; the retired Market Feats replay as no-ops, the Minor refunded.)

- **Visibility: never listed locked.** Unlike the Waldheim family, Regional Markets do not appear greyed out in the shop — they are invisible to everyone but their own, for whom they simply appear. This keeps the shop short as the roster grows — dozens of Regional Markets are anticipated.
- This makes **Place of Origin mechanically load-bearing** (with the Starting Gear `{place}` draws and the Home Language, a third consumer) — reinforcing its graduation from the Identity Box into the spine (builder spec §6).

### St. Dunstan's Magazine — Abbey of the Artillery, Lysander — Firearms Market

The first Regional Market (settled Aug 10 2026). Saint Dunstan — patron of the artillery, whose sect is credited with the invention of gunpowder — keeps his Cathedral at Lysander; the Abbey of the Artillery sells from its own magazine.

- **Open to:** Lysander natives and those of the Bishopric of St. Dunstan.
- **Catalogue:** everything firearms-related on the standard list at **50% of list price** — the Pistols and Rifles weapon groups, grenades, powder and shot, powder horns.
- Later flesh: models the general market doesn't stock, and western exotica off the crusade road.

### St. Ulric's Exchange — Freehold of Havilah — Trade Market *(name proposed — Les to confirm)*

The second Regional Market (Aug 10 2026). Havilah — guild-run, inventor of paper money (1388) and of shares (by 1530); St. Ulric's one thriving church there now patronizes the merchant-houses. The funnel for every northern good off the Kellish and Feral marches.

- **Open to:** Havilah natives.
- **Catalogue** (first stock — more to flesh: furs, northern goods, paper instruments):

| Item | Wt | Buy (Havilah) | Sell (Havilah) | Sell (Waldheim) |
|---|---|---|---|---|
| Animal Pelts, Cured | 10 lb | 20 sp | 5 sp | 30 sp |
| Free City of Havilah Ownership Stock Certificate | — | 50 sp | 49 sp | 55 sp |
| Bank of St. Ulric, Havilah, Ownership Stock Certificate | — | 100 sp | 99 sp | 110 sp |
| Imperial Rampart Mining Company Stock Certificate | — | 10 sp | 5 sp | 11 sp |

What the table demonstrates, mechanically:

- **Per-market sell prices on the item** — the general "sellability lives on the item" rule made concrete: an item can state its own buy-list entries at named Markets, overriding the default 25%. The Waldheim Market's stated prices here are bespoke buy-list entries for goods outside its own catalog.
- **Trade goods** — the pelts are the haul-it-home arbitrage: buy at 20 in Havilah, sell at 30 in Waldheim, profit to whoever carries 10 lb across the map.
- **Paper wealth** — stock certificates are weightless, near-liquid in Havilah (sell-back at 98–99%), and worth *more* in Waldheim: portable money that appreciates southward, invented by the city that invented shares. (Also, certificates are ownership — plot hooks ride along free.)

### Mantlethorn Castle Market — Mantlethorn — Masterwork Leather Market

The third Regional Market (settled Aug 14 2026). **Mantlethorn is Cattle Country** — the northern kingdom keeps cattle, has leather in abundance, and makes the setting's great leather gear.

- **Open to:** Mantlethorn natives.
- **Catalogue:** **Mantlethorn Leather** *(Masterwork Leather Armour)* — the base grade and its Quality menu, per [masterwork.md](masterwork.md). Masterwork sells **only** in its home market, character creation included.
- First carrier of the **named-goods pattern**: masterwork bought at a home market takes the market's regional name, canonical type in the parenthetical.
- **Knights' Stew** — salted and roasted beef and root vegetables packed in tallow. Trail Ration (one day), **4 cp**, 1 lb. Consuming it grants **1 Temp HP** until your next full rest; one stew's benefit at a time.

### The Long Butts — Bynithbrack Water — Masterwork Bows Market

The fourth Regional Market (settled Aug 15 2026). **Dunstanmoore are the masters of the Longbow** — the Republic took Dunstan the craftsman, and the bowyer's and fletcher's trades are its pride. The **City of Bynithbrack Water**, Dunstanmoore's capital, grew up where the **River Nith** (issuing from Lake Nith in the Bishopric of St. Ignatius, at the edge of the Imperial Rampart Mountains) meets the **River Brack**; The Long Butts stand in the city.

- **Open to:** Dunstanmoore natives.
- **Catalogue:** **Dunstanmoore Bowyercraft** *(Masterwork Longbow / Shortbow)* and **Dunstanmoore Fletchercraft** *(masterwork ammunition by the sheaf)* — base grades, Quality menu, and ammunition families per [masterwork.md](masterwork.md).
- **Standard stock at 10% off:** all standard-list bows, arrows, and quivers sell here at **90% of list price** (the St. Dunstan's Magazine pattern, gentler).
- **The Moorish Pasty** — a lamb-filled pastry made to travel well. Trail Ration (one day), **4 cp**, 1 lb. Consuming it grants **1 Temp HP** until your next full rest; one pasty's benefit at a time.

### The Forge Monastery of San Corrado — Port of St. Sever — Masterwork Blades Market

The fifth Regional Market (settled Aug 15 2026). The **Port of St. Sever** has been the place for the best swords and blades in the Empire for over 1000 years. It stands on the southern coast of the **Bishopric of St. Severinius**, where the **River Tempra** (issuing from **Lake Tempra**) lets into the **Choleric Sea** — the smiths' quenching water is in the name. The Patron of Weaponsmiths is **Conrad** (Primi, Arms), who in the Port goes by his Italicized name, **San Corrado**; the Forge Monastery bears it.

- **Open to:** natives of the Bishopric of St. Severinius *(the Port has no separate place entry — Les to confirm)*.
- **Catalogue:** any Masterwork blade (Heavy Blades and Light Blades groups) — the named good is **Temper Quenched [weapon]**, at 20% off the standard Masterwork weapon price, with the Quality menu per [masterwork.md](masterwork.md).
- **[[add text]]** — the signature ration (Fancy Trail Ration template: 4 cp, 1 lb, 1 Temp HP until next full rest).

### Every region gets one (standing intent)

Every state/region of Avilund should eventually carry its own Regional Market — which means deciding what each place **specializes in** (production or trade access) and locking that into the lore. Tracked in the Scriptorium to-do (`design-notes-and-to-do-2026.md`).

**Every special market carries treats** — beyond the practical stock (implements, supplies, tradition goods), each offers some fun and enticing gear, so opening a door always feels like a reward. Catalogues to be fleshed out.

**Fancy trail rations (standard, settled Aug 15 2026):** a Regional Market's signature ration is always *Trail Ration (one day), 4 cp, 1 lb; consuming grants 1 Temp HP until your next full rest; one ration's benefit at a time.* The name and the filling are the region's; the numbers never move. First two: the Moorish Pasty (The Long Butts), Knights' Stew (Mantlethorn Castle Market).

### Visibility

Two tiers:

- **The Waldheim family is always listed** in the shop. An open market shows its catalog. A locked market shows **only its title and that you lack access**, with a note naming the Feat that opens it — a shopping list for your build, not your purse.
- **Everything else** — GM-granted custom Markets, the Black Faith Market — is invisible until access is granted, like Chronicle Entries.

## Every Market is two lists

1. **What it sells** — the catalog, with prices. Custom Markets carry **stock limits** the DM can adjust; the Waldheim Markets' stock is unlimited.
2. **What it buys** — a buy-list with rates, and a **purse**. The Waldheim Market's purse is bottomless; every Custom Market has a stated amount of money to spend (DM-set).

The Waldheim Market **buys anything it sells, at 25% of list value**, and will not touch anything outside its own catalog — no price for poison, stolen goods, scrolls, or the strange.

## Stock placement

Goods live where they belong (settled Aug 11 2026):

- **The religious stock sells at Imperial Square, not Sever's Cross**: all of Faith & Superstition, the Cleric's vestments, and the Friar's Kit. Supplies refill every kit, so both markets stock them. Imperial Square buys back its stock at the same 25%.
- **Black's Road sells the poisoner's tools** — Artisan's tools whose list there is *Poison alone* (a market may replace an item's choice list wholesale). No lawful shopfront offers it. The rest of the illicit catalogue is still to author.
- Keeping stock where it belongs sets up **per-market standing discounts** later: an adventure's reward may grant a character 10% off at a named Market (a Friar earning the favour of a religious house). Parked in the builder spec.

## Item choices at purchase

Some items carry a **purchase-time choice**, picked in the shop and named on the instance — different picks never stack:

- **Artisan's tools** name their **Craft** — the common roster (Apothecary, Armourer, Baker, Blacksmith, Bookbinder, Bowyer, Brewer, Butcher, Carpenter, Chandler, Cobbler, Cook, Cooper, Dyer, Fletcher, Furrier, Glassblower, Goldsmith, Gunsmith, Jeweller, Leatherworker, Locksmith, Mason, Potter, Printer, Ropemaker, Saddler, Shipwright, Tailor, Tanner, Vintner, Weaponsmith, Weaver, Wheelwright) plus a free-text **Other**. Craft is an open speciality Skill; the roster is the dropdown, not a cap.
- **Saint's medals** (tin and silver) name their **saint** — the catalogue is the dropdown; Other covers folk saints.
- **Supplies** name their **kit** (Healer's Kit, Friar's Kit, Herbalist's Bag, Offerings Bag) — bandages are not holy oils. Named supply stacks are ordinary inventory: spares live in a backpack or at Home beyond the kit's own 0–20 fill. (The kit's fill gauge, and refilling it from a spare stack, arrive with the sheet's Gear page.)
- The pick makes masterwork tools' +1 unambiguous, and reads on the sheet.

## Shopping — the Basket

One shopping view serves every moment (creation, downtime, In Play); only the reachable Markets and the purse differ.

- You fill a **Basket** — buys and sells together in one trip. Selling puts your item *in* the Basket; the running total shows the **net**.
- Committing the Basket is called **Finish**. One trip = **one logged transaction** (the items, the net sum, the Markets involved).
- **Identical items stack** — ten torches is one line with a quantity. Purchases arrive simply *carried*; organizing into containers is the gear page's job.
- **Kits are sold empty**; Supplies are their own purchase line.

## Coin

- Wealth is a **single value**, always displayed reduced to the fewest coins (*1 sp 1 cp*, never *11 cp*).
- **Coin is weightless** — no Encumbrance on wealth.
- Keep fractions in the math (Commerce and Market rates); round the final price to the nearest cp.

## Creation shopping

Shopping is the **last step of character creation**, after the Quirk & Starting Gear roll: spend your starting coin at the Markets you can access — the open Waldheim Markets, plus any door a Quirk or Feat just opened.

- The Basket stays open until the creation flow's own **Finish** — one act commits the Basket and completes the character. Until then, swap freely at full value.
- **No selling during creation.** The buy-side of every Market opens only once the character is finished.
- **Nothing sells until the character has at least one Session logged.** A New character cannot sell at all — this closes the buy-at-creation, sell-at-once arbitrage (e.g. Havilah Share Certificates), and it covers rolled Starting Gear along the way. After the first Session, normal rules apply — the Waldheim Market pays its 25%, so shedding Bad Gear costs dearly. (Player-facing: items simply show no sell price; no explanation.)

## Sellability lives on the item

Most items carry criteria for **who will buy them**. An item's sell price exists only when a Market the character can access buys it — and the character sheet's gear page shows the price with its source noted (*"3 sp — Black Market"*). No access, no price line.

## Feats

### Chaffer

| Rank | Effect | Cost |
|---|---|---|
| 1 | Purchase items for 10% less | m |
| 2 | …20% less | m |
| 3 | And sell items for 10% more | M *(assumed — Les to confirm)* |

*(Feat name locked Aug 14 2026: **Chaffer**. The id stays `commerce-ladder`.)* Standard Ladder pacing (≤1 Rank per Level). Percentages stack with Market rates.

### Market Access Feats

One Feat per locked market, named on its locked shopfront. **The magic markets' Feats gate on the tradition's tongue** ("Skills know, Languages read" — settled Aug 10 2026): knowing the Language is a prerequisite of the Feat, so access is never just a Minor's toll.

| Feat opens | Requires |
|---|---|
| Anselm's Buttery | Arcane Tongue |
| St. Ignatius College Archive | Elder Arcana Tongue |
| Theobald's Row | Black Tongue |
| Society of Astronomers | Eldritch Tongue |
| The Green Market | First Tongue |
| Black's Road Market | — (a criminal market has no tongue; the Feat alone) |

*(Feat names: [[add text]] each — working names are the market names.)*

## In Play — access vs. reach

Standing **access** (what you've been granted) and current **reach** (what's in front of you) are different things.

- **In Play** is a character state, toggled when the character is on an adventure. While In Play, the shopping view shows *only* the Markets the DM has authorized for that adventure — the Waldheim Markets included **only if the DM says so** (being far from home is the point).
- Out of play — downtime — the character reaches their full standing set: the open Waldheim Markets plus every standing access they've earned.
- The DM toggles which Markets are In Play per adventure; in v1 (and printed modules) an adventure carries a **Market code** the player enters, same as Chronicle Entry codes.
- A local Market's catalog can simply reference the standard price list with modifiers — *×2 list*, *×0.5 list*, *unavailable* — plus stock; no need to author full lists for every bywater.
- **Arbitrage nuggets** (the local bargain worth hauling home): since the Waldheim Market buys at 25% of list, the bargain must be priced *below a quarter of its list price* to profit. Markets being structured data, the builder validates this automatically for adventure authors.

## Still to author

- **Specialty catalogues** — what each locked market sells (implements, scrolls, components, the treats). The Imperial Square Market's open catalogue too.
- Purse replenishment for Custom Markets (does the fence's money come back? DM's call vs. a rule).
- Item sell-criteria tags across the equipment tables (what class of Market buys what).
