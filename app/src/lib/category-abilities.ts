// The Ability cards, grouped by Category, for the Abilities reference page.
// Each Ability is described in the AbilityCard data model (see ./abilities.ts).
// These four Categories are the Soldier's: Arms (Class), Protection
// (Vanguard), Leadership (Commander), Marksmanship (Marksman).

import type { Ability, Variable, NamedLadder } from './abilities';

export interface CategoryGroup {
  name: string;
  source: string;     // which Class/Path the category comes from
  blurb: string;
  abilities: Ability[];
}

// ── Shared building blocks ──────────────────────────────────────
const FREQ_FULL: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M' }] };
const FREQ_ENC: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }] };

// The "power" damage ladder shared by Power Attack and Marksman's Shot:
// +attribute baked into the base, two die-size steps, then double.
const powerDamage = (attr: string): Variable => ({
  base: `1[W] + ${attr}`,
  advances: [
    { value: `weapon one size larger, + ${attr}`, cost: 'm' },
    { value: `weapon two sizes larger, + ${attr}`, cost: 'm' },
    { value: `2[W] + ${attr}`, cost: 'M' },
  ],
});

// The Strike damage ladder shared by Martial Strike and Marking Strike.
const STRIKE_DAMAGE: Variable = {
  base: '1[W]',
  advances: [
    { value: '1[W] + 1', cost: 'm' },
    { value: '1[W] + Str', cost: 'm' },
    { value: '2[W]', cost: 'M', note: 'L5' },
  ],
};

// Specialization-hook helpers. Hooks are shown in a labelled card section
// (Weapon / Armour / Implement Specialization Hooks); the note states the gate.
const WEAPON_HOOK_NOTE = 'With the Weapon Specialization Feat for the weapon you wield:';
const ARMOUR_HOOK_NOTE = 'With the matching Armour (or Shield) Specialization Feat:';

const MARTIAL_HOOKS: string[] = [
  'Heavy Blades → +2 damage',
  'Light Blades → +1 to hit',
  "Hammers → Push 5'",
  'Axes → Bleed 1',
  "Spears / Polearms → +5' reach",
  "Flails / Chains → ignore the target's shield bonus to AC",
  'Staves → +1 to one of your defenses until your next turn',
  'Bows / Crossbows → may be made as a ranged attack (1×WRI)',
];

const RANGED_HOOKS: string[] = [
  'Bows → +1 to hit',
  'Crossbows → ignore the DR of armour',
  "Slings → Push 5'",
  'Thrown → +Str damage',
  'Pistols → +2 damage within the first increment',
  'Rifles → ignore range penalty',
  "Grenades → hits a 5' burst",
];

// Generic Advances — the engine on the literacy/artefact abilities. You buy
// Advances (each raises a variable of the tied item's Ability one Rank) and
// apply them when you use the item. The matching specialist grants a 2nd set.
const GENERIC_ADV: NamedLadder = {
  name: 'Generic Advances',
  base: '—',
  advances: [
    { value: '1 Advance', cost: 'm' },
    { value: '2 Advances', cost: 'm' },
    { value: '3 Advances', cost: 'M' },
  ],
};
const GA_NOTE = (item: string): string =>
  `Unlike most Abilities, this Ability is closely tied to a particular ${item}, which has its own Ability defined. ` +
  `While most characters can use only that Ability's baseline variables, this Ability lets you select its Advancements: ` +
  `purchase Generic Advances per the Ladder below (each Advance raises one variable a Rank), then apply them to any variable the ${item} allows.`;
const GA_MASTERY = (item: string, feat: string): string =>
  `Additionally, with the ${feat} Feat you gain a second Generic Advances Ladder — apply it to a second variable the ${item} allows.`;

// The crafting track on Read Scrolls / Read Spellbooks: Scribe copies from a
// source you hold; Create makes one from scratch. Four Major, level-gated steps.
const SCRIBE_CREATE: NamedLadder = {
  name: 'Scribe / Create',
  base: 'None',
  advances: [
    { value: 'Scribe Lesser', cost: 'M', note: 'L3' },
    { value: 'Create Lesser', cost: 'M', note: 'L5' },
    { value: 'Scribe Greater', cost: 'M', note: 'L7' },
    { value: 'Create Greater', cost: 'M', note: 'L9' },
  ],
};

// ── Arms (Class) ────────────────────────────────────────────────
const ARMS: Ability[] = [
  {
    name: 'Martial Strike', category: 'Arms', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: STRIKE_DAMAGE,
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: MARTIAL_HOOKS }],
  },
  {
    name: 'Power Attack', category: 'Arms', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: powerDamage('Str'),
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Heavy Blades → +2 damage', "Hammers → +2 damage and Push 5'"] }],
  },
  {
    name: 'Defensive Strike', category: 'Arms', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: { base: 'On a hit, +1 to one of your defenses until your next turn.', advances: [{ value: '+2 to one of your defenses', cost: 'm' }] },
      duration: { base: 'Until your next turn' },
    },
    options: [
      { label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Shields → +1 additional defense'] },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Staves → shove the attacker, or +1 defense against them'] },
    ],
  },
  {
    name: 'Parry', category: 'Arms', role: 'Defensive', mode: 'Effect',
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
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → the riposte unlocks at Rank 3, and adds damage'] }],
  },
  {
    name: 'Disarming Strike', category: 'Arms', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs Armoured Dexterity' },
      damage: { base: '1[W]' },
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
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Flails / Chains → on a Disarm, you grab and keep the weapon'] }],
  },
  {
    name: 'Martial Focus', category: 'Arms', role: 'Buff', mode: 'Effect',
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
    name: 'Raise Shield', category: 'Arms', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: 'Self' },
      effects: { base: 'While raised, apply your shield’s DR to incoming attack damage — DR you do not get passively. (Requires a shield equipped.)' },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Measure the Foe', category: 'Arms', role: 'Utility', mode: 'Effect',
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
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ["Light Shields → Push 5'", "Heavy Shields → Push 5' or Prone"] }],
  },
  {
    name: 'Marking Strike', category: 'Protection', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: STRIKE_DAMAGE,
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
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Light / Heavy Shields → apply your Shield’s DR to everyone this protects'] }],
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
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Light / Heavy Shields → apply your Shield’s DR to the protected'] }],
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
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Light / Heavy Shields → apply your Shield’s DR'] }],
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
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Medium Armour → +2 temp HP', 'Heavy Armour → +3 temp HP'] }],
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
const LEADERSHIP: Ability[] = [
  {
    name: 'Command', category: 'Leadership', role: 'Offensive · action-grant', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M', note: 'L5' }] },
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'One ally in range' },
      targets: { base: 'One ally' },
      effects: {
        base: 'An ally makes a basic attack for free.',
        advances: [
          { value: 'a free basic attack, +1 to hit', cost: 'm' },
          { value: 'a free basic attack, +2 to hit', cost: 'm' },
          { value: 'an ally may take any Standard action; if it is an attack, +2 to hit', cost: 'M', note: 'L3' },
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
      effects: {
        base: 'Until next round, all allies gain +1 to hit the struck target.',
        advances: [
          { value: 'all allies +1 to hit and damage', cost: 'm' },
          { value: 'all allies +2 to hit and damage', cost: 'm' },
          { value: 'all allies +2 to hit and damage, and one adjacent ally may make a Melee Basic Attack against the opponent', cost: 'M' },
        ],
      },
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
      effects: {
        base: 'Until next round, all allies gain +1 to hit the designated target.',
        advances: [
          { value: 'all allies +1 to hit and damage', cost: 'm' },
          { value: 'all allies +2 to hit and damage', cost: 'm' },
          { value: 'all allies +2 to hit and damage, and one ally may make a Ranged Basic Attack against the opponent', cost: 'M' },
        ],
      },
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
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Pistols → +1 to hit the opponent for 1 round', 'Light Blades → the target is Marked'] }],
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
          { value: 'within 30\', and gain 2 temporary Hit Points', cost: 'M', note: 'L5' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'War Cry', category: 'Leadership', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M', note: 'L5' }] },
      range: { base: 'Allies within 10\' (widens)' },
      effects: {
        base: 'Allies within 10\' gain +1 to hit on all attacks until your next turn.',
        advances: [
          { value: 'within 20\'', cost: 'm' },
          { value: 'within 30\'', cost: 'm' },
          { value: 'within 30\', and +2 damage', cost: 'M', note: 'L3' },
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
      damage: powerDamage('Dex'),
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: RANGED_HOOKS }],
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
      duration: { base: 'Save ends (Con Save vs the attacker’s Dex Offense)' },
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
      action: { base: 'Standard only' },
      effects: {
        base: 'Shift 5\'.',
        advances: [
          { value: 'Shift 5\' and +1 to a chosen defense until the end of your turn', cost: 'm' },
          { value: 'Shift 5\' and +2 to a chosen defense until the end of your turn', cost: 'm' },
          { value: 'Shift 10\' and +2 to all defenses until the end of your turn', cost: 'M' },
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
      attack: {
        base: 'Dexterity vs AC',
        advances: [
          { value: 'Dexterity vs AC or Armoured Str', cost: 'm' },
          { value: 'Dexterity vs AC, Armoured Str, or Armoured Dex', cost: 'm' },
          { value: 'Dexterity vs Unarmoured AC, Str, or Dex', cost: 'M' },
        ],
      },
      damage: { base: 'W' },
      effects: {
        base: '−1 to a chosen defense.',
        advances: [
          { value: '−2', cost: 'm' },
          { value: '−2 and Vulnerable 1', cost: 'm' },
          { value: '−2 and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends (Con Save vs the attacker’s Dex Offense)' },
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

// ── Mercy (Friar — Class) ───────────────────────────────────────
// The Friar's healer kit: no attacks at all. Healing is deliberately
// underpowered; most cards do their work through the Effect(s) row.
const FREQ_FRIAR: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'Twice per encounter', cost: 'M' }] };
const ACTION_SMM: Variable = { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] };

const MERCY: Ability[] = [
  {
    name: 'Mending Touch', category: 'Mercy', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Heal Wis HP.',
        advances: [
          { value: 'Heal Wis + 1', cost: 'm' },
          { value: 'Heal Wis + 2', cost: 'm' },
          { value: 'Heal Wis + 1d6, and the target may make one saving throw of their choice against any condition affecting them', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Stabilise', category: 'Mercy', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Reduce the damage from one ongoing-damage condition (Bleed, Poison, etc.) by 1. A touch also stabilises a dying creature — it stops dying. (Bodily conditions only.)',
        advances: [
          { value: 'Reduce by 2', cost: 'm' },
          { value: 'Reduce by 3', cost: 'm' },
          { value: 'End the condition completely', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Blessing', category: 'Mercy', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies', cost: 'm' },
          { value: 'Two allies within 10\'', cost: 'm' },
          { value: 'All allies within 10\'', cost: 'M' },
        ],
      },
      effects: {
        base: '+1 to all saving throws.',
        advances: [
          { value: '+2 to all saving throws', cost: 'm' },
          { value: '+2, and may attempt a save now', cost: 'm' },
          { value: '+2, may attempt a save now, and if it succeeds, immunity to that effect for the encounter', cost: 'M' },
        ],
      },
      duration: {
        base: 'Wis rounds',
        advances: [
          { value: 'Wis + 1 rounds', cost: 'm' },
          { value: 'Wis + 2 rounds', cost: 'm' },
          { value: 'Encounter', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Prayer for the Saintly', category: 'Mercy', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'Ritual, during a rest' },
      range: { base: 'Those present at the prayer' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies', cost: 'm' },
          { value: 'All allies', cost: 'm' },
          { value: 'You and all allies', cost: 'M' },
        ],
      },
      effects: {
        base: 'Grant 1 reroll, shared by the blessed — keep the better result, on any d20 roll.',
        advances: [
          { value: '2 rerolls, shared', cost: 'm' },
          { value: '3 rerolls, shared', cost: 'm' },
          { value: 'Each blessed ally gets their own reroll', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next rest' },
    },
  },
  {
    name: 'Preach to the Saintly', category: 'Mercy', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'A few minutes of preaching (Standard in a tense scene)' },
      range: { base: 'Those within earshot' },
      targets: {
        base: '5 NPCs',
        advances: [
          { value: '10 NPCs', cost: 'm' },
          { value: 'The crowd in earshot', cost: 'm' },
          { value: 'Those the crowd then talks to (spreads through town)', cost: 'M' },
        ],
      },
      effects: {
        base: 'Make a Religion (Saintly Faith) check, DC 10 (a friendly Saintly gathering) up to 20 (strangers in a strange land). On a success, NPC Attitude improves one step and/or hireling Morale improves one step. Never works on Hostile NPCs.',
        advances: [
          { value: 'Improve by two steps instead', cost: 'M' },
        ],
      },
      duration: { base: 'The scene' },
    },
  },
  {
    name: 'Tend the Wounded', category: 'Mercy', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'Ministration, during a rest' },
      range: { base: 'Those resting in camp' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies', cost: 'm' },
          { value: 'Three allies', cost: 'm' },
          { value: 'All who rest in camp', cost: 'M' },
        ],
      },
      effects: {
        base: 'Tended allies recover an extra Wis HP on the rest, and may make one save against a bodily affliction (+0). Bodily afflictions only.',
        advances: [
          { value: 'Wis + 1 HP; the save is at +1', cost: 'm' },
          { value: 'Wis + 2 HP; the save is at +2', cost: 'm' },
          { value: 'Wis + 1d6 HP; a save against each bodily affliction, at +2', cost: 'M' },
        ],
      },
      duration: { base: 'The rest' },
    },
  },
];

// ── Forbearance (Friar — Mendicant) ─────────────────────────────
// The pacifist martyr: binding Vows, Temp HP wrung from his own pain,
// and the endurance to keep standing. No attacks. Vows are passive and
// break only under compulsion — lost until the Mendicant Atones.
const FORBEARANCE: Ability[] = [
  {
    name: 'Vow of Mercy', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: { base: 'Passive (always on)' },
      effects: {
        base: 'Any ability you use that heals or grants Temp HP to allies is +1. The Vow: you may never willingly bear arms, make an attack roll, harm an ally, or allow an ally to come to harm if you can prevent it.',
        advances: [{ value: '+2', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Vow of Poverty', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: { base: 'Passive (always on)' },
      effects: {
        base: '+1 to all Armoured and Unarmoured Defences. The Vow: you may not accumulate personal wealth — nothing beyond the clothes on your back and the instruments of healing and your Saintly office.',
        advances: [{ value: '+2', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Vow of Abstinence', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: { base: 'Passive (always on)' },
      effects: {
        base: '+1 to all saving throws. The Vow: you may never imbibe alcohol, tobacco, or similar substances, nor drink potions or willingly receive any healing or magical benefit that is not from a Saintly source.',
        advances: [{ value: '+2', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Flesh of the Martyr', category: 'Forbearance', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: { base: 'Reaction — when you take at least 1 damage (to Temp HP or normal HP)' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies within 10\'', cost: 'm' },
          { value: 'Two allies within 20\'', cost: 'm' },
          { value: 'All allies visible', cost: 'M' },
        ],
      },
      effects: {
        base: 'Grant Con Temp HP.',
        advances: [
          { value: 'Con + 1', cost: 'm' },
          { value: 'Con + 2', cost: 'm' },
          { value: 'Con + 2, and heal 1 HP', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Nimbus of the Martyr', category: 'Forbearance', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: {
        base: '5\'',
        advances: [
          { value: '10\'', cost: 'm' },
          { value: '15\'', cost: 'm' },
          { value: '30\'', cost: 'M' },
        ],
      },
      targets: { base: 'Self + all allies within range' },
      effects: {
        base: 'Grant Con Temp HP.',
        advances: [
          { value: 'Con + 1', cost: 'm' },
          { value: 'Con + 2', cost: 'm' },
          { value: 'Con + 2, and heal 1 HP', cost: 'M' },
        ],
      },
      duration: {
        base: 'Temp HP vanish at the end of the encounter',
        advances: [{ value: 'Temp HP last until a long rest', cost: 'M', note: 'L3' }],
      },
    },
  },
  {
    name: 'Endurance of the Saintly', category: 'Forbearance', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M', note: 'L5' }] },
      action: ACTION_SMM,
      targets: { base: 'Self' },
      effects: {
        base: 'While active, you cannot be reduced below 1 HP.',
        advances: [
          { value: 'Also reduce all ongoing-damage you take by 1', cost: 'm' },
          { value: 'Reduce ongoing-damage by 2', cost: 'm' },
          { value: 'Also shrug off (end) one condition on you each round', cost: 'M' },
        ],
      },
      duration: {
        base: 'Con rounds',
        advances: [
          { value: 'Con + 1 rounds', cost: 'm' },
          { value: 'Con + 2 rounds', cost: 'm' },
          { value: 'Encounter', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Pilgrim\'s Endurance', category: 'Forbearance', role: 'Utility', mode: 'Passive',
    vars: {
      frequency: { base: 'Passive (always on)' },
      targets: {
        base: 'Self',
        advances: [
          { value: 'Self + Wis allies', cost: 'm' },
          { value: 'All companions travelling with you', cost: 'm' },
          { value: 'All companions, and a safe night\'s rest in hostile country', cost: 'M' },
        ],
      },
      effects: {
        base: 'Ignore the ill effects of hunger, thirst, and exposure to weather.',
        advances: [
          { value: 'Also ignore fatigue from forced marches', cost: 'm' },
          { value: 'Need only half the normal provisions and rest', cost: 'm' },
          { value: 'The company may push a longer day\'s travel with no penalty, and shrugs one environmental hazard', cost: 'M' },
        ],
      },
    },
  },
];

// ── Spiritual (Friar — Confessor) ───────────────────────────────
// The soul-mender and inquisitor: a debuffer. His signature attack line
// is Charisma vs the target's Unarmoured Wisdom. The Ritual Option on a
// couple of cards trades combat speed for a skill roll at +2 with
// material components (prayer book, holy symbol, 10 sp of incense).
const SPIRITUAL: Ability[] = [
  {
    name: 'Censure', category: 'Spiritual', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Charisma vs AC (Light Blade or Mace)' },
      damage: { base: '1[W]', advances: [{ value: '1[W] + Cha', cost: 'm' }] },
      effects: {
        base: '−1 to all the target’s defences.',
        advances: [
          { value: '−2 to all defences', cost: 'm' },
          { value: '−2, and Vulnerable 1', cost: 'm' },
          { value: '−2 and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Rebuke', category: 'Spiritual', role: 'Offensive · debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: '30\'' },
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: 'Dazed — no Reactions or Interrupts.',
        advances: [
          { value: '+ no Minor action', cost: 'm' },
          { value: '+ no Move action', cost: 'm' },
          { value: 'Stunned — no actions', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: "Kerrigan's Prayer", category: 'Spiritual', role: 'Debuff · dispel', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: { base: '30\'', advances: [{ value: '60\'', cost: 'm' }, { value: '90\'', cost: 'm' }] },
      targets: {
        base: 'Opponents in a 10\' burst',
        advances: [
          { value: '15\' burst', cost: 'm' },
          { value: '20\' burst', cost: 'm' },
          { value: '30\' burst', cost: 'M' },
        ],
      },
      effects: {
        base: 'All opponents lose all Temp HP.',
        advances: [
          { value: '+ lose 1 beneficial effect (your choice)', cost: 'm' },
          { value: '+ lose all beneficial effects', cost: 'm' },
          { value: '+ a debuff preventing new buffs or Temp HP, save ends', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Fly the Wicked', category: 'Spiritual', role: 'Debuff · Fear', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: {
        base: 'Close burst 10\', centred on you',
        advances: [
          { value: '15\' burst', cost: 'm' },
          { value: '20\' burst', cost: 'm' },
          { value: '30\' burst', cost: 'M' },
        ],
      },
      targets: {
        base: '1 enemy in the burst',
        advances: [
          { value: '2 enemies', cost: 'm' },
          { value: '3 enemies', cost: 'm' },
          { value: 'all enemies in the burst', cost: 'M' },
        ],
      },
      attack: { base: 'Charisma vs Unarmoured Wisdom (one roll vs all)' },
      effects: {
        base: '−1 to attack rolls (Fear).',
        advances: [
          { value: '−1, and can’t move closer to you', cost: 'm' },
          { value: '+ can’t attack you', cost: 'm' },
          { value: 'flees you until it saves', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Vow of Nicetus', category: 'Spiritual', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: { base: 'Passive (always on)' },
      effects: {
        base: '+1 to attack rolls and skill checks against the Black Faith, Demons, Devils, and Undead. The Vow: never knowingly suffer a creature of the Black Faith to pass unopposed — neither aid, shelter, nor parley with them.',
        advances: [{ value: '+2', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Exorcism', category: 'Spiritual', role: 'Cleanse', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      attack: {
        base: 'Charisma vs the Condition’s DC',
        advances: [{ value: 'Ritual — Religion (Saintly Faith) vs the Condition’s DC, +2 (prayer book, holy symbol, 10 sp incense)', cost: 'm' }],
      },
      effects: {
        base: 'Reduce the target’s Control condition by one rank.',
        advances: [
          { value: 'Reduce by two ranks', cost: 'm' },
          { value: 'End the Control condition entirely', cost: 'm' },
          { value: 'End it; immune to Control for the encounter; a Black Faith spirit is banished from its host', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Ferret the Wicked', category: 'Spiritual', role: 'Utility', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'A few minutes of questioning (Standard in a tense scene)' },
      range: { base: 'The person before you' },
      targets: { base: 'One NPC' },
      attack: {
        base: 'Charisma vs Unarmoured Wisdom',
        advances: [{ value: 'Ritual — Sense Motive vs Unarmoured Wisdom, +2 (prayer book, holy symbol, 10 sp incense)', cost: 'm' }],
      },
      effects: {
        base: 'You know whether each answer the target gives is true or false.',
        advances: [
          { value: 'The target cannot knowingly lie to you (it may refuse or stay silent)', cost: 'm' },
          { value: 'It must answer one question truthfully', cost: 'm' },
          { value: 'It must answer Cha questions truthfully, and you perceive any Black Faith taint or hidden allegiance', cost: 'M' },
        ],
      },
      duration: { base: 'The interrogation' },
    },
  },
];

// ── Letters (Scholar — Class) ───────────────────────────────────
// Scholarship: academic utility, a clever Int-based blade, and the
// literacy that reads scrolls, spellbooks and rituals. No spells of its own.
// Read Scrolls and Conduct Ritual — the found-magic literacy. Shared verbatim
// by Letters (the Scholar's class category) and Occult (the Occultist's): the
// same cards in both lists. The Scholar's Paths get their literacy from Letters;
// the Occultist has no Letters, so Occult must carry its own.
const READ_SCROLLS: Ability = {
  name: 'Read Scrolls', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: '2 / encounter', cost: 'M', note: 'L3' }] },
    action: { base: 'Full Round', advances: [{ value: 'Standard', cost: 'M' }] },
    attack: { base: 'Int (+ Scroll Specialization) vs the spell’s defence' },
    effects: {
      base: 'Read only — identify a scroll’s spell. You must know its language (e.g. Elder Arcana).',
      advances: [
        { value: 'cast Lesser spells from a scroll (consumed on use)', cost: 'm' },
        { value: 'cast Greater spells', cost: 'M', note: 'L5' },
      ],
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('scroll'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_MASTERY('scroll', 'Scroll Specialization') },
  ],
  extraVars: [SCRIBE_CREATE],
};

const READ_SPELLBOOKS: Ability = {
  name: 'Read Spellbooks', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: '2 / encounter', cost: 'M', note: 'L3' }] },
    action: { base: 'Full Round', advances: [{ value: 'Standard', cost: 'M' }] },
    attack: { base: 'Int (+ Spellbook Specialization) vs the spell’s defence' },
    effects: {
      base: 'Read only — identify a spellbook’s spell. You must know its language. (Reusable; supply the components each casting.)',
      advances: [
        { value: 'cast Lesser spells', cost: 'm' },
        { value: 'cast Greater spells', cost: 'M', note: 'L5' },
      ],
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('spellbook'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_MASTERY('spellbook', 'Spellbook Specialization') + ' A Spellbook Specialist also adds Int to a damaging spell’s damage.' },
  ],
  extraVars: [SCRIBE_CREATE],
};

const CONDUCT_RITUAL: Ability = {
  name: 'Conduct Ritual', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    action: { base: 'The ritual’s own casting time' },
    effects: {
      base: 'Anyone with the materials and the language may perform a ritual at its base. Conduct Ritual lets you improve one, applying your Generic Advances (below) to its variables — e.g. shortening its casting time.',
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('ritual'), ladders: [GENERIC_ADV] },
    { label: 'Ritual Specialization Hooks', note: GA_MASTERY('ritual', 'Ritual Specialist') + ' A Ritual Specialist also gains +1 to any d20 roll for the ritual.' },
  ],
  extraVars: [
    { name: 'Participant Ladder', base: '—', advances: [{ value: 'improved one degree (more effect from fewer participants)', cost: 'M' }] },
    SCRIBE_CREATE,
  ],
};

const LETTERS: Ability[] = [
  {
    name: 'Research', category: 'Letters', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: { base: 'Uncapped (limited by time)' },
      action: { base: '8 hours of study', advances: [{ value: '6 hours', cost: 'm' }, { value: '4 hours', cost: 'm' }, { value: '1 hour', cost: 'M' }] },
      effects: {
        base: 'With relevant written sources, make a Knowledge skill check vs a GM-set DC, with a +2 research bonus.',
        advances: [
          { value: 'the bonus is +3', cost: 'm' },
          { value: '+4', cost: 'm' },
          { value: '+5, and you may reroll (keep the better)', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Scholar’s Strike', category: 'Letters', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Intelligence vs AC' },
      damage: { base: '1[W] (fixed)' },
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → +1 to hit', 'Staves → +1 to one of your defenses until your next turn'] }],
  },
  {
    name: 'Evade', category: 'Letters', role: 'Defensive · mobility', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'One engaging opponent' },
      targets: { base: 'One' },
      attack: {
        base: 'Intelligence vs Unarmoured Wisdom',
        advances: [
          { value: '+1 to the roll', cost: 'm' },
          { value: '+2 to the roll', cost: 'm' },
          { value: '+2; the Shift becomes 2 (10\')', cost: 'M' },
        ],
      },
      effects: { base: 'On a hit, Shift 1 (5\'); the opponent may not use a reaction to this movement.' },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Recall', category: 'Letters', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      effects: {
        base: 'Make a Knowledge skill check to recall a detail relevant to the situation or foe.',
        advances: [
          { value: 'the check is at +1', cost: 'm' },
          { value: 'at +2', cost: 'm' },
          { value: 'at +2 — or make it with a Knowledge skill you are untrained in', cost: 'M' },
        ],
      },
    },
  },
  READ_SCROLLS,
  READ_SPELLBOOKS,
  CONDUCT_RITUAL,
  {
    name: 'Identify', category: 'Letters', role: 'Magic literacy · utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Uncapped' },
      action: { base: 'A few minutes of study' },
      effects: {
        base: 'An Arcana check vs the object’s DC reveals it is magical, its tradition, and its level. (Only for magic whose language and tradition you know.)',
        advances: [
          { value: 'also its function', cost: 'm' },
          { value: 'also how to use it — command words, components, charges', cost: 'm' },
          { value: 'also its flaws and secrets — curses, hidden properties, maker', cost: 'M' },
        ],
      },
    },
  },
];

// ── Medicine (Scholar — Physician) ──────────────────────────────
// Non-magical: a surgeon’s cuts and crafted poisons, a guarded stance,
// and hands-on healing that draws on a Healer’s Kit and its Supplies.
// Envenom — the crafted-poison delivery. Shared verbatim by the Physician
// (Medicine) and the Assassin (Assassination): the same card in both lists.
const ENVENOM: Ability = {
  name: 'Envenom', category: 'Medicine', role: 'Offensive', mode: 'Attack',
  vars: {
    frequency: FREQ_FULL,
    action: { base: 'Standard — coats the blade and attacks in one (no Wis check)' },
    range: { base: 'Reach' },
    targets: { base: 'One' },
    attack: { base: 'Intelligence vs AC (Light Blade)' },
    damage: { base: '1[W]' },
    effects: {
      base: 'Delivers a crafted poison of your choice (you must have a full dose); +1 to the poison’s save DC.',
      advances: [
        { value: '+2 to the poison’s DC', cost: 'm' },
        { value: '+2 DC, and +1 Interval', cost: 'm' },
        { value: '+2 DC, and +Int Intervals', cost: 'M' },
      ],
    },
  },
  options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → +Int damage'] }],
};

const MEDICINE: Ability[] = [
  {
    name: 'Surgeon’s Strike', category: 'Medicine', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Intelligence vs AC (Light Blade)' },
      damage: { base: '1[W] (fixed)' },
      effects: {
        base: 'Bleed 1 / round.',
        advances: [
          { value: 'Bleed 2 / round', cost: 'm' },
          { value: 'Bleed 3 / round', cost: 'm' },
          { value: 'Bleed 5 / round', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends (or a Heal action stops it)' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → +Int damage'] }],
  },
  ENVENOM,
  {
    name: 'Guard Vitals', category: 'Medicine', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: { base: 'Self' },
      effects: {
        base: 'DR 1 against 1 attack.',
        advances: [
          { value: 'DR 2 against 1 attack', cost: 'm' },
          { value: 'DR 2 against all attacks from a single opponent', cost: 'm' },
          { value: 'DR 2 against all attacks until the start of your next turn', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Field Dressing', category: 'Medicine', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Heal Int HP. (Requires a Healer’s Kit; spends 1 Supply.)',
        advances: [
          { value: 'Heal Int + 1', cost: 'm' },
          { value: 'Heal Int + 2', cost: 'm' },
          { value: 'Heal Int + 1d6', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Field Medicine', category: 'Medicine', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_FRIAR,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Reduce one bodily Condition, ongoing damage, or poison by 1 Rank. A touch also stabilises a dying creature. (Healer’s Kit; 1 Supply.)',
        advances: [
          { value: 'reduce by 2 Ranks', cost: 'm' },
          { value: 'end it entirely', cost: 'm' },
          { value: 'end one, and the target may save against another', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Tend the Wounded', category: 'Medicine', role: 'Utility · camp heal', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'During a rest (Healer’s Kit; 1 Supply per target)' },
      range: { base: 'Those resting in camp' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies', cost: 'm' },
          { value: 'Three allies', cost: 'm' },
          { value: 'All who rest in camp', cost: 'M' },
        ],
      },
      effects: {
        base: 'Each recovers +Int HP on the rest, and may save (+0) against a bodily affliction.',
        advances: [
          { value: '+Int + 1 HP; the save is at +1', cost: 'm' },
          { value: '+Int + 2 HP; the save is at +2', cost: 'm' },
          { value: '+Int + 1d6 HP; a save vs each affliction at +2', cost: 'M' },
        ],
      },
      duration: { base: 'The rest' },
    },
  },
  {
    name: 'Convalescence', category: 'Medicine', role: 'Utility · long-term care', mode: 'Effect',
    vars: {
      frequency: { base: '24 hours of care, per patient' },
      action: { base: 'Patient at complete rest, no activity' },
      targets: {
        base: '1 patient',
        advances: [
          { value: '2 patients', cost: 'm' },
          { value: 'Int patients', cost: 'm' },
          { value: '10 patients', cost: 'M' },
        ],
      },
      effects: {
        base: 'Tend 1 Wound OR 1 Ability-Damage point as though 7 days had passed (your Heal roll replaces the save; 2 Supplies each). +3 HP bundled. At most 1 point per Ability Score per day.',
        advances: [
          { value: '2 Wounds or Ability-Damage points', cost: 'm' },
          { value: 'Int Wounds or points', cost: 'm' },
          { value: 'all Wounds and Ability-Damage points', cost: 'M' },
        ],
      },
    },
  },
];

// ── Elder Magic (Scholar — Antiquarian) ─────────────────────────
// The recovered, fragmentary art of the Elders: subtle and controlling,
// worked by force of will (Charisma vs an unguarded mind). Every working
// carries a Feat Hook, for Elder magic comes only in studied fragments.
// His own ladders — Sensory, Flat Debuff, Control, and Psychic damage —
// are reserved away from the Arcanist.
const STD_RANGE: Variable = { base: "30'", advances: [{ value: "60'", cost: 'm' }, { value: "90'", cost: 'm' }, { value: "120'", cost: 'M' }] };
const FREQ_2ENC: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'Twice per encounter', cost: 'M' }] };

// Wield Artefact — the artefact engine. Shared verbatim by Elder Magic (the
// Antiquarian's) and Occult (the Occultist's): the same card in both lists.
// The artefact's own tradition tag decides what it actually does.
const WIELD_ARTEFACT: Ability = {
  name: 'Wield Artefact', category: 'Elder Magic', role: 'Utility · artefact engine', mode: 'Effect',
  vars: {
    frequency: { base: 'Daily (Overdraw)', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'Twice per encounter', cost: 'M' }] },
    action: { base: "The artefact's own activation" },
    effects: {
      base: "Sense and handle an artefact; wield common ones at their base values, drawing on the artefact's own ladders. (Overdraw spends the Frequency above for extra activations beyond its charge limit.)",
      advances: [
        { value: "Attune to draw on an artefact's full ladders reliably", cost: 'm' },
        { value: 'Attune to powerful artefacts', cost: 'm' },
        { value: 'Attune to the powerful or unstable relics others cannot safely wield', cost: 'M' },
      ],
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('artefact'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_MASTERY('artefact', 'Artefact Specialization'), detail: ['Feat Hook (a studied Elder fragment) → a bonus when wielding artefacts of that tradition — e.g. +1 to its boosts, or a safe Overdraw'] },
  ],
};

const ELDER_MAGIC: Ability[] = [
  WIELD_ARTEFACT,
  {
    name: 'Whispers from the Doomed', category: 'Elder Magic', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }] },
      range: STD_RANGE,
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }, { value: 'Three', cost: 'm' }, { value: "all in a 10' radius", cost: 'M' }] },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      damage: { base: 'Cha (Psychic)', advances: [{ value: 'Cha + 1', cost: 'm' }, { value: 'Cha + 1d6', cost: 'm' }, { value: 'Cha + 2d6', cost: 'M', note: 'L5' }] },
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Mastery Hooks', detail: ['Mastery — Psychic → automatic +1 to hit and a critical hit on 19–20; unlocks a purchasable Fear ladder (−1 to attack → can’t move closer → can’t attack you → flees; save ends)'] }],
  },
  {
    name: 'Memory of Celestia', category: 'Elder Magic', role: 'Control · debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }, { value: 'Interrupt', cost: 'M' }] },
      range: STD_RANGE,
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }, { value: 'Three', cost: 'm' }, { value: "all in a 10' radius", cost: 'M' }] },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: '−1 to attack & Perception rolls (Sensory)',
        advances: [
          { value: '−2 to attack & Perception', cost: 'm' },
          { value: '−2, and no Interrupts or Reactions', cost: 'm' },
          { value: 'Blinded', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Radiant (off-list — typically via multiclass) → +1 to hit, and unlocks a Radiant damage ladder (Cha → Cha + 1 → Cha + 1d6 → Cha + 2d6 at L5)'] },
      { label: 'Implement Specialization Hooks', detail: ["Artefact → Push 5'"] },
    ],
  },
  {
    name: 'Figments of Forgotten Places', category: 'Elder Magic', role: 'Control · forced movement', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Full Round', advances: [{ value: 'Standard', cost: 'M' }] },
      range: { base: "30' (5' burst)", advances: [{ value: "60' (10' burst)", cost: 'm' }, { value: "90' (15' burst)", cost: 'm' }, { value: "120' (20' burst)", cost: 'M' }] },
      targets: { base: 'One enemy in the burst', advances: [{ value: 'Cha enemies', cost: 'm' }, { value: 'Cha + 1 enemies', cost: 'm' }, { value: 'all enemies in the burst', cost: 'M' }] },
      attack: { base: 'Charisma vs Unarmoured Will' },
      effects: {
        base: "Shift the target 1 (5')",
        advances: [
          { value: "Shift 2 (10')", cost: 'm' },
          { value: 'Shift 2, and Slowed 5 (1 round)', cost: 'm' },
          { value: 'Shift 3, and Slowed 5 (save ends)', cost: 'M' },
        ],
      },
      duration: { base: 'Instant (Slowed: save ends)' },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Psychic → adds a Psychic damage ladder onto the Effect (1 → Cha → Cha + 1 → Cha + 1 and Ongoing 1, save ends)'] },
      { label: 'Implement Specialization Hooks', detail: ["Spellbook → +5' to the burst, and unlocks a Movement debuff ladder (−5'/−10'/−15'/Immobilized) that replaces the Slowed conditions"] },
    ],
  },
  {
    name: 'Edict for the Thralls', category: 'Elder Magic', role: 'Control · domination', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Full Round', advances: [{ value: 'Standard', cost: 'M' }] },
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Will' },
      effects: {
        base: 'Confused — must roll to act as intended, else strike the nearest creature',
        advances: [
          { value: 'Charmed — cannot attack you', cost: 'm' },
          { value: 'Ensorcelled — cannot attack you, and may be compelled to strike the nearest', cost: 'm' },
          { value: "Dominated — you dictate the target's actions", cost: 'M', note: 'L5' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Psychic → 1 Psychic damage each round it stays bound'] },
      { label: 'Implement Specialization Hooks', detail: ['Spellbook → unlocks a Targets ladder (+1 / +2 / +3 / +4 targets)', 'Artefact → while you hold the artefact, the target takes −1 to its saves against the Edict'] },
    ],
  },
  {
    name: 'Pall of Doubt', category: 'Elder Magic', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M', note: 'L3' }] },
      action: { base: 'Full Round', advances: [{ value: 'Standard', cost: 'M' }] },
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Will' },
      effects: {
        base: '−1 to a chosen defense (Flat Debuff)',
        advances: [
          { value: '−2', cost: 'm' },
          { value: '−2 and Vulnerable 1', cost: 'm' },
          { value: '−2 and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Psychic → 1 Psychic damage each round the target is affected'] },
      { label: 'Implement Specialization Hooks', detail: ["Magic Staff (off-list — typically via multiclass) → +1 to your AC while any target remains under the Effect", "Artefact → −1 to the target's saves, and unlocks a Targets ladder (+1 / +2 / +3 / all enemies in range)"] },
    ],
  },
  {
    name: 'Psychometry', category: 'Elder Magic', role: 'Utility · divination', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'Ritual — 4 hours', advances: [{ value: '2 hours', cost: 'm' }, { value: '1 hour', cost: 'm' }, { value: '10 minutes', cost: 'M' }] },
      effects: {
        base: 'Study an object you handle (no language gate) and make a Knowledge: History check vs its Resonance DC. An object can be read only once, ever, and a failed check silences it for good. On a success, the DM reveals something of the object’s past.',
        advances: [
          { value: 'the DM reveals more, in greater detail', cost: 'm' },
          { value: 'more still, and you may ask a clarifying question', cost: 'm' },
          { value: 'as much as the object knows — its deepest history', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Implement Specialization Hooks', detail: ['Artefact → on an Artefact-tagged object, also unlocks an Identify-grade read of its powers, and grants a second attempt if the first check failed'] }],
  },
  {
    name: 'Lessons from Dark Places', category: 'Elder Magic', role: 'Utility · delving', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard (exploration)', advances: [{ value: 'Interrupt', cost: 'M' }] },
      range: { base: "Detect hazards & secret doors within 10' (Dungeoneering or History check)", advances: [{ value: "20'", cost: 'm' }, { value: "30'", cost: 'm' }, { value: "60'", cost: 'M' }] },
      effects: {
        base: 'Resolve a delving hazard with a Dungeoneering or History check in place of the save or skill it requires (+0 to the check).',
        advances: [
          { value: '+1 to the check', cost: 'm' },
          { value: '+2 to the check', cost: 'm' },
          { value: '+2, and your allies may use your result', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Implement Specialization Hooks', detail: ['Artefact → an additional +1 to the check'] }],
  },
];

// ── New Magic (Scholar — Arcanist) ──────────────────────────────
// The Collegium's destructive art, and a spell-builder. Each offensive
// chassis is bought with ONE element + a custom name, then re-bought to
// make another spell. Dexterity vs AC aims; Intelligence powers damage.
// An element's signature Effect ladder is FEAT-GATED (the matching
// Mastery — [type] feat), so those ladders live in each card's Feats line;
// the Effect(s) row shows only the baseline (damage, or a Defence ladder
// on the close chassis). Implements (wand/staff/spellbook/scroll) lend hooks.
const FREQ_ATWILL_L3: Variable = { base: 'Daily', advances: [{ value: 'Encounter', cost: 'M' }, { value: 'At-Will', cost: 'M', note: 'L3' }] };

const RANGED_SINGLE_DMG: Variable = { base: '1d4', advances: [{ value: '1d4 + Int', cost: 'm' }, { value: '1d6 + Int', cost: 'm' }, { value: '2d6 + Int', cost: 'M', note: 'L5' }] };
const CLOSE_SINGLE_DMG: Variable = { base: '1d6', advances: [{ value: '1d6 + Int', cost: 'm' }, { value: '1d8 + Int', cost: 'm' }, { value: '2d8 + Int', cost: 'M', note: 'L5' }] };
const RANGED_AOE_DMG: Variable = { base: '1', advances: [{ value: 'Int', cost: 'm' }, { value: '1d4 + Int', cost: 'm' }, { value: '2d4 + Int', cost: 'M', note: 'L5' }] };
const CLOSE_AOE_DMG: Variable = { base: 'Int', advances: [{ value: '1d4 + Int', cost: 'm' }, { value: '1d6 + Int', cost: 'm' }, { value: '2d6 + Int', cost: 'M', note: 'L5' }] };
const NM_DEFENCE: Variable = { base: '+1 to one Defence (until your next turn)', advances: [{ value: '+1 to all Defences', cost: 'm' }, { value: '+2 to all Defences', cost: 'm' }, { value: '+2 to all Defences and DR 1', cost: 'M' }] };
const NM_AOE_TARGETS: Variable = { base: 'Each creature in the burst — one Dexterity vs AC roll resolved against each (friendly fire included)' };

const NM_ELEMENT_DETAIL = 'Choose one elemental damage type when you build the spell — Fire, Acid, Cold, Lightning, Sonic, or Force. This is the damage type of the Ability, and you can unlock additional effects if you have the Mastery Feat for that element.';
const NM_IMPL_LIST = [
  'Wand → +1 to hit',
  'Magic Staff → +1 to one Defence until your next round',
  'Spellbook → the Elemental Mastery Effect ladder lands one Rank higher',
  'Scroll → once per encounter, cast without consuming the scroll',
];
const NM_IMPL_AOE_LIST = [
  'Wand → +1 to hit',
  "Magic Staff → +5' burst radius",
  'Spellbook → the Elemental Mastery Effect ladder lands one Rank higher',
  'Scroll → once per encounter, cast without consuming the scroll',
];
const NM_MASTERY_NOTE = 'Your spell does the damage based on your Damage Ladder above, and you can additionally purchase from the relevant Effect Ladder below.';
const NM_HOOK_NOTE = 'You gain +1 to hit with the spell if your Mastery Feat and the Damage Type are the same. Additionally, you get an automatic Effect which improves as you Advance the Damage Ladder in the spell, as follows:';

// The four New Magic Effect ladders, each tied to its damage types. Same on
// every offensive chassis (any element can be built into any chassis).
const EFL_ONGOING: NamedLadder = {
  name: 'Ongoing Damage — Fire & Acid',
  base: '1 damage / round',
  advances: [
    { value: '2 / round', cost: 'm' },
    { value: '3 / round', cost: 'm' },
    { value: '5 / round', cost: 'M' },
  ],
};
const EFL_MOVEMENT: NamedLadder = {
  name: 'Movement — Cold',
  base: "Slowed −5'",
  advances: [
    { value: "Slowed −10'", cost: 'm' },
    { value: "Slowed −15'", cost: 'm' },
    { value: 'Immobilized', cost: 'M' },
  ],
};
const EFL_ACTION: NamedLadder = {
  name: 'Action Denial — Lightning & Sonic',
  base: 'Dazed — no Reactions or Interrupts',
  advances: [
    { value: '+ no Minor action', cost: 'm' },
    { value: '+ no Move action', cost: 'm' },
    { value: 'Stunned — no actions', cost: 'M' },
  ],
};
const EFL_PUSH: NamedLadder = {
  name: 'Push — Force',
  base: "Push 5'",
  advances: [
    { value: "Push 10'", cost: 'm' },
    { value: "Push 15'", cost: 'm' },
    { value: "Push 15' and knocked Prone", cost: 'M' },
  ],
};
const NM_EFFECT_LADDERS = [EFL_ONGOING, EFL_MOVEMENT, EFL_ACTION, EFL_PUSH];
const HKL_SPLASH: NamedLadder = {
  name: 'Splash — Acid & Sonic',
  base: '1 damage to 1 adjacent creature',
  advances: [
    { value: '1 damage to 2 adjacent', cost: 'm' },
    { value: '1 damage to Int adjacent', cost: 'm' },
    { value: '2 damage to all adjacent', cost: 'M' },
  ],
};
const HKL_GLANCING: NamedLadder = {
  name: 'Glancing — Force & Cold',
  base: '1 damage on a miss',
  advances: [
    { value: '2 damage on a miss', cost: 'm' },
    { value: 'Int damage on a miss', cost: 'm' },
    { value: 'half the spell’s damage on a miss', cost: 'M' },
  ],
};
const HKL_PIERCE: NamedLadder = {
  name: 'Pierce — Fire & Lightning',
  base: '1 damage to 1 enemy in the line to the target',
  advances: [
    { value: '1 to 2 enemies in the line', cost: 'm' },
    { value: '1 to Int enemies in the line', cost: 'm' },
    { value: '2 to all in the line', cost: 'M' },
  ],
};
const HKL_RETAL: NamedLadder = {
  name: 'Retaliation — Fire & Lightning',
  base: 'The next enemy to melee you takes 1 typed damage (until your next turn)',
  advances: [
    { value: 'all enemies that melee you take it', cost: 'm' },
    { value: '2 typed damage', cost: 'm' },
    { value: 'it lasts until the end of the encounter', cost: 'M' },
  ],
};
const HKL_LINGER: NamedLadder = {
  name: 'Lingering — Acid & Sonic',
  base: 'A creature entering or ending its turn in the area takes 1 typed damage',
  advances: [
    { value: '2 typed damage', cost: 'm' },
    { value: 'Int typed damage', cost: 'm' },
    { value: 'the hazard lingers a second round', cost: 'M' },
  ],
};

const NEW_MAGIC: Ability[] = [
  {
    name: 'Telum Eminus', category: 'New Magic', role: 'Offensive · ranged · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: { base: 'Standard' },
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: RANGED_SINGLE_DMG,
      duration: { base: 'Instant' },
    },
    builder: true,
    options: [
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Mastery - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_PIERCE, HKL_SPLASH, HKL_GLANCING] },
      { label: 'Elemental Mastery - Optional Hooks', note: NM_MASTERY_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_LIST },
    ],
  },
  {
    name: 'Tactus Comminus', category: 'New Magic', role: 'Offensive · close · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: CLOSE_SINGLE_DMG,
      effects: NM_DEFENCE,
      duration: { base: 'Instant (Defence: until your next turn)' },
    },
    builder: true,
    options: [
      { label: 'Defence (baseline)', detail: 'The Effect row’s Defence ladder is always on — no element or feat needed.' },
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Mastery - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_RETAL, HKL_SPLASH, HKL_GLANCING] },
      { label: 'Elemental Mastery - Optional Hooks', note: NM_MASTERY_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_LIST },
    ],
  },
  {
    name: 'Globus Eminus', category: 'New Magic', role: 'Offensive · ranged burst · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard' },
      range: { base: "30' (5' burst)", advances: [{ value: "60' (10' burst)", cost: 'm' }, { value: "90' (15' burst)", cost: 'm' }, { value: "120' (20' burst)", cost: 'M' }] },
      targets: NM_AOE_TARGETS,
      attack: { base: 'Dexterity vs AC' },
      damage: RANGED_AOE_DMG,
      duration: { base: 'Instant' },
    },
    builder: true,
    options: [
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Mastery - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_PIERCE, HKL_LINGER, HKL_GLANCING] },
      { label: 'Elemental Mastery - Optional Hooks', note: NM_MASTERY_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_AOE_LIST },
    ],
  },
  {
    name: 'Corona Comminus', category: 'New Magic', role: 'Offensive · close burst · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard' },
      range: { base: "5' burst (centred on you)", advances: [{ value: "10' burst", cost: 'm' }, { value: "15' burst", cost: 'm' }, { value: "20' burst", cost: 'M' }] },
      targets: NM_AOE_TARGETS,
      attack: { base: 'Dexterity vs AC' },
      damage: CLOSE_AOE_DMG,
      effects: NM_DEFENCE,
      duration: { base: 'Instant (Defence: until your next turn)' },
    },
    builder: true,
    options: [
      { label: 'Defence (baseline)', detail: 'The Effect row’s Defence ladder is always on — you stand in your own burst, so it needs no element or feat.' },
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Mastery - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_RETAL, HKL_LINGER, HKL_GLANCING] },
      { label: 'Elemental Mastery - Optional Hooks', note: NM_MASTERY_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_AOE_LIST },
    ],
  },
  {
    name: 'Lorica Arcana', category: 'New Magic', role: 'Defensive · arcane armour', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'Ritual — 1 minute' },
      targets: { base: 'Self' },
      effects: {
        base: '+1 AC',
        advances: [
          { value: '+1 to all Armoured Defences', cost: 'm' },
          { value: '+1 to all Defences', cost: 'm' },
          { value: '+1 to all Defences, and DR 1', cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '2 hours', cost: 'm' }, { value: '4 hours', cost: 'm' }, { value: 'until your next Long Rest', cost: 'M' }] },
    },
    options: [{ label: 'Implement Specialization Hooks', note: 'No element — Lorica Arcana is not an elemental spell.', detail: ['Magic Staff → every defence improvement is +1 more'] }],
  },
  {
    name: 'Scutum Virium', category: 'New Magic', role: 'Defensive · force shield', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Interrupt — when you are hit by an attack' },
      targets: { base: 'Self' },
      effects: {
        base: '+1 AC (a Buckler)',
        advances: [
          { value: '+1 AC and DR 1 (a Standard shield)', cost: 'm' },
          { value: '+2 AC and DR 1 (a large shield)', cost: 'm' },
          { value: '+2 AC and DR 2 (a Tower shield)', cost: 'M' },
        ],
      },
      duration: { base: 'Until the start of your next turn' },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Force → the bonus applies to all Armoured Defences, not just AC'] },
      { label: 'Implement Specialization Hooks', detail: ['Magic Staff → +1 to both AC and DR'] },
    ],
  },
  {
    name: 'Manus Eminus', category: 'New Magic', role: 'Utility · telekinesis', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard' },
      range: STD_RANGE,
      attack: { base: "Dexterity vs Armoured Strength (to shove an unwilling creature up to 10', within capacity)" },
      effects: {
        base: 'Move an unattended object up to 10 lb',
        advances: [
          { value: 'up to 50 lb', cost: 'm' },
          { value: 'up to 200 lb (a person)', cost: 'm' },
          { value: 'up to 1,000 lb', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Implement Specialization Hooks', detail: ["Wand → each ladder counts one Rank higher; at the top Rank it doubles instead → 240' / 2,000 lb"] }],
  },
  {
    name: 'Lumen Arcanum', category: 'New Magic', role: 'Utility · light', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Minor' },
      effects: {
        base: "Dim light, 10' radius",
        advances: [
          { value: "bright 20' radius", cost: 'm' },
          { value: "bright 20' (+ dim 20' beyond); you may move it or affix it to a moving object", cost: 'm' },
          { value: "Daylight, bright 30' (counts as sunlight; dispels magical darkness)", cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '2 hours', cost: 'm' }, { value: '4 hours', cost: 'm' }, { value: 'until you dismiss it', cost: 'M' }] },
    },
    options: [
      { label: 'Mastery Hooks', detail: ['Mastery — Fire → the light is a magical, unquenchable flame (and behaves like a torch for setting things alight)'] },
      { label: 'Implement Specialization Hooks', detail: ["Wand → adds a Range ladder (30'/60'/90'/120') that tracks the Brightness Rank — place the light as far as it reaches"] },
    ],
  },
];

// ── The Lost (Scoundrel — Class) ────────────────────────────────
// The Category's engine: a strike only pays when the mark is Off Guard or
// flanked (see Combat). Everything else here exists to buy that condition.
const OFF_GUARD_NOTE =
  'The mark is Off Guard against you when it cannot see you, has not yet acted, is Prone, Stunned or Immobilized — or you have Feinted it. Flanking counts too.';

// The Scoundrel's weapon hooks — the groups the Class and its three Paths train.
const LOST_HOOKS: string[] = [
  'Light Blades → the sneak damage counts one Rank higher',
  'Thrown → the attack may be made at range (1×WRI), sneak damage and all',
  'Crossbows → ignore the DR of armour',
  'Hammers / Maces → on a hit against an Off Guard mark, it is also Dazed (no Reactions or Interrupts)',
  'Unarmed / Natural → on a hit against an Off Guard mark, it is knocked Prone',
];

const THE_LOST: Ability[] = [
  {
    name: 'Sneak Attack', category: 'The Lost', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One Off Guard or flanked opponent' },
      attack: { base: 'Dexterity vs AC' },
      damage: {
        base: '1[W] + 1',
        advances: [
          { value: '1[W] + Dex', cost: 'm' },
          { value: '1[W] + 1d6', cost: 'm' },
          { value: '2[W] + 1d6', cost: 'M', note: 'L5' },
        ],
      },
      effects: {
        base: 'None',
        advances: [
          { value: 'Bleed 1', cost: 'M' },
          { value: 'Bleed 2', cost: 'M' },
        ],
      },
      duration: { base: 'Instant (Bleed: save ends)' },
    },
    options: [
      { label: 'The mark must be Off Guard or flanked', note: OFF_GUARD_NOTE, detail: 'Sneak Attack can only be aimed at a mark who is Off Guard against you or whom you flank. Against anyone else there is no strike to make — this is the reward for getting behind a guard, not a general attack.', placement: 'top' },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: LOST_HOOKS },
    ],
  },
  {
    name: 'Feint', category: 'The Lost', role: 'Debuff · setup', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs Unarmoured Wisdom' },
      damage: { base: 'None — a false move, not a real one' },
      effects: {
        base: 'The mark is Off Guard against your attacks.',
        advances: [
          { value: 'Off Guard against your attacks and one ally’s', cost: 'm' },
          { value: 'Off Guard against everyone’s attacks', cost: 'm' },
          { value: 'Off Guard against everyone’s attacks, and Dazed (no Reactions or Interrupts)', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next turn' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → +2 to the Feint attack roll'] }],
  },
  {
    name: 'Dirty Trick', category: 'The Lost', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs Unarmoured Dexterity' },
      damage: { base: 'None — sand, ash, a flung cloak, a boot to the knee' },
      effects: {
        base: 'Sensory: −1 to the mark’s attack and Perception rolls.',
        advances: [
          { value: '−2 to attack and Perception', cost: 'm' },
          { value: '−2, and no Interrupts or Reactions', cost: 'm' },
          { value: 'Blinded', cost: 'M' },
        ],
      },
      duration: {
        base: 'Until the end of your next turn',
        advances: [
          { value: 'Dex rounds', cost: 'm' },
          { value: 'Save ends', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Nimble Evasion', category: 'The Lost', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Interrupt — when an enemy attacks you', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: 'Shift 5′. The movement provokes no opportunity attacks.',
        advances: [
          { value: 'Shift 10′', cost: 'm' },
          { value: 'Shift 10′, and the next attack against you this round takes −2', cost: 'm' },
          { value: 'Shift 10′ — and if you end it out of the attacker’s reach, the triggering attack misses', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Vanish', category: 'The Lost', role: 'Defensive · utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: 'Hide (Stealth vs Perception) even while observed, so long as you have cover or concealment. Anyone who loses you is Off Guard against you.',
        advances: [
          { value: '+2 to the Stealth check', cost: 'm' },
          { value: 'No cover needed — a shadow, a crowd, or a distraction is enough', cost: 'm' },
          { value: 'Hide in plain sight, with nothing at all to hide behind', cost: 'M' },
        ],
      },
      duration: { base: 'Until you attack or are found' },
    },
  },
  {
    name: 'Tumble', category: 'The Lost', role: 'Movement', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Move' },
      range: { base: 'Self' },
      effects: {
        base: 'Move up to half your Speed, provoking no opportunity attacks.',
        advances: [
          { value: 'As above, and you may move through enemies’ squares with no check', cost: 'm' },
          { value: 'As above, at your full Speed', cost: 'm' },
          { value: 'As above, and every enemy whose square you pass through is Off Guard until the end of your next turn', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Light Fingers', category: 'The Lost', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: { base: 'Encounter', advances: [{ value: 'At-Will', cost: 'M' }] },
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Thievery vs the mark’s Perception' },
      effects: {
        base: 'Lift, palm, or plant a small unattended or pocketed item.',
        advances: [
          { value: 'An item on the mark’s belt or person — a purse, a key, a signet', cost: 'm' },
          { value: 'An item in the mark’s hand', cost: 'm' },
          { value: 'And the mark does not notice until the scene has ended — no second check', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Lay Low', category: 'The Lost', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: '1 hour, in a settlement' },
      targets: {
        base: 'Self',
        advances: [
          { value: 'Self and 1 other', cost: 'm' },
          { value: 'Self and 2 others', cost: 'm' },
          { value: 'The entire party', cost: 'M' },
        ],
      },
      effects: {
        base: 'You go to ground in some abandoned or hidden place. Opponents take −1 to locate you (Gather Information, or another relevant skill check).',
        advances: [
          { value: '−2 to locate you', cost: 'm' },
          { value: '−2, and a failed check turns up a misdirection ("they left town", "took the river road")', cost: 'm' },
          { value: '−2, and you may venture out up to 4 hours a day without compromising the hiding place', cost: 'M' },
        ],
      },
      duration: { base: '24 hours', advances: [{ value: '48 hours', cost: 'm' }, { value: '72 hours', cost: 'm' }, { value: '1 week', cost: 'M' }] },
    },
  },
];

// ── Assassination (Scoundrel — Assassin) ────────────────────────
// The studied kill. Study the Mark hangs a Studied marker on a target; Death
// Blow and the surgical strikes pay off against it, and Intelligence rides on
// the study. Dexterity still plants every blade (the Scoundrel rule).
const STUDIED_NOTE =
  'A mark you have Studied (with Study the Mark) stays Studied until the end of the encounter, and your Sneak Attack, Death Blow, and Anatomist’s Cut deal Study the Mark’s bonus damage (+1, rising to +Int and +2 × Int) against it.';

// Death Blow's weapon hooks. Light Blades gives +1 to hit (the study bonus
// already covers damage); the other three groups add their signature riders.
const DEATHBLOW_HOOKS: string[] = [
  'Light Blades → +1 to hit',
  'Thrown → the strike may be thrown (1×WRI), Studied bonus and all',
  'Crossbows → ignore the DR of armour',
  'Unarmed / Natural → on a hit against a Studied mark, it is also Off Guard against your next attack',
];

const ASSASSINATION: Ability[] = [
  {
    name: 'Study the Mark', category: 'Assassination', role: 'Setup', mode: 'Effect',
    vars: {
      frequency: { base: 'Encounter', advances: [{ value: 'Twice per encounter', cost: 'M' }] },
      action: { base: 'Minor (in combat) / a few minutes’ watching (out of combat)' },
      range: { base: 'Sight' },
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }, { value: 'Int', cost: 'm' }] },
      attack: { base: 'Intelligence vs the target’s Difficulty Class' },
      effects: {
        base: 'The mark is Studied: +1 damage to any Sneak Attack, Death Blow, or Anatomist’s Cut against it.',
        advances: [
          { value: '+Int damage instead of +1', cost: 'm' },
          { value: 'You also learn the mark’s HP and Defences', cost: 'm' },
          { value: '+2 × Int damage', cost: 'M', note: 'L5' },
        ],
      },
      duration: { base: 'Until the end of the encounter' },
    },
  },
  {
    name: 'Death Blow', category: 'Assassination', role: 'Offensive · finisher', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One Studied mark that is Off Guard or flanked' },
      attack: { base: 'Dexterity vs AC' },
      damage: {
        base: '2[W] + the study bonus',
        advances: [
          { value: '2[W] + 1 + the study bonus', cost: 'm' },
          { value: '2[W] + Dex + the study bonus', cost: 'm' },
          { value: '3[W] + Dex + the study bonus', cost: 'M', note: 'L5' },
        ],
      },
      effects: {
        base: 'None',
        advances: [
          { value: 'Bleed 1', cost: 'M' },
          { value: 'Bleed 2', cost: 'M' },
        ],
      },
      duration: { base: 'Instant (Bleed: save ends)' },
    },
    options: [
      { label: 'Studied and Off Guard', note: STUDIED_NOTE, detail: 'Death Blow can only be aimed at a mark you have Studied who is also Off Guard against you or whom you flank. It is the patient kill — the reward for setting the whole thing up, not a strike you throw in a scramble.', placement: 'top' },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: DEATHBLOW_HOOKS },
    ],
  },
  ENVENOM,
  {
    name: 'Anatomist’s Cut', category: 'Assassination', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard' },
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: '1[W] + Dex (+ the study bonus against a Studied mark)' },
      effects: {
        base: 'A crippling cut to nerve, tendon, or joint: −1 to a Defence of your choice.',
        advances: [
          { value: '−2 to the chosen Defence', cost: 'm' },
          { value: '−2, and Vulnerable 1', cost: 'm' },
          { value: '−2, and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → the cut also Slows the mark (−5′ Speed) while it holds'] }],
  },
  {
    name: 'Garrote', category: 'Assassination', role: 'Offensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Standard' },
      range: { base: 'Reach (from behind — the mark must be Off Guard)' },
      targets: { base: 'One Off Guard opponent' },
      attack: { base: 'Dexterity vs Armoured Strength (a choke, not a cut)' },
      damage: { base: '1[W]' },
      effects: {
        base: 'The mark is Grabbed and silenced — no speech, no spell with a spoken part.',
        advances: [
          { value: 'And takes 1[W] damage every round while held', cost: 'm' },
          { value: 'And Dazed (no Reactions or Interrupts) while held', cost: 'm' },
          { value: 'And, from the second round it is held, it must make a Constitution save (vs your Strength Offense + 10) each round or fall Unconscious', cost: 'M' },
        ],
      },
      duration: { base: 'While you sustain the grab (a Minor each round)' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Unarmed / Natural → you may drag the mark 5′ a round with you, with no separate Forced Move'] }],
  },
  {
    name: 'Pointed Inquiry', category: 'Assassination', role: 'Utility · non-combat', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'A social interaction (non-combat)' },
      range: { base: 'Conversation' },
      targets: { base: 'A person or creature that knows something about your quarry' },
      attack: { base: 'Intimidate, Diplomacy, or Bluff vs the target’s matching Defence' },
      effects: {
        base: 'You wring out details of your quarry: +2 to any roll to learn its weaknesses or Defences, in or before combat while you can observe it — Study the Mark checks included.',
        advances: [
          { value: 'You also gain +4 Initiative against the quarry', cost: 'm' },
          { value: 'You also gain +1 to hit the quarry in your next encounter with it', cost: 'm' },
          { value: 'You permanently gain +1 to hit and +1 damage against the quarry', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Clean Kill', category: 'Assassination', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: { base: 'Encounter' },
      action: { base: 'A few minutes with the body' },
      range: { base: 'Touch' },
      effects: {
        base: 'You leave nothing behind: the death raises no alarm, and body and signs are hidden from a casual search.',
        advances: [
          { value: 'Even a deliberate search takes −2 to turn anything up', cost: 'm' },
          { value: 'You can make the death read as natural or accidental', cost: 'm' },
          { value: 'No trace at all — no Gather Information check can connect the death to you', cost: 'M' },
        ],
      },
    },
  },
];

// ── Guile (Scoundrel — Charlatan) ────────────────────────────────
// The con man's craft: Charisma against a foe's nerve (Unarmoured Wisdom), a
// debuffer who also sets Off Guard for the whole party — his tricks open a
// mark for everyone's blades, his own Sneak Attack included. No new marker; he
// rides the existing Control, Fear, and Off Guard rules.
// The Charlatan's ranged debuffs share one Range and one Targets ladder.
const GUILE_TARGETS: Variable = {
  base: 'One',
  advances: [
    { value: 'Two', cost: 'm' },
    { value: 'Cha', cost: 'm' },
    { value: 'All opponents', cost: 'M' },
  ],
};

const GUILE: Ability[] = [
  {
    name: 'Misdirection', category: 'Guile', role: 'Debuff · Off Guard', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: '“Look there.” The Target is Off Guard to your attacks.',
        advances: [
          { value: 'The Target is Off Guard to all attacks', cost: 'm' },
          { value: 'And you may Shift one Target 5′', cost: 'm' },
          { value: 'And one Target is Dazed until the end of your next turn', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next turn' },
    },
  },
  {
    name: 'Cutting Remark', category: 'Guile', role: 'Debuff · offence', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: 'A jibe that gets under the skin: −1 to the Target’s attack rolls.',
        advances: [
          { value: '−1 to its attack and damage rolls', cost: 'm' },
          { value: '−2 to its attack and damage rolls', cost: 'm' },
          { value: '−2 to attack and damage, and the Target may not take Reactions or Interrupts', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next turn' },
    },
  },
  {
    name: 'Bluster', category: 'Guile', role: 'Debuff · defences', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: { base: 'Standard', advances: [{ value: 'Move', cost: 'M' }, { value: 'Minor', cost: 'M' }] },
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: 'Bluff and bravado throw the Target off its guard: −1 to a defence of your choice.',
        advances: [
          { value: '−2 to the chosen defence', cost: 'm' },
          { value: '−2, and Vulnerable 1', cost: 'm' },
          { value: '−2, and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Confidence', category: 'Guile', role: 'Buff · self', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Move', advances: [{ value: 'Minor', cost: 'M' }, { value: 'Free', cost: 'M' }] },
      range: { base: 'Self' },
      effects: {
        base: 'A performer’s unshakeable front: gain 1 Temp HP.',
        advances: [
          { value: 'Cha Temp HP', cost: 'm' },
          { value: 'Cha Temp HP, and +1 to all your defences while the Temp HP lasts', cost: 'm' },
          { value: 'And you cannot be made Off Guard while the Temp HP lasts', cost: 'M' },
        ],
      },
      duration: { base: 'Until you lose the Temp HP' },
    },
  },
  {
    name: 'Swindle', category: 'Guile', role: 'Utility · non-combat', mode: 'Attack',
    vars: {
      frequency: { base: 'Daily' },
      action: {
        base: '24 hours setting up the con',
        advances: [
          { value: '12 hours', cost: 'm' },
          { value: '6 hours', cost: 'm' },
          { value: '1 hour', cost: 'M' },
        ],
      },
      range: { base: 'Conversation' },
      targets: { base: 'One person, household, business, or other organization' },
      attack: { base: 'Bluff vs the Target’s Unarmoured Wisdom' },
      effects: {
        base: 'Con the Target out of 1d6 sp.',
        advances: [
          { value: '1d6 + Cha sp', cost: 'm' },
          { value: '2d6 + Cha sp', cost: 'm' },
          { value: '1d4 × 10 sp', cost: 'M' },
        ],
      },
      duration: { base: 'Instant — the take is yours' },
    },
  },
  {
    name: 'Parley', category: 'Guile', role: 'Utility · social', mode: 'Attack',
    vars: {
      frequency: { base: 'Encounter' },
      action: { base: 'A conversation (a Standard in a tense standoff)' },
      range: { base: 'Conversation' },
      targets: { base: 'One NPC' },
      attack: { base: 'Diplomacy vs the Target’s Unarmoured Charisma' },
      effects: {
        base: 'Win a small concession — a delay, a passage, a scrap of information.',
        advances: [
          { value: 'A real concession: a truce, safe passage for the party, or a favour owed', cost: 'm' },
          { value: 'You win it from a whole household or crowd, not just the one before you', cost: 'm' },
          { value: 'You turn the Target from violence for the scene, or broker a lasting accord', cost: 'M' },
        ],
      },
      duration: { base: 'As negotiated' },
    },
    options: [{ label: 'Terms, not warmth', note: 'Parley wins you something concrete. Shifting an NPC’s Attitude is the Diplomacy skill’s own Persuade action (and the Friar’s Preach to the Saintly) — Parley leaves that to them and extracts terms instead.', placement: 'top' }],
  },
  {
    name: 'Contionem habere', category: 'Guile', role: 'Utility · rally', mode: 'Attack',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'A rousing speech (a few minutes)' },
      range: { base: 'You and all allies who can hear you' },
      targets: { base: 'The foe (or foes) your speech names' },
      attack: { base: 'Intimidate vs the named foe’s Unarmoured Wisdom' },
      effects: {
        base: 'You and your allies gain 1 Temp HP, held until your next encounter with the named foe.',
        advances: [
          { value: 'Cha Temp HP', cost: 'm' },
          { value: 'Cha Temp HP, and +1 to AC', cost: 'm' },
          { value: 'Cha + 1 Temp HP, and +1 to all defences', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next encounter with the named foe (or until the Temp HP is spent)' },
    },
    options: [{ label: 'Contionem habere', note: 'Auld Imperial: “to hold forth” — a public harangue that steels your own before the fight.', placement: 'top' }],
  },
];

// ── Occult (Occultist — Class; hosted by the Scoundrel's Blackcoat) ──
// The Occultist's own Category, authored here ahead of that class. Wisdom —
// not learning, but the low, unwanted knowing of one who has seen the other
// side.
//
// Occult is forbidden but benign: it draws on sources the church would burn you
// for, and uses them to see, to warn, to guard, and to bless. It has no attacks.
// The malevolent half — curses, compulsion, the wasting, the bound shade, and
// power borrowed against a debt — is parked for the future WITCHCRAFT Category.
//
// THE PRICE: some Occult Abilities carry a Price — a negative effect on the
// user, applied when the Ability is used. Each has its own Price ladder, bought
// down like any other.
const PRICE_NOTE =
  'Some Occult Abilities carry a special property called the Price: a negative effect on you, applied when you use the Ability. Each Price is a ladder like any other, and can be bought down.';

// The common Price ladder — shared by Third Eye and Dark Blessing.
const PRICE_MAXHP: NamedLadder = {
  name: 'Price',
  base: '−2 Maximum HP until a long rest',
  advances: [
    { value: '−1 Maximum HP until a long rest', cost: 'm' },
    { value: '−1 Maximum HP until a short rest', cost: 'M' },
    { value: 'No Price', cost: 'M' },
  ],
};

const OCCULT: Ability[] = [
  {
    name: 'Third Eye', category: 'Occult', role: 'Utility · sight', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: { base: 'Minor (in combat) / instant (out of combat)' },
      range: STD_RANGE,
      effects: {
        base: 'Lowlight Vision — Dim Light carries no penalty for you.',
        advances: [
          { value: 'Darkvision — Darkness carries no penalty either (Magical Darkness and the Void still blind you)', cost: 'm' },
          { value: 'See Invisible — you see invisible creatures and things', cost: 'm' },
          { value: 'Ghost Sight — you see spirits and shades, and into the other side', cost: 'M' },
        ],
      },
      duration: { base: '1 minute', advances: [{ value: '5 minutes', cost: 'm' }, { value: '10 minutes', cost: 'm' }, { value: '1 hour', cost: 'M' }] },
    },
    extraVars: [PRICE_MAXHP],
    options: [{ label: 'The Price', note: PRICE_NOTE, placement: 'top' }],
  },
  {
    name: 'Dark Blessing', category: 'Occult', role: 'Buff · party support', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'A few minutes of asking' },
      range: { base: 'Touch' },
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies', cost: 'm' },
          { value: 'Wis allies', cost: 'm' },
          { value: 'All allies', cost: 'M' },
        ],
      },
      effects: {
        base: 'The favour of the dead settles on the blessed: +1 to their saves.',
        advances: [
          { value: '+1 to their saves and defences', cost: 'm' },
          { value: '+1 to their saves, defences, and attack rolls', cost: 'm' },
          { value: 'And one reroll for the party — keep the better result, on any d20 roll', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next rest' },
    },
    extraVars: [PRICE_MAXHP],
  },
  {
    name: 'Spirit Guide', category: 'Occult', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: { base: 'Daily' },
      action: { base: 'A few minutes of asking' },
      range: { base: 'You (the party, from Rank 2)' },
      effects: {
        base: 'You gain 1 reroll during the Duration, for any non-combat roll.',
        advances: [
          { value: 'The party gains 1 reroll', cost: 'm' },
          { value: 'The party gains 2 rerolls', cost: 'm' },
          { value: 'And you know the direction to a safe place', cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '4 hours', cost: 'm' }, { value: '8 hours', cost: 'm' }, { value: '24 hours', cost: 'M' }] },
    },
    extraVars: [PRICE_MAXHP],
    options: [{ label: 'Special', note: 'If you name the kind of roll you are asking after when you ask — Dungeoneering, Survival, and so on — you gain +2 to rolls of that kind, and to the reroll.' }],
  },
  // ── Object use. The Occultist has no Letters, so Occult carries its own
  // literacy — all four reused verbatim from the categories that own them, one
  // per kind of found magic: Wield Artefact from Elder Magic; Read Scrolls,
  // Read Spellbooks and Conduct Ritual from Letters. The same cards, in both
  // lists.
  WIELD_ARTEFACT,
  READ_SCROLLS,
  READ_SPELLBOOKS,
  CONDUCT_RITUAL,
];

export const CATEGORIES: CategoryGroup[] = [
  { name: 'Arms', source: 'Soldier — Class', blurb: 'The disciplined core of weapon-fighting: reliable strikes that grow with the weapon in your hands, plus the means to guard, disarm, focus, and read a fight.', abilities: ARMS },
  { name: 'Protection', source: 'Soldier — Vanguard', blurb: 'The defender’s toolkit: control strikes that pin and daze, shielding auras for your comrades, and the means to take a blow meant for someone else.', abilities: PROTECTION },
  { name: 'Leadership', source: 'Soldier — Commander', blurb: 'Command and rally: granting allies free attacks, calling focus-fire targets, bracing the line, and bolstering the whole company at once.', abilities: LEADERSHIP },
  { name: 'Marksmanship', source: 'Soldier — Marksman', blurb: 'Ranged mastery: the bread-and-butter shot that fits any ranged weapon, fire that pins and cripples, covering an ally, and shooting on the move.', abilities: MARKSMANSHIP },
  { name: 'Mercy', source: 'Friar — Class', blurb: 'The body-mender’s kit, with no attacks at all: quiet, underpowered healing, blessings and saves, and the camp and social rites that keep a company whole.', abilities: MERCY },
  { name: 'Forbearance', source: 'Friar — Mendicant', blurb: 'The pacifist martyr’s discipline: binding Vows, Temp HP wrung from his own suffering, and the endurance to keep standing. Vows break only under compulsion — and stay lost until he Atones.', abilities: FORBEARANCE },
  { name: 'Spiritual', source: 'Friar — Confessor', blurb: 'The soul-mender and inquisitor — a debuffer who fights with Charisma against a foe’s Unarmoured Wisdom: softening strikes, a staggering rebuke, an area buff-purge, a burst of holy dread, an exorcism, and the means to wring out the truth.', abilities: SPIRITUAL },
  { name: 'Letters', source: 'Scholar — Class', blurb: 'Scholarship, half academic and half arcane literacy: research and recall, a clever Int-based blade, and the reading of scrolls, spellbooks and rituals. No spells of its own.', abilities: LETTERS },
  { name: 'Medicine', source: 'Scholar — Physician', blurb: 'The non-magical physician: a surgeon’s cuts and crafted poisons, a guarded stance, and hands-on healing — combat dressings, condition care, and the long convalescence — drawing on a Healer’s Kit.', abilities: MEDICINE },
  { name: 'New Magic', source: 'Scholar — Arcanist', blurb: 'The Collegium’s disciplined, destructive art — and a spell-builder. Each offensive chassis (ranged or close, single or burst) is bought with ONE element and a name of your choosing, then re-bought to make another spell. Dexterity vs AC aims every attack; Intelligence powers the damage. An element’s signature Effect ladder unlocks only with its Mastery — [type] feat, and four implements (wand, staff, spellbook, scroll) each lend a hook.', abilities: NEW_MAGIC },
  { name: 'The Lost', source: 'Scoundrel — Class', blurb: 'The outcast’s craft, built on one hard truth: a Scoundrel who is seen is a Scoundrel who is losing. The strike pays out only against a mark who is Off Guard or flanked, and everything else in the Category exists to buy that condition — the false move, the fistful of sand, the slip out of reach, and the art of vanishing in a city that would hang you.', abilities: THE_LOST },
  { name: 'Occult', source: 'Occultist — Class *(hosted by the Scoundrel’s Blackcoat)*', blurb: 'The dead, the spirits, and what may be asked of them — worked with Wisdom. Forbidden but benign: it draws on sources the church would burn you for, and uses them to see and to bless. It has no attacks. **The Price:** some Occult Abilities carry a special property called the Price — a negative effect on the user, applied when the Ability is used. Each Price is a ladder like any other and can be bought down. Curses, compulsion, the wasting, the bound shade, and power borrowed against a debt are not here: those belong to WITCHCRAFT, a Category still to come. Nor is speaking with the dead — that is no Ability but a rare and costly rite, found in play and the Game Master’s to give. Because the Occultist has no Letters to fall back on, Occult carries its own object-use, reused whole from the categories that own them — one per kind of found magic: Wield Artefact from Elder Magic; Read Scrolls, Read Spellbooks and Conduct Ritual from Letters.', abilities: OCCULT },
  { name: 'Guile', source: 'Scoundrel — Charlatan', blurb: 'The con man’s craft — Charisma against a foe’s nerve. A debuffer who works the whole fight from the back: a misdirection that turns a foe’s head and leaves it Off Guard for the party, a cutting remark that blunts its attacks, a blustering bravado that drops its guard, and the unshakeable confidence that keeps the Charlatan himself standing. Out of the fight, three social crafts — each a skill against a Defence: the long con for coin (Bluff), the parley for terms (Diplomacy), and Contionem habere, the harangue that steels allies with Temp HP before a fight (Intimidate).', abilities: GUILE },
  { name: 'Assassination', source: 'Scoundrel — Assassin', blurb: 'The studied kill. Study the Mark hangs a Studied marker on a target; the Death Blow — a rare, massive strike against a mark who is Studied and Off Guard — is the reward for setting it all up. Around it: the Physician’s Envenom (the same crafted-poison delivery, reused), a crippling anatomist’s cut, the garrote’s silent choke, a pointed interrogation that turns talk into a battle edge, and the trade’s least glamorous skill — leaving no trace. Dexterity plants every blade; Intelligence rides on the study.', abilities: ASSASSINATION },
  { name: 'Elder Magic', source: 'Scholar — Antiquarian', blurb: 'The recovered, fragmentary art of the Elders — subtle and controlling, worked by force of will (Charisma against a foe’s unguarded mind): the artefact engine, psychic dread, blinding, forced movement, outright domination, a withering doubt, and the ruin-delver’s craft. Every working carries a Feat Hook, for Elder magic comes only in studied fragments.', abilities: ELDER_MAGIC },
];
