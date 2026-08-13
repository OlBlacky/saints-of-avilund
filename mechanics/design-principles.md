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
- Sanctioned exceptions: Masterwork's +1 (paid for in coin), and the transformative **Vows** (Vow of Abstinence, Renunciation) — the vow itself is the price. Exceptions are named here or they aren't exceptions.

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
- **Standard Thrown Range** (`STD_THROWN`): 10' / 20' (m) / 30' (m) / 60' (M) — for hurled things (flasks, fume-pots, stones)
- **Standard Camp Targets** (`campTargets(attr)`): 1 patient / [attr] patients (m) / [attr] + 1 patients (m) / All in his company (M) — for camp-scale ministrations (rest-time heals and tendings)
- **Standard Area** (`STD_AREA`): burst radius 5' / 10' (M) / 15' (M) / 20' (M) — every step a Major
- **Standard Ongoing Damage** (`ongoingDamage()` + `ongoingDuration()`): tick caps at 3; Major buys −2 to the save; duration is mercy-capped save-ends scaling with the Category/Subclass attribute
- **Strike Damage** (`STRIKE_DAMAGE`, and `SHIELD_DAMAGE` for a bash): 1[W] / 1[W] + 1 (m) / 1[W] + Str (m) / 2[W] (M, L5) — the shield form climbs the shield's die, 1[S]
- **Daze Ladder** (`DAZE_EFFECTS`): Dazed (no Reactions or Interrupts) → + no Minor (m) → + no Move (m) → Stunned (M) — shared by Rebuke, New Magic's Lightning & Sonic effects, and the Stupor Malediction
- **Fear Ladder** (`FEAR_EFFECTS`): −1 to its attacks → + can't close (m) → + can't attack you (m) → flees until it Saves (M) — shared by Fly the Wicked and the Dread Malediction
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

- **Capitalize every game concept and title**: Ability, Save, Major Advance, Minor Advance, Class, Subclass, Feat, Quirk, Rank, Ladder, Condition, Wounded, DC. If it's a defined game term, it wears a capital; if it doesn't deserve a capital, it isn't a term.
- **One name per concept, one concept per name.** Pick the canonical term and use it everywhere. When two near-synonyms compete, collapse them — e.g. **Specialization** is the one specialist-Feat term, covering weapons, armour, implements, damage types ("Specialization — Fire"), and Maledictions alike ("Mastery" is retired).
- Established canonical terms: Class Attribute (not Primary/Key Attribute), Ability Category (not bare "Category"), Class Skills / Additional Class Skills, Feats (not "Perks"), **Subclass** (not "Path" — renamed Aug 2026; fix stragglers on contact).
- Canadian spelling: -ize/-ization with a z (Specialization), but keep -our/-re/-ce (armour, defence).
- On renaming a term, sweep every occurrence — mechanics, rulebook, site data — in the same pass. A half-renamed term is worse than a bad name.

## 10. Skills know, Languages read

Every magic tradition has one knowledge Skill and one Language, and they never overlap:

- **The Skill knows the tradition** — lore, identification, recognizing its work. A Skill never requires a Language.
- **The Language reads the tradition** — its scrolls, spellbooks, rituals, and inscriptions. A Language is never granted by a Skill.
- **Deep specialist Feats require both** — the Malediction Specializations set the pattern (Language (Black Tongue) + Religion (Black Faith), a Minor each).

A casting Class or Subclass grants its own tradition's Language free; reaching into another tradition's texts costs the Minors. Literacy Abilities (Read Scrolls, Read Spellbooks, Conduct Ritual) gate per item: you must know the language the text is written in.

**Keywords carry the tie.** Each casting Category declares its tradition once (`lib/traditions.ts`: Skill + Language), and every card in it inherits those two **Keywords** at render — Keywords are never authored on a card by hand. A reused card takes the Keywords of its hosting Category, so the same card wears different Keywords on different sheets. Found objects (spellbooks, scrolls) will carry Language Keywords of their own; the reading gate is the match between the object's Keyword and the languages you know.

## 11. Every Rank stands alone

- Every value on a Ladder — the base and every Rank — is a **complete, self-contained statement** of what the character has at that step. The test: read it on a character sheet as "Label: value", with no other row in sight, and it must make sense.
- No deltas and no references to other rows: no "as above", no leading "+ …" additions, no bare "+2" without the thing it modifies, no "10' radius" without who it catches.
- The build table repeats itself as a result. That is the point — terse rows that lean on the row above are how character sheets end up showing fragments.
- Enforced by lint: `app/src/lib/card-text.test.ts` flags offender patterns and holds a baseline of known offenders that only shrinks. New cards must pass clean.

---

## Before-you-author checklist

1. Does an existing card cover this? Reuse it.
2. Does a standard ladder fit? Import it.
3. Is every number as small as it can be?
4. Does it beat its benchmark at the same price? Then cut it down.
5. Does any bonus break the +5 ceiling unconditionally? Make it conditional or remove it.
6. Can the data model express it? If not, stop and rethink.
7. Does every Rank value read as a complete statement on its own? (Rail 11)
