// Game-term glossary. On System pages, any bold (<strong>) term whose text
// matches one of these keys gets a hover/focus tooltip with its definition
// (see the decorator script in Base.astro). Matching is case-insensitive, and
// tolerates a leading quantity ("11 Major Advances") and simple plurals.

export const GLOSSARY: Record<string, string> = {
  'Advances': 'The universal currency of character growth, spent to improve a character. They come in two sizes — Major and Minor.',
  'Major Advances': 'The larger Advance — used mainly to raise Attributes and buy Abilities. You gain one per Milestone.',
  'Minor Advances': 'The smaller Advance — used for Offences, Defences, Hit Points, Skill Ranks, Proficiencies, Feats, and languages.',
  'Level 0': 'Where every character begins. Characters rise from Level 0 to a cap of Level 11.',
  'Level 11': 'The Level cap, reached after 33 Milestones.',
  'Hit Points': 'Your health. Everyone starts with 5, plus whatever you buy with Minor Advances at your Class HP rate.',
  'Class HP': 'How much Hit Points a single Minor Advance grants you (1, 2, or 3), set by your Class.',
  'Class Attribute': 'One of the two Attributes granted by your Class and Subclass — the only Attributes that can exceed +2 (reaching +3, then +4 at 5th Level and +5 at 10th).',
  'Ability Category': 'A pool of Abilities. You have two: one from your Class, one from your Subclass.',
  'Category': 'Short for Ability Category — a pool of Abilities. You have two: one from your Class, one from your Subclass.',
  'Class': 'Your character’s vocation — it sets a Class Attribute, an Ability Category, Class HP, Skills, and Proficiencies.',
  'Subclass': 'A specialization within your Class — it adds a second Class Attribute, a second Ability Category, more Class Skills, and more Proficiencies.',
  'Class Skills': 'The Skills your Class and Subclass train (the Path’s are listed as Additional Class Skills); you may raise these to +2, where other Skills cap at +1.',
  'Additional Class Skills': 'The two extra Class Skills your Subclass trains — they work exactly like your Class’s, raising to +2.',
  'Proficiencies': 'Training in a weapon or armour group; without it you take a penalty when you use it.',
  'Feats': 'Conditional edges bought with Minor Advances that sharpen your Abilities under specific circumstances.',
  'Offence': 'Your attack bonus with an Attribute — the Attribute’s value plus any Offence Ranks.',
  'Defence': 'A target number an attacker must beat: 10 + Attribute + Defence Ranks (plus armour, if Armoured).',
  'AC': 'Armour Class — your Armoured Constitution Defence, the number most physical attacks must beat.',
  'Armoured': 'A Defence that includes your armour’s bonus, as opposed to its Unarmoured version.',
  'Ability': 'An active power from one of your Ability Categories, improved dial by dial. Your first Ability from each Category is free; every further Ability costs 1 Major Advance.',
  'Keywords': 'The tags an Ability carries from its Category: the tradition’s knowledge Skill and the Language its texts are written in.',
  'Language Family': 'A group of kindred Dialects — Imperial, Republic, or Regnal. A speaker of one Dialect can make themselves understood in another of the same Family at −1 to social checks.',
  'Dialect': 'A regional tongue within a Language Family, named Family first — Imperial - Lysandrine, Republic - Waldisch, Regnal - Patric. Each Dialect is learned as its own language.',
  'Frequency': 'How often an Ability may be used — once per day, once per encounter, or at-will.',
  'Milestone': 'A step of advancement; three make a Level. Each Milestone grants +1 Major and +1 Minor Advance.',
  'Ladder': 'A short track of escalating effect. Rank 1 is the base; the middle Ranks cost a Minor Advance each, and the top Rank costs a Major. Abilities, Conditions, Frequency, and more are all built as Ladders.',
  'Rank': 'A single step on a Ladder. You climb from Rank 1 (the base) upward, paying Advances as you go.',
  'Off Guard': 'A target is Off Guard against you when it cannot see you, has not yet acted in the encounter, is Prone, Stunned or Immobilized, or an Ability (a Feint) has left it so. On its own it does nothing — it is the key that unlocks the Abilities written to use it.',
  'Surprised': 'A creature caught unawares when a fight begins. Until its first turn it can take no actions — Reactions and Interrupts included. Attacks against it gain +1 to hit, and it is Off Guard against everyone.',
  'flanked': 'A creature is flanked when you and an ally are both adjacent to it, on opposite sides. Abilities that trigger on an Off Guard target trigger equally on a flanked one.',
  'flanking': 'You flank an enemy when you and an ally are both adjacent to it and stand on opposite sides. It needs no roll — either the geometry holds or it does not.',
  'Studied': 'A mark the Assassin has observed with Study the Mark. It stays Studied until the end of the encounter, adding Study the Mark’s bonus damage (+1, rising to +Int, then +2 × Int) to your Sneak Attack, Death Blow, and Anatomist’s Cut against it.',
  'Difficulty Class': 'A creature’s DC — the target number to beat when an Ability tests itself against the creature as a whole rather than one Defence. For a character it is 10 + Level; a monster states its own DC in its listing.',
  'DC': 'Difficulty Class — the target number to beat when an Ability tests itself against a creature as a whole rather than one Defence. A character’s DC is 10 + Level; a monster states its own.',
  'Reroll': 'Roll the die again and keep the better of the two results. Every Reroll in the game works this way — you never keep the worse roll.',
  'Take 10': 'Instead of rolling the d20, count the die as a 10 and add your bonuses as usual. Any Take N works the same way with that number.',
};

// Inline abbreviations — decorated wherever they appear in body text (not only
// when bold), on System pages. Kept small and specific to avoid false matches.
export const INLINE_TERMS: Record<string, string> = {
  'WRI': 'Weapon Range Increment — a ranged weapon’s base distance (e.g. 20′ for a thrown dagger, 60′ for a shortbow). You can fire out to three increments, at 0 / −2 / −4 to hit; Range Advances make each increment larger.',
  // Plural before singular: the decorator's regex alternation tries keys in
  // order, and 'Reroll' alone would leave the trailing 's' undecorated.
  'Rerolls': 'Roll the die again and keep the better of the two results. Every Reroll in the game works this way — you never keep the worse roll.',
  'Reroll': 'Roll the die again and keep the better of the two results. Every Reroll in the game works this way — you never keep the worse roll.',
};
