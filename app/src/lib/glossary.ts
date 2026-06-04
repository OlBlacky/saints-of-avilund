// Game-term glossary. On System pages, any bold (<strong>) term whose text
// matches one of these keys gets a hover/focus tooltip with its definition
// (see the decorator script in Base.astro). Matching is case-insensitive, and
// tolerates a leading quantity ("11 Major Advances") and simple plurals.

export const GLOSSARY: Record<string, string> = {
  'Advances': 'The universal currency of character growth, spent to improve a character. They come in two sizes — Major and Minor.',
  'Major Advances': 'The larger Advance — used mainly to raise attributes and buy Abilities. You gain one per milestone.',
  'Minor Advances': 'The smaller Advance — used for offenses, defenses, Hit Points, skill ranks, proficiencies, Feats, and languages.',
  'Level 0': 'Where every character begins. Characters rise from Level 0 to a cap of Level 11.',
  'Level 11': 'The level cap, reached after 33 milestones.',
  'Hit Points': 'Your health. Everyone starts with 5, plus whatever you buy with Minor Advances at your Class HP rate.',
  'Class HP': 'How much Hit Points a single Minor Advance grants you (1, 2, or 3), set by your Class.',
  'Class Attribute': 'One of the two attributes granted by your Class and Path — the only attributes that can exceed +2 (reaching +3, then +4 at 5th level and +5 at 10th).',
  'Ability Category': 'A pool of Abilities. You have two: one from your Class, one from your Path.',
  'Category': 'Short for Ability Category — a pool of Abilities. You have two: one from your Class, one from your Path.',
  'Class': 'Your character’s vocation — it sets a Class Attribute, an Ability Category, Class HP, skills, and proficiencies.',
  'Path': 'A specialisation within your Class — it adds a second Class Attribute, a second Ability Category, more Class Skills, and more proficiencies.',
  'Class Skills': 'The skills your Class and Path train (the Path’s are listed as Additional Class Skills); you may raise these to +2, where other skills cap at +1.',
  'Additional Class Skills': 'The two extra Class Skills your Path trains — they work exactly like your Class’s, raising to +2.',
  'proficiencies': 'Training in a weapon or armour group; without it you take a penalty when you use it.',
  'Feats': 'Conditional perks bought with Minor Advances that sharpen your abilities under specific circumstances.',
  'Offense': 'Your attack bonus with an attribute — the attribute’s value plus any offense ranks.',
  'Defense': 'A target number an attacker must beat: 10 + attribute + defense ranks (plus armour, if Armoured).',
  'AC': 'Armour Class — your Armoured Constitution Defense, the number most physical attacks must beat.',
  'Armoured': 'A defense that includes your armour’s bonus, as opposed to its Unarmoured version.',
  'Ability': 'An active power, bought for 1 Major Advance from one of your Ability Categories and improved dial by dial.',
  'Frequency': 'How often an Ability may be used — once per day, once per encounter, or at-will.',
  'milestone': 'A step of advancement; three make a level. Each milestone grants +1 Major and +1 Minor Advance.',
};
