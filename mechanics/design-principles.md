# Design Principles — The Rails

Read this before authoring any new mechanic, Ability, Feat, or Quirk. When a new piece of content conflicts with a rail, the rail wins; if the rail itself is wrong, change the rail here first, then the content.

---

## 1. Small numbers, always

- Keep every number as low as it can be: dice, modifiers, damage, HP.
- Power comes from **persistence and stacking small sources** (Temp HP + DR from several places), never from bigger dice or doubled damage.
- Ongoing damage is the smallest ladder of all: the tick caps at **3**. Spend advances on persistence (duration, save penalty), not a bigger number.

## 2. The +5 ceiling

- **+5 is about the best total modifier a first-level character can reach** on anything, without in-encounter buffs.
- Attribute caps enforce this: Class Attributes reach +3 (then +4 at level 5, +5 at level 10); all other attributes cap at +2.
- Class Skills raise to +2; other skills cap at +1. Masterwork's +1 deliberately stacks past these caps — that's the exception, and it's paid for.
- Any new bonus source must justify itself against this ceiling. Unconditional flat bonuses are the enemy; conditional ones (the Feat "specialist economy") are the pattern.

## 3. Major doubles, Minor adds a fraction

- The one pricing principle behind every ladder: a **Major Advance doubles** the value; a **Minor Advance adds a fraction** of it.
- Where growth is disproportionately strong (area radius), every step is a Major.

## 4. Reuse before inventing

- **Ladders:** a new Ability reaches for a standard ladder first. Authoring a new ladder requires a stated reason the existing ones can't serve — similar-but-different ladders are how systems rot.
- **Cards:** if another Ability Category already has a fitting card, reuse it verbatim (shared const), as Chaplain reuses the Soldier's Arms. Don't author near-duplicates.
- **Vocabulary:** Feats, Quirks, and Abilities share one effect vocabulary. New effect types need the same justification as new ladders.

## 5. The standard ladders

Live in `app/src/lib/category-abilities.ts` as shared consts — import them, don't retype them.

- **Standard Range** (`STD_RANGE`): 30' / 45' (m) / 60' (m) / 120' (M)
- **Standard Area** (`STD_AREA`): burst radius 5' / 10' (M) / 15' (M) / 20' (M) — every step a Major
- **Standard Ongoing Damage** (`ongoingDamage()` + `ongoingDuration()`): tick caps at 3; Major buys −2 to the save; duration is mercy-capped save-ends scaling with the Category/Path attribute
- **Sensory / Light & Darkness ladder**: 7 rungs, bands of reach (mundane ±1, magic ±2, world ±3)

(When a new ladder earns its place, add it to this list.)

## 6. Pacing caps

- Any one ability Ladder climbs **≤1 Rank per level**.
- Class HP is bought **once per level** (refreshes at the next level's first milestone).
- Abilities cost 1 Major each; Feats cost 1 Minor each; everyone is on the same triangular 1/3/6/10/15 advance curve.
- These caps do the pacing work — 4-Rank ladders self-pace and rarely need a Level gate.

## 7. Benchmarks

Every new Ability gets eyeballed against a reference card of the same shape before it ships:

- **Attack ability:** the Marksman's shot (Marksmanship)
- **Ongoing-damage ability:** Hex (Witchcraft) / Surgeon's Strike (Medicine)
- **Heal:** the Friar's Mercy heals — deliberately underpowered; nothing heals better for less
- Same dial, same price, same power. If the new card is clearly better at the same cost, it's wrong.

## 8. Structured data is the source of truth

- Mechanics live as **data in the site's TS files** (abilities, skills, quirks); prose explains, data defines.
- This is what makes the future character builder cheap: the builder walks the same data, and legality checks fall out of the caps above.
- A rule that can't be expressed in the data model is a smell — reshape the rule or the model, don't bolt on prose exceptions.

## 9. One language, capitalized

- **Capitalize every game concept and title**: Ability, Save, Major Advance, Minor Advance, Class, Path, Feat, Quirk, Rank, Ladder, Condition, Wounded, DC. If it's a defined game term, it wears a capital; if it doesn't deserve a capital, it isn't a term.
- **One name per concept, one concept per name.** Pick the canonical term and use it everywhere — e.g. **Mastery** is the damage-type feat family ("Mastery — Fire"); **Specialization** is the implement/weapon/armour family. Never blur them.
- Established canonical terms: Class Attribute (not Primary/Key Attribute), Ability Category (not bare "Category"), Class Skills / Additional Class Skills, Feats (not "Perks").
- Canadian spelling: -ize/-ization with a z (Specialization), but keep -our/-re/-ce (armour, defence).
- On renaming a term, sweep every occurrence — mechanics, rulebook, site data — in the same pass. A half-renamed term is worse than a bad name.

---

## Before-you-author checklist

1. Does an existing card cover this? Reuse it.
2. Does a standard ladder fit? Import it.
3. Is every number as small as it can be?
4. Does it beat its benchmark at the same price? Then cut it down.
5. Does any bonus break the +5 ceiling unconditionally? Make it conditional or remove it.
6. Can the data model express it? If not, stop and rethink.
