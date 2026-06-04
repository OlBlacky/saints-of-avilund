// The Ability cards, grouped by Category, for the Abilities reference page.
// Each Ability is described in the AbilityCard data model (see ./abilities.ts).
// These four Categories are the Soldier's: Martial (Class), Protection
// (Vanguard), Leadership (Commander), Marksmanship (Marksman).

import type { Ability, Variable } from './abilities';

export interface CategoryGroup {
  name: string;
  source: string;     // which Class/Path the category comes from
  blurb: string;
  abilities: Ability[];
}

// ── Shared building blocks ──────────────────────────────────────
const FREQ_FULL: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M' }] };
const FREQ_ENC: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }] };

// The standard weapon-damage ladder (+attribute, die size, double).
const weaponDamage = (attr: string): Variable => ({
  base: '1[W]',
  advances: [
    { value: `1[W] + ${attr}`, cost: 'm' },
    { value: 'weapon counts as one size larger (→ d12)', cost: 'm' },
    { value: `×2 → 2[W] + ${attr}`, cost: 'M' },
  ],
});

const MARTIAL_HOOKS =
  "Weapon Specialisation (with the Feat + that weapon): Heavy Blades → +2 damage · Light Blades → +1 to hit · " +
  "Hammers → Push 5' · Axes → Bleed 1 · Spears/Polearms → +5' reach · Flails/Chains → ignore the target's shield " +
  "bonus to AC · Staves → +1 to one of your defenses until your next turn · Bows/Crossbows → may be made as a " +
  "ranged attack (1×WRI).";

const RANGED_HOOKS =
  "Weapon Specialisation (with the Feat + that weapon): Bows → +1 to hit · Crossbows → ignore the DR of armour · " +
  "Slings → Push 5' · Thrown → +Str damage · Pistols → +2 damage within the first increment · Rifles → ignore " +
  "range penalty · Grenades → hits a 5' burst.";

// ── Martial (Class) ─────────────────────────────────────────────
const MARTIAL: Ability[] = [
  {
    name: 'Martial Strike', category: 'Martial', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: weaponDamage('Str'),
      duration: { base: 'Instant' },
    },
    feats: MARTIAL_HOOKS,
  },
  {
    name: 'Power Attack', category: 'Martial', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: {
        base: '1[W] + Str',
        advances: [
          { value: 'weapon one size larger, + Str', cost: 'm' },
          { value: 'weapon two sizes larger, + Str', cost: 'm' },
          { value: '2[W] + Str', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
    feats: 'Heavy Blade or Hammer Specialisation → +2 damage (Hammer also Push 5\').',
  },
  {
    name: 'Defensive Strike', category: 'Martial', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]', advances: [{ value: '1[W] + Str', cost: 'm' }] },
      effects: { base: 'On a hit, +1 to one of your defenses until your next turn.', advances: [{ value: '+2 to one of your defenses', cost: 'm' }] },
      duration: { base: 'Until your next turn' },
    },
    feats: 'Shield Specialisation → +1 additional defense; Staff → shove the attacker, or +defense vs them.',
  },
  {
    name: 'Parry', category: 'Martial', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Interrupt', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: 'Reduce the next incoming damage by 2.',
        advances: [
          { value: 'by 3', cost: 'm' },
          { value: 'by 4', cost: 'm' },
          { value: 'by 4, and make a Melee Basic Attack (riposte)', cost: 'M' },
        ],
      },
    },
    feats: 'Light Blade Specialisation → the riposte unlocks at Rank 3, and adds damage.',
  },
  {
    name: 'Disarming Strike', category: 'Martial', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs Armoured Dexterity' },
      damage: { base: '1[W]', advances: [{ value: '1[W] + Str', cost: 'm' }] },
      effects: {
        base: 'Target takes −1 to hit.',
        advances: [
          { value: '−2 to hit', cost: 'm' },
          { value: '−2, and the target must spend a Minor action to re-grip its weapon', cost: 'm' },
          { value: 'Disarmed — the weapon flies to an adjacent square', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    feats: 'Chain weapon → on a Disarm, you grab and keep the weapon.',
  },
  {
    name: 'Martial Focus', category: 'Martial', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: '+1 to your next attack roll.',
        advances: [
          { value: '+2 to your next attack roll', cost: 'm' },
          { value: '+2 to your next attack and damage roll', cost: 'm' },
          { value: '+2 to your next attack and 2[W] damage', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next attack' },
    },
  },
  {
    name: 'Raise Shield', category: 'Martial', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: 'Self' },
      effects: { base: 'While raised, apply your shield’s DR to incoming attack damage — DR you do not get passively. (Requires a shield equipped.)' },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Measure the Foe', category: 'Martial', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Encounter' },
      action: { base: 'Minor (in combat) / instant (out of combat)' },
      range: { base: '30\'', advances: [{ value: '60\'', cost: 'm' }] },
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }] },
      effects: {
        base: 'Learn the creature’s HP tier and its highest Offense or softest Defense.',
        advances: [{ value: 'Also learn all of its defenses', cost: 'm' }],
      },
    },
  },
];

// ── Protection (Vanguard) ───────────────────────────────────────
const PROTECTION: Ability[] = [
  {
    name: 'Shield Bash', category: 'Protection', role: 'Offensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }] },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: { base: 'Light / shield damage' },
      effects: {
        base: 'Daze: the target can take no Reactions or Interrupts.',
        advances: [
          { value: 'Daze also removes a Minor action', cost: 'm' },
          { value: 'Daze also removes a Move action', cost: 'm' },
          { value: 'Daze removes all actions (fully stunned)', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    feats: 'Light Shield Specialisation → Push 5\'; Heavy Shield Specialisation → Push 5\' or Prone.',
  },
  {
    name: 'Marking Strike', category: 'Protection', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: weaponDamage('Str'),
      effects: { base: 'Target is Marked (−1 to attack anyone but you).', advances: [{ value: 'Marked −2', cost: 'm' }] },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Sentinel Strike', category: 'Protection', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One (attack)' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: {
        base: 'On a hit, one ally gains +1 AC.',
        advances: [
          { value: 'you and one ally gain +1 AC', cost: 'm' },
          { value: 'you and one ally gain +2 AC', cost: 'm' },
          { value: 'you and all adjacent allies gain +2 AC', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
    feats: 'Light / Heavy Shield Specialisation → apply your Shield’s DR to everyone this protects.',
  },
  {
    name: 'Guard', category: 'Protection', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M', note: 'L5' }] },
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Interrupt', cost: 'M' }] },
      range: { base: 'Self / 1 adjacent ally' },
      targets: { base: 'Self / 1 adjacent ally' },
      effects: {
        base: '+1 to AC.',
        advances: [
          { value: '+1 to all Armoured Defences', cost: 'm' },
          { value: '+2 to all Armoured Defences', cost: 'm' },
          { value: '+2 to all Armoured Defences, extended to all adjacent allies', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
    feats: 'Light / Heavy Shield Specialisation → apply your Shield’s DR to the protected.',
  },
  {
    name: 'Intercept', category: 'Protection', role: 'Defensive · maneuver', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Reaction — when an adjacent ally is hit' },
      range: { base: 'Adjacent ally' },
      effects: {
        base: 'Trade places with the endangered ally, then take the damage in their stead.',
        advances: [
          { value: 'You take the damage, reduced by your Armour DR.', cost: 'm' },
          { value: 'Instead, the opponent must make the attack against you, resolved normally — they may miss your defenses entirely.', cost: 'm' },
          { value: 'As above, and you may intercept for an ally up to 10\' (2 squares) away.', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
    feats: 'Light / Heavy Shield Specialisation → apply your Shield’s DR.',
  },
  {
    name: 'Bulwark', category: 'Protection', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: 'Gain 2 temporary Hit Points.',
        advances: [
          { value: '3 temporary Hit Points', cost: 'm' },
          { value: '4 temporary Hit Points', cost: 'm' },
          { value: '5 temporary Hit Points and +1 DR for 1 round', cost: 'M' },
        ],
      },
    },
    feats: 'Medium Armour Specialisation → +2 temp HP; Heavy Armour Specialisation → +3 temp HP.',
  },
  {
    name: 'Stand Watch', category: 'Protection', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      effects: {
        base: 'You cannot be surprised on your watch (2 hours); +1 Perception.',
        advances: [
          { value: '4 hours; +1 Perception', cost: 'm' },
          { value: '6 hours; +1 Perception', cost: 'm' },
          { value: '8 hours; +2 Perception', cost: 'M' },
        ],
      },
    },
  },
];

// ── Leadership (Commander) ──────────────────────────────────────
const COMBINED_BUFF: Variable['advances'] = [
  { value: 'all allies +1 to hit and damage', cost: 'm' },
  { value: 'all allies +2 to hit, +1 damage', cost: 'm' },
  { value: 'all allies +2 to hit and damage', cost: 'M' },
];

const LEADERSHIP: Ability[] = [
  {
    name: 'Command', category: 'Leadership', role: 'Offensive · action-grant', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'One ally in range' },
      targets: { base: 'One ally' },
      effects: {
        base: 'An ally makes a basic attack for free.',
        advances: [
          { value: 'a free basic attack, +1 to hit', cost: 'm' },
          { value: 'a free basic attack, +2 to hit', cost: 'm' },
          { value: 'an ally may take any Standard action; if it is an attack, +2 to hit', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Commander’s Strike', category: 'Leadership', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One (struck); buffs all allies' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: { base: 'Until next round, all allies gain +1 to hit the struck target.', advances: COMBINED_BUFF },
      duration: { base: 'Until next round' },
    },
  },
  {
    name: 'Focus Fire', category: 'Leadership', role: 'Offensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'One enemy in range' },
      targets: { base: 'One enemy (no attack roll — just designate)' },
      effects: { base: 'Until next round, all allies gain +1 to hit the designated target.', advances: COMBINED_BUFF },
      duration: { base: 'Until next round' },
    },
  },
  {
    name: 'Resolute Strike', category: 'Leadership', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Melee or Ranged' },
      targets: { base: 'One (struck); allies within 10\'' },
      attack: { base: 'Weapon (Str / Dex) vs AC' },
      damage: { base: '1[W]' },
      effects: {
        base: 'On a hit, allies within 10\' gain +1 AC vs that opponent’s attacks of the type you used (melee or ranged).',
        advances: [
          { value: '+1 to all Defences vs that opponent', cost: 'm' },
          { value: '+1 to all Defences vs all opponents', cost: 'm' },
          { value: '+2 to all Defences vs all opponents', cost: 'M' },
        ],
      },
      duration: { base: '1 round' },
    },
    feats: 'Pistol Specialisation → +1 to hit the opponent for 1 round; Light Blade Specialisation → the target is Marked.',
  },
  {
    name: 'Rally', category: 'Leadership', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'Allies within 10\' (widens)' },
      effects: {
        base: 'Allies within 10\' gain +1 to all defenses until your next turn.',
        advances: [
          { value: 'within 20\'', cost: 'm' },
          { value: 'within 30\'', cost: 'm' },
          { value: 'within 30\', and gain 2 temporary Hit Points', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'War Cry', category: 'Leadership', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: 'Allies within 10\' (widens)' },
      effects: {
        base: 'Allies within 10\' gain +1 to hit on all attacks until your next turn.',
        advances: [
          { value: 'within 20\'', cost: 'm' },
          { value: 'within 30\'', cost: 'm' },
          { value: 'within 30\', and +2 damage', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Inspiring Word', category: 'Leadership', role: 'Rally / heal', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }] },
      range: { base: 'Up to 30\'' },
      targets: {
        base: '1 ally (≤30\')',
        advances: [
          { value: '2 allies (≤30\')', cost: 'm' },
          { value: '3 allies (≤30\')', cost: 'm' },
          { value: 'all allies within hearing range', cost: 'M' },
        ],
      },
      effects: {
        base: 'The ally may immediately attempt to shake a condition.',
        advances: [
          { value: 'shake a condition, with +1', cost: 'm' },
          { value: 'shake a condition, with +2', cost: 'm' },
          { value: 'shake a condition with +2, and gain 2 temporary Hit Points', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
];

// ── Marksmanship (Marksman) ─────────────────────────────────────
const WRI_RANGE: Variable = { base: '1×WRI', advances: [{ value: '2×WRI', cost: 'm' }, { value: '3×WRI', cost: 'm' }] };

const MARKSMANSHIP: Ability[] = [
  {
    name: 'Marksman’s Shot', category: 'Marksmanship', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: WRI_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC (−0 / −2 / −4 by band)' },
      damage: weaponDamage('Dex'),
      duration: { base: 'Instant' },
    },
    feats: RANGED_HOOKS,
  },
  {
    name: 'Pinning Shot', category: 'Marksmanship', role: 'Offensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: '1×WRI' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: 'W' },
      effects: {
        base: 'Movement: −5\' speed.',
        advances: [
          { value: '−10\' speed', cost: 'm' },
          { value: '−15\' speed', cost: 'm' },
          { value: 'Immobilized', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Skirmishing Shot', category: 'Marksmanship', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard' },
      range: { base: '1×WRI' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: 'W' },
      effects: {
        base: 'On a hit, shift 5\' and gain +1 to a defense until your next turn.',
        advances: [
          { value: 'shift 10\'; +1 to a defense', cost: 'm' },
          { value: 'shift 10\'; +2 to a defense', cost: 'm' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Covering Fire', category: 'Marksmanship', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Interrupt — when an enemy in range attacks an ally' },
      range: { base: 'Weapon range' },
      effects: {
        base: '−1 to that attack.',
        advances: [
          { value: '−2 to that attack', cost: 'm' },
          { value: '−2 to that attack and any other attacks from that target until the end of next round', cost: 'm' },
          { value: 'as above, and also make a ranged basic attack against the target', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Run and Gun', category: 'Marksmanship', role: 'Movement', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Movement only' },
      effects: {
        base: 'Move 5\' and make a basic ranged attack.',
        advances: [
          { value: 'Move 10\' and make a basic ranged attack', cost: 'm' },
          { value: 'Move 15\' and make a basic ranged attack', cost: 'm' },
          { value: 'Move 20\' and take a Standard Action', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Debilitating Shot', category: 'Marksmanship', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard' },
      range: { base: '1×WRI' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: 'W' },
      effects: {
        base: '−1 to a chosen defense.',
        advances: [
          { value: '−2', cost: 'm' },
          { value: '−2 and Vulnerable 1', cost: 'm' },
          { value: '−2 and Vulnerable 5', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Marksman’s Eye', category: 'Marksmanship', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      effects: {
        base: '+1 on Perception rolls to spot things up to 50\' away.',
        advances: [
          { value: 'up to 100\' away', cost: 'm' },
          { value: 'up to 200\' away', cost: 'm' },
          { value: '+2, and up to 1000\' away', cost: 'M' },
        ],
      },
    },
  },
];

export const CATEGORIES: CategoryGroup[] = [
  { name: 'Martial', source: 'Soldier — Class', blurb: 'The disciplined core of weapon-fighting: reliable strikes that grow with the weapon in your hands, plus the means to guard, disarm, focus, and read a fight.', abilities: MARTIAL },
  { name: 'Protection', source: 'Soldier — Vanguard', blurb: 'The defender’s toolkit: control strikes that pin and daze, shielding auras for your comrades, and the means to take a blow meant for someone else.', abilities: PROTECTION },
  { name: 'Leadership', source: 'Soldier — Commander', blurb: 'Command and rally: granting allies free attacks, calling focus-fire targets, bracing the line, and bolstering the whole company at once.', abilities: LEADERSHIP },
  { name: 'Marksmanship', source: 'Soldier — Marksman', blurb: 'Ranged mastery: the bread-and-butter shot that fits any ranged weapon, fire that pins and cripples, covering an ally, and shooting on the move.', abilities: MARKSMANSHIP },
];
