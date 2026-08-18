// The Ability cards, grouped by Category, for the Abilities reference page.
// Each Ability is described in the AbilityCard data model (see ./abilities.ts).
// These four Categories are the Soldier's: Arms (Class), Protection
// (Vanguard), Leadership (Commander), Marksmanship (Marksman).

import type { Ability, Variable, NamedLadder } from './abilities';
import { actionCost, frequency } from './abilities';

export interface CategoryGroup {
  name: string;
  source: string;     // which Class/Subclass the category comes from
  blurb: string;
  abilities: Ability[];
}

// ── Shared building blocks ──────────────────────────────────────
// Rail 4/5: a ladder used by more than one card lives here as ONE const and is
// imported — never retyped. Two cards that read the same must BE the same
// object, so a change to the standard reaches every card that flies it. The
// Rail 4 lint (rails.test.ts) fails any two distinct objects with equal rungs.
//
// ── The Frequency standards ─────────────────────────────────────
//   FREQ_FULL       Daily → Encounter (M) → At-Will (M)
//   FREQ_ENC        Daily → Encounter (M)
//   FREQ_2ENC       Daily → Encounter (M) → Twice per Encounter (M)
//   FREQ_ATWILL_L3  Daily → Encounter (M) → At-Will (M, L3)
//   FREQ_ATWILL_L5  Daily → Encounter (M) → At-Will (M, L5)
//   FREQ_2ENC_L3    Daily → Encounter (M) → Twice per Encounter (M, L3)
//   FREQ_DAILY      Daily, and no more
//   FREQ_ENCOUNTER  Encounter, and no more
//   FREQ_PASSIVE    Passive — always on
const FREQ_FULL: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' }, { freq: 'at-will', cost: 'M' });
const FREQ_ENC: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' });
const FREQ_2ENC: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' }, { freq: 'encounter', uses: 2, cost: 'M' });
const FREQ_ATWILL_L3: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' }, { freq: 'at-will', cost: 'M', note: 'L3' });
const FREQ_ATWILL_L5: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' }, { freq: 'at-will', cost: 'M', note: 'L5' });
const FREQ_2ENC_L3: Variable = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' }, { freq: 'encounter', uses: 2, cost: 'M', note: 'L3' });
const FREQ_DAILY: Variable = frequency({ freq: 'daily' });
const FREQ_ENCOUNTER: Variable = frequency({ freq: 'encounter' });
const FREQ_PASSIVE: Variable = frequency({ freq: 'passive' });

// ── The Action standards ────────────────────────────────────────
// The in-turn action costs, named for their rungs. Anything outside the turn
// (rituals, rests, scenes, downtime) is bespoke per card by design — those
// read as prose and share no shape worth naming.
//
//   ACTION_STANDARD  Standard, and no cheaper
//   ACTION_SMM       Standard → Move (M) → Minor (M)
//   ACTION_MM        Move → Minor (M)
//   ACTION_MMF       Move → Minor (M) → Free (M)
//   ACTION_FULL_STD  Full Round → Standard (M)
//   ACTION_MINOR     Minor, and no cheaper
const ACTION_STANDARD: Variable = actionCost({ act: 'standard' });
const ACTION_SMM: Variable = actionCost({ act: 'standard' }, { act: 'move', cost: 'M' }, { act: 'minor', cost: 'M' });
const ACTION_MM: Variable = actionCost({ act: 'move' }, { act: 'minor', cost: 'M' });
const ACTION_MMF: Variable = actionCost({ act: 'move' }, { act: 'minor', cost: 'M' }, { act: 'free', cost: 'M' });
const ACTION_FULL_STD: Variable = actionCost({ act: 'full-round' }, { act: 'standard', cost: 'M' });
const ACTION_MINOR: Variable = actionCost({ act: 'minor' });

// A parameterised standard ladder (campTargets('Int'), ongoingDuration('Wis'))
// is still ONE ladder — two cards asking for the same attribute must get the
// same object, exactly as two cards importing STD_RANGE do. Without this each
// call would mint a fresh copy, and the Rail 4 lint could not tell a shared
// standard from a retyped one. Ladders are read-only data, so sharing is safe.
const shared = <T>(make: (arg: string) => T): ((arg: string) => T) => {
  const cache = new Map<string, T>();
  return (arg: string) => {
    if (!cache.has(arg)) cache.set(arg, make(arg));
    return cache.get(arg) as T;
  };
};

// The "power" damage Ladder shared by Power Attack and Marksman's Shot:
// +attribute baked into the base, two die-size steps, then double.
const powerDamage = shared((attr: string): Variable => ({
  base: `1[W] + ${attr}`,
  advances: [
    { value: `weapon one size larger, + ${attr}`, cost: 'm' },
    { value: `weapon two sizes larger, + ${attr}`, cost: 'm' },
    { value: `2[W] + ${attr}`, cost: 'M' },
  ],
}));

// The Strike damage Ladder shared by Martial Strike and Marking Strike.
const STRIKE_DAMAGE: Variable = {
  base: '1[W]',
  advances: [
    { value: '1[W] + 1', cost: 'm' },
    { value: '1[W] + Str', cost: 'm' },
    { value: '2[W]', cost: 'M', note: 'L5' },
  ],
};

// The Strike Ladder in shield form: the same shape (a flat +1, then Str, then
// double) climbing the shield's own die instead of a weapon's. Used by Shield
// Bash — the only Ability that strikes with the shield.
const SHIELD_DAMAGE: Variable = {
  base: '1[S]',
  advances: [
    { value: '1[S] + 1', cost: 'm' },
    { value: '1[S] + Str', cost: 'm' },
    { value: '2[S]', cost: 'M', note: 'L5' },
  ],
};

// The Daze Ladder — action denial, Dazed to Stunned. Shared by the Confessor's
// Rebuke, New Magic's Lightning & Sonic effect ladder, the Stupor Malediction,
// and the Botanist's Stupefying Fumes.
const DAZE_EFFECTS: Variable = {
  base: 'Dazed — no Reactions or Interrupts',
  advances: [
    { value: 'Dazed — no Reactions, Interrupts, or Minor Actions', cost: 'm' },
    { value: 'Dazed — no Reactions, Interrupts, Minor, or Move Actions', cost: 'm' },
    { value: 'Stunned — no actions', cost: 'M' },
  ],
};

// The Fear Ladder — a Fear debuff from hesitation to rout. Shared by the
// Confessor's Fly the Wicked, the Dread Malediction, and the Drymann's Warning.
const FEAR_EFFECTS: Variable = {
  base: '−1 to its attack rolls (Fear)',
  advances: [
    { value: '−1 to its attack rolls, and it cannot move closer to you (Fear)', cost: 'm' },
    { value: '−1 to its attack rolls, and it cannot move closer to you or attack you (Fear)', cost: 'm' },
    { value: 'It flees you until it Saves (Fear)', cost: 'M' },
  ],
};

// ── Standard Ongoing Damage ─────────────────────────────────────
// Ongoing damage is the most dangerous ladder in the game: it ignores DR (a
// tick isn't an attack) and repeats every round, so against small HP it is
// worth ~2× its face value. Per the small-numbers rule it stays tiny — the tick
// caps at 3, and the Major buys PERSISTENCE (a harder save), not a bigger
// number. Pair the amount (ongoingDamage) with the duration (ongoingDuration):
// the effect ends on a save OR when the round-cap runs out, whichever comes
// first; climbing the duration raises the cap, and its Major removes it (pure
// save-ends, no limit). `attr` is the attribute of the ability's Category/Subclass.
const ongoingDamage = shared((type: string): Variable => ({
  base: `Ongoing 1 ${type}`,
  advances: [
    { value: `Ongoing 2 ${type}`, cost: 'm' },
    { value: `Ongoing 3 ${type}`, cost: 'm' },
    { value: `Ongoing 3 ${type}, and −2 to the Save against it`, cost: 'M' },
  ],
}));
const ongoingDuration = shared((attr: string): Variable => ({
  base: `${attr} rounds, and Save ends`,
  advances: [
    { value: `${attr} + 1 rounds, and Save ends`, cost: 'm' },
    { value: `${attr} + 2 rounds, and Save ends`, cost: 'm' },
    { value: 'Save ends (no round limit)', cost: 'M' },
  ],
}));

// The Standard Range Ladder. Principle: a Major DOUBLES the reach (60' → 120'),
// while a Minor adds only a fraction (30' → 45' → 60', +15' a step). The big
// jump is what a Major buys. Shared by many Abilities; inlined replicas (e.g.
// the burst spells' range column) follow the same 30/45/60/120 shape. When a
// burst radius rides the range column, EVERY step prices as a Major — the
// area rule below outranks the range pricing.
const STD_RANGE: Variable = { base: "30'", advances: [{ value: "45'", cost: 'm' }, { value: "60'", cost: 'm' }, { value: "120'", cost: 'M' }] };

// The Standard Thrown Range Ladder (Les, Aug 2026) — for hurled things (flasks,
// fume-pots, stones): shorter than STD_RANGE, same shape — Minors add a step,
// the Major doubles. First used by Vitriol.
const STD_THROWN: Variable = { base: "10'", advances: [{ value: "20'", cost: 'm' }, { value: "30'", cost: 'm' }, { value: "60'", cost: 'M' }] };

// The Standard Camp Targets Ladder (Les, Aug 2026) — how many people a
// camp-scale ministration (a rest-time heal or tending) can cover. `attr` is
// the tending Category's attribute. Shared by the Friar's, Physician's, and
// Drymann's camp heals.
const campTargets = shared((attr: string): Variable => ({
  base: '1 patient',
  advances: [
    { value: `${attr} patients`, cost: 'm' },
    { value: `${attr} + 1 patients`, cost: 'm' },
    { value: 'All in his company', cost: 'M' },
  ],
}));

// The Standard Burst Range Ladder — for a burst thrown at range, where the
// reach and the radius grow together. It rides the `range` column and every
// step is a Major, because the area rule outranks the range pricing (see
// STD_RANGE). Shared by Globus Eminus and Figments of Forgotten Places.
const STD_BURST_RANGE: Variable = {
  base: "30' (5' burst)",
  advances: [
    { value: "45' (10' burst)", cost: 'M' },
    { value: "60' (15' burst)", cost: 'M' },
    { value: "120' (20' burst)", cost: 'M' },
  ],
};

// The Bleed Ladder — ongoing damage bought on a strike that already hits hard,
// so it starts at nothing and every step is a Major. Shared by Sneak Attack
// and Death Blow.
const BLEED_EFFECTS: Variable = {
  base: 'None',
  advances: [
    { value: 'Bleed 1', cost: 'M' },
    { value: 'Bleed 2', cost: 'M' },
  ],
};

// The Standard Scene Duration Ladder — for effects that last a scene rather
// than a fight (a sense opened, a spirit held). Minors stretch it, the Major
// jumps to the hour. Shared by Third Eye and Bind Spirit.
const STD_SCENE_DURATION: Variable = {
  base: '1 minute',
  advances: [
    { value: '5 minutes', cost: 'm' },
    { value: '10 minutes', cost: 'm' },
    { value: '1 hour', cost: 'M' },
  ],
};

// The Standard Several-Targets Ladder — counting up one at a time, then the
// Major opens it to a small area. Shared by the Antiquarian's two whispers.
const STD_FEW_TARGETS: Variable = {
  base: 'One',
  advances: [
    { value: 'Two', cost: 'm' },
    { value: 'Three', cost: 'm' },
    { value: "All in a 10' radius", cost: 'M' },
  ],
};

// The Shepherd's guard-dog Action Ladder — a Reaction after an enemy closes on
// an ally, upgraded by a Minor to an Interrupt that stops the approach itself.
// Shared by Turn the Wolf and Ward the Fold.
const ACTION_WARD_REACTION: Variable = actionCost(
  { act: 'reaction', trigger: 'at the end of an opponent’s move, only if it moved closer to or adjacent to an ally' },
  { act: 'interrupt', trigger: 'at any point during an opponent’s move, if it attempted to move closer or adjacent to an ally', cost: 'm' },
);

// The Standard Area Ladder — the radius of a burst. EVERY step is a Major:
// growing the radius sweeps in far more targets, so each increase is worth a
// Major on its own. Sits in the `targets` field (who the effect catches).
const STD_AREA: Variable = {
  base: "All enemies in a 5' radius",
  advances: [
    { value: "All enemies in a 10' radius", cost: 'M' },
    { value: "All enemies in a 15' radius", cost: 'M' },
    { value: "All enemies in a 20' radius", cost: 'M' },
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
  'Staves → +1 to one of your Defences until your next turn',
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
const GA_SPECIALIZATION = (item: string, feat: string): string =>
  `Additionally, with the ${feat} Feat you gain a second Generic Advances Ladder — apply it to a second variable the ${item} allows.`;

// Shared by Wield Orb and Wield Artefact — the two are near-identical. An
// implement holds power(s) with their own ladders; you get Rank 1 of a power,
// and deepen ONE of its ladders by improving this Ability. (The Generic Advances
// Ladder on the card improves ADDITIONAL ladders.) `impl` is 'Orb' or 'Artefact'.
const WIELD_EFFECTS = shared((impl: string): Variable => ({
  base: `You understand the nature of ${impl}s and can identify what power(s) they contain, and you can use those powers.`,
  advances: [
    { value: `You can identify and use ${impl} powers, and improve one of a power’s Ladders (Range, Damage, Effect, …) by 1 Rank`, cost: 'm' },
    { value: `You can identify and use ${impl} powers, and improve one of a power’s Ladders by 2 Ranks`, cost: 'm' },
    { value: `You can identify and use ${impl} powers, and improve one of a power’s Ladders by 3 Ranks`, cost: 'M' },
  ],
}));

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
      action: ACTION_STANDARD,
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
      action: ACTION_STANDARD,
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
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: { base: 'On a hit, +1 to one of your Defences until your next turn.', advances: [{ value: 'On a hit, +2 to one of your Defences until your next turn', cost: 'm' }] },
      duration: { base: 'Until your next turn' },
    },
    options: [
      { label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Shields → +1 additional Defence'] },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Staves → shove the attacker, or +1 Defence against them'] },
    ],
  },
  {
    name: 'Parry', category: 'Arms', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'move' }, { act: 'minor', cost: 'M' }, { act: 'interrupt', trigger: 'when you are hit by an attack', cost: 'M' }),
      range: { base: 'Self' },
      effects: {
        base: 'Reduce the next incoming damage by 2.',
        advances: [
          { value: 'Reduce the next incoming damage by 3', cost: 'm' },
          { value: 'Reduce the next incoming damage by 4', cost: 'm' },
          { value: 'Reduce the next incoming damage by 4, and make a Melee Basic Attack (riposte)', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → the riposte unlocks at Rank 3, and adds damage'] }],
  },
  {
    name: 'Disarming Strike', category: 'Arms', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs Armoured Dexterity' },
      damage: { base: '1[W]' },
      effects: {
        base: 'Target takes −1 to hit.',
        advances: [
          { value: 'Target takes −2 to hit', cost: 'm' },
          { value: 'Target takes −2 to hit, and must spend a Minor Action to re-grip its weapon', cost: 'm' },
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
      action: ACTION_MMF,
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
      action: ACTION_MMF,
      range: { base: 'Self' },
      effects: { base: 'While raised, apply your shield’s DR to incoming attack damage — DR you do not get passively. (Requires a shield equipped.)' },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Measure the Foe', category: 'Arms', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENCOUNTER,
      action: actionCost({ act: 'minor', detail: 'instant out of combat' }),
      range: { base: '30\'', advances: [{ value: '60\'', cost: 'm' }] },
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }] },
      effects: {
        base: 'Learn the creature’s HP tier and its highest Offence or softest Defence.',
        advances: [{ value: 'Learn the creature’s HP tier, its highest Offence, and all of its Defences', cost: 'm' }],
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
      action: ACTION_MM,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: SHIELD_DAMAGE,
      effects: DAZE_EFFECTS,
      duration: { base: 'Save ends' },
    },
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ["Light Shields → Push 5'", "Heavy Shields → Push 5' or Prone"] }],
  },
  {
    name: 'Marking Strike', category: 'Protection', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Strength vs AC' },
      damage: STRIKE_DAMAGE,
      effects: { base: 'Target is Marked (−1 to attack anyone but you).', advances: [{ value: 'Target is Marked (−2 to attack anyone but you)', cost: 'm' }] },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Sentinel Strike', category: 'Protection', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One (attack)' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: {
        base: 'On a hit, one ally gains +1 AC.',
        advances: [
          { value: 'On a hit, you and one ally gain +1 AC', cost: 'm' },
          { value: 'On a hit, you and one ally gain +2 AC', cost: 'm' },
          { value: 'On a hit, you and all adjacent allies gain +2 AC', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Light / Heavy Shields → apply your Shield’s DR to everyone this protects'] }],
  },
  {
    name: 'Guard', category: 'Protection', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ATWILL_L5,
      action: actionCost({ act: 'move' }, { act: 'minor', cost: 'M' }, { act: 'interrupt', trigger: 'when you or an adjacent ally is hit by an attack', cost: 'M' }),
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
    name: 'Intercept', category: 'Protection', role: 'Defensive · manoeuvre', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'reaction', trigger: 'when an adjacent ally is hit' }),
      range: { base: 'Adjacent ally' },
      effects: {
        base: 'Trade places with the endangered ally, then take the damage in their stead.',
        advances: [
          { value: 'Trade places with the endangered ally, then take the damage in their stead, reduced by your Armour DR', cost: 'm' },
          { value: 'Trade places with the endangered ally; the attack is made against you instead, resolved normally — it may miss your Defences entirely', cost: 'm' },
          { value: 'Trade places with an endangered ally up to 10\' (2 squares) away; the attack is made against you instead, resolved normally — it may miss your Defences entirely', cost: 'M' },
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
      action: ACTION_MM,
      range: { base: 'Self' },
      effects: {
        base: 'Gain 2 Temp HP.',
        advances: [
          { value: 'Gain 3 Temp HP', cost: 'm' },
          { value: 'Gain 4 Temp HP', cost: 'm' },
          { value: 'Gain 5 Temp HP and +1 DR for 1 round', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Armour Specialization Hooks', note: ARMOUR_HOOK_NOTE, detail: ['Medium Armour → +2 Temp HP', 'Heavy Armour → +3 Temp HP'] }],
  },
  {
    name: 'Stand Watch', category: 'Protection', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest' }),
      effects: {
        base: 'You cannot be surprised on your watch (2 hours); +1 Perception.',
        advances: [
          { value: 'You cannot be surprised on your watch (4 hours); +1 Perception', cost: 'm' },
          { value: 'You cannot be surprised on your watch (6 hours); +1 Perception', cost: 'm' },
          { value: 'You cannot be surprised on your watch (8 hours); +2 Perception', cost: 'M' },
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
      frequency: FREQ_ATWILL_L5,
      action: ACTION_SMM,
      range: { base: 'One ally in range' },
      targets: { base: 'One ally' },
      effects: {
        base: 'An ally makes a basic attack for free.',
        advances: [
          { value: 'An ally makes a basic attack for free, at +1 to hit', cost: 'm' },
          { value: 'An ally makes a basic attack for free, at +2 to hit', cost: 'm' },
          { value: 'An ally may take any Standard Action for free; if it is an attack, +2 to hit', cost: 'M', note: 'L3' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Commander’s Strike', category: 'Leadership', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One (struck); buffs all allies' },
      attack: { base: 'Strength vs AC' },
      damage: { base: '1[W]' },
      effects: {
        base: 'Until next round, all allies gain +1 to hit the struck target.',
        advances: [
          { value: 'Until next round, all allies gain +1 to hit and damage against the struck target', cost: 'm' },
          { value: 'Until next round, all allies gain +2 to hit and damage against the struck target', cost: 'm' },
          { value: 'Until next round, all allies gain +2 to hit and damage against the struck target, and one adjacent ally may make a Melee Basic Attack against it', cost: 'M' },
        ],
      },
      duration: { base: 'Until next round' },
    },
  },
  {
    name: 'Focus Fire', category: 'Leadership', role: 'Offensive', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_SMM,
      range: { base: 'One enemy in range' },
      targets: { base: 'One enemy (no attack roll — just designate)' },
      effects: {
        base: 'Until next round, all allies gain +1 to hit the designated target.',
        advances: [
          { value: 'Until next round, all allies gain +1 to hit and damage against the designated target', cost: 'm' },
          { value: 'Until next round, all allies gain +2 to hit and damage against the designated target', cost: 'm' },
          { value: 'Until next round, all allies gain +2 to hit and damage against the designated target, and one ally may make a Ranged Basic Attack against it', cost: 'M' },
        ],
      },
      duration: { base: 'Until next round' },
    },
  },
  {
    name: 'Resolute Strike', category: 'Leadership', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Melee or Ranged' },
      targets: { base: 'One (struck); allies within 10\'' },
      attack: { base: 'Weapon (Str / Dex) vs AC' },
      damage: { base: '1[W]' },
      effects: {
        base: 'On a hit, allies within 10\' gain +1 AC vs that opponent’s attacks of the type you used (melee or ranged).',
        advances: [
          { value: 'On a hit, allies within 10\' gain +1 to all Defences vs that opponent', cost: 'm' },
          { value: 'On a hit, allies within 10\' gain +1 to all Defences vs all opponents', cost: 'm' },
          { value: 'On a hit, allies within 10\' gain +2 to all Defences vs all opponents', cost: 'M' },
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
      action: ACTION_SMM,
      range: { base: 'Allies within 10\' (widens)' },
      effects: {
        base: 'Allies within 10\' gain +1 to all Defences until your next turn.',
        advances: [
          { value: 'Allies within 20\' gain +1 to all Defences until your next turn', cost: 'm' },
          { value: 'Allies within 30\' gain +1 to all Defences until your next turn', cost: 'm' },
          { value: 'Allies within 30\' gain +1 to all Defences until your next turn, and 2 Temp HP', cost: 'M', note: 'L5' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'War Cry', category: 'Leadership', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: actionCost({ act: 'standard' }, { act: 'move', cost: 'M' }, { act: 'minor', cost: 'M' }, { act: 'free', cost: 'M', note: 'L5' }),
      range: { base: 'Allies within 10\' (widens)' },
      effects: {
        base: 'Allies within 10\' gain +1 to hit on all attacks until your next turn.',
        advances: [
          { value: 'Allies within 20\' gain +1 to hit on all attacks until your next turn', cost: 'm' },
          { value: 'Allies within 30\' gain +1 to hit on all attacks until your next turn', cost: 'm' },
          { value: 'Allies within 30\' gain +1 to hit and +2 damage on all attacks until your next turn', cost: 'M', note: 'L3' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Inspiring Word', category: 'Leadership', role: 'Rally / heal', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_MM,
      range: { base: 'Up to 30\'' },
      targets: {
        base: '1 ally (≤30\')',
        advances: [
          { value: '2 allies (≤30\')', cost: 'm' },
          { value: '3 allies (≤30\')', cost: 'm' },
          { value: 'All allies within hearing range', cost: 'M' },
        ],
      },
      effects: {
        base: 'The ally may immediately attempt to shake a Condition.',
        advances: [
          { value: 'The ally may immediately attempt to shake a Condition, with +1', cost: 'm' },
          { value: 'The ally may immediately attempt to shake a Condition, with +2', cost: 'm' },
          { value: 'The ally may immediately attempt to shake a Condition, with +2, and gains 2 Temp HP', cost: 'M' },
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
      action: ACTION_STANDARD,
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
      action: ACTION_STANDARD,
      range: { base: '1×WRI' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: 'W' },
      effects: {
        base: 'Movement: −5\' Speed.',
        advances: [
          { value: 'Movement: −10\' Speed', cost: 'm' },
          { value: 'Movement: −15\' Speed', cost: 'm' },
          { value: 'Immobilized', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends (Con Save vs the attacker’s Dex Offence)' },
    },
  },
  {
    name: 'Skirmishing Shot', category: 'Marksmanship', role: 'Offensive + Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_STANDARD,
      range: { base: '1×WRI' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: 'W' },
      effects: {
        base: 'On a hit, shift 5\' and gain +1 to a Defence until your next turn.',
        advances: [
          { value: 'On a hit, shift 10\' and gain +1 to a Defence until your next turn', cost: 'm' },
          { value: 'On a hit, shift 10\' and gain +2 to a Defence until your next turn', cost: 'm' },
        ],
      },
      duration: { base: 'Until your next turn' },
    },
  },
  {
    name: 'Covering Fire', category: 'Marksmanship', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'interrupt', trigger: 'when an enemy in range attacks an ally' }),
      range: { base: 'Weapon range' },
      effects: {
        base: '−1 to that attack.',
        advances: [
          { value: '−2 to that attack', cost: 'm' },
          { value: '−2 to that attack and any other attacks from that target until the end of next round', cost: 'm' },
          { value: '−2 to that attack and any other attacks from that target until the end of next round, and you make a Ranged Basic Attack against the target', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Run and Gun', category: 'Marksmanship', role: 'Movement', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_STANDARD,
      effects: {
        base: 'Shift 5\'.',
        advances: [
          { value: 'Shift 5\' and +1 to a chosen Defence until the end of your turn', cost: 'm' },
          { value: 'Shift 5\' and +2 to a chosen Defence until the end of your turn', cost: 'm' },
          { value: 'Shift 10\' and +2 to all Defences until the end of your turn', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Debilitating Shot', category: 'Marksmanship', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_STANDARD,
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
        base: '−1 to a chosen Defence.',
        advances: [
          { value: '−2 to a chosen Defence', cost: 'm' },
          { value: '−2 to a chosen Defence, and Vulnerable 1', cost: 'm' },
          { value: '−2 to a chosen Defence, and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends (Con Save vs the attacker’s Dex Offence)' },
    },
  },
  {
    name: 'Marksman’s Eye', category: 'Marksmanship', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'check', check: 'Perception' }),
      effects: {
        base: '+1 on Perception rolls to spot things up to 50\' away.',
        advances: [
          { value: '+1 on Perception rolls to spot things up to 100\' away', cost: 'm' },
          { value: '+1 on Perception rolls to spot things up to 200\' away', cost: 'm' },
          { value: '+2 on Perception rolls to spot things up to 1000\' away', cost: 'M' },
        ],
      },
    },
  },
];

// ── Mercy (Friar — Class) ───────────────────────────────────────
// The Friar's healer kit: no attacks at all. Healing is deliberately
// underpowered; most cards do their work through the Effect(s) row.

const MERCY: Ability[] = [
  {
    name: 'Mending Touch', category: 'Mercy', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Heal Wis HP.',
        advances: [
          { value: 'Heal Wis + 1 HP', cost: 'm' },
          { value: 'Heal Wis + 2 HP', cost: 'm' },
          { value: 'Heal Wis + 1d6 HP, and the target may make one Save of their choice against any Condition affecting them', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Stabilize', category: 'Mercy', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Reduce the damage from one ongoing-damage Condition (Bleed, Poison, etc.) by 1. A touch also stabilises a dying creature — it stops dying. (Bodily Conditions only.)',
        advances: [
          { value: 'Reduce the damage from one ongoing-damage Condition by 2. A touch also stabilises a dying creature. (Bodily Conditions only.)', cost: 'm' },
          { value: 'Reduce the damage from one ongoing-damage Condition by 3. A touch also stabilises a dying creature. (Bodily Conditions only.)', cost: 'm' },
          { value: 'End one ongoing-damage Condition completely. A touch also stabilises a dying creature. (Bodily Conditions only.)', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Blessing', category: 'Mercy', role: 'Buff', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
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
        base: '+1 to all Saves.',
        advances: [
          { value: '+2 to all Saves', cost: 'm' },
          { value: '+2 to all Saves, and the target may attempt a Save now', cost: 'm' },
          { value: '+2 to all Saves, and the target may attempt a Save now — if it succeeds, immunity to that effect for the encounter', cost: 'M' },
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
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'ritual', detail: 'during a rest' }),
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
        base: 'Grant 1 Reroll, shared by the blessed, on any d20 roll.',
        advances: [
          { value: 'Grant 2 Rerolls, shared by the blessed, on any d20 roll', cost: 'm' },
          { value: 'Grant 3 Rerolls, shared by the blessed, on any d20 roll', cost: 'm' },
          { value: 'Each blessed ally gets their own Reroll', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next rest' },
    },
  },
  {
    name: 'Preach to the Saintly', category: 'Mercy', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'scene', combat: 'standard', detail: 'a few minutes of preaching' }),
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
          { value: 'Make a Religion (Saintly Faith) check, DC 10 (a friendly Saintly gathering) up to 20 (strangers in a strange land). On a success, NPC Attitude improves two steps and/or hireling Morale improves two steps. Never works on Hostile NPCs.', cost: 'M' },
        ],
      },
      duration: { base: 'The scene' },
    },
  },
  {
    name: 'Tend the Wounded', category: 'Mercy', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest', detail: 'a ministration' }),
      range: { base: 'Those resting in camp' },
      targets: campTargets('Wis'),
      effects: {
        base: 'Tended allies recover an extra Wis HP on the rest, and may make one Save against a bodily affliction (+0). Bodily afflictions only.',
        advances: [
          { value: 'Tended allies recover an extra Wis + 1 HP on the rest, and may make one Save against a bodily affliction (+1)', cost: 'm' },
          { value: 'Tended allies recover an extra Wis + 2 HP on the rest, and may make one Save against a bodily affliction (+2)', cost: 'm' },
          { value: 'Tended allies recover an extra Wis + 1d6 HP on the rest, may make a Save against each bodily affliction (+2), and heal 1 point of Int, Wis or Cha Attribute Damage', cost: 'M' },
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
// The Martyr Temp HP Ladder — shared by Flesh of the Martyr and Nimbus of the Martyr.
const MARTYR_TEMP_HP: Variable = {
  base: 'Grant Con Temp HP.',
  advances: [
    { value: 'Grant Con + 1 Temp HP', cost: 'm' },
    { value: 'Grant Con + 2 Temp HP', cost: 'm' },
    { value: 'Grant Con + 2 Temp HP, and heal 1 HP', cost: 'M' },
  ],
};

const FORBEARANCE: Ability[] = [
  {
    name: 'Vow of Mercy', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: 'Any Ability you use that heals or grants Temp HP to allies is +1. The Vow: you may never willingly bear arms, make an attack roll, harm an ally, or allow an ally to come to harm if you can prevent it.',
        advances: [{ value: 'Any Ability you use that heals or grants Temp HP to allies is +2. The Vow: you may never willingly bear arms, make an attack roll, harm an ally, or allow an ally to come to harm if you can prevent it.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Vow of Poverty', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'defenceMod', value: 1 }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to all Armoured and Unarmoured Defences. The Vow: you may not accumulate personal wealth — nothing beyond the clothes on your back and the instruments of healing and your Saintly office.',
        advances: [{ value: '+2 to all Armoured and Unarmoured Defences. The Vow: you may not accumulate personal wealth — nothing beyond the clothes on your back and the instruments of healing and your Saintly office.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Vow of Abstinence', category: 'Forbearance', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'saveMod', value: 1 }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to all Saves. The Vow: you may never imbibe alcohol, tobacco, or similar substances, nor drink potions or willingly receive any healing or magical benefit that is not from a Saintly source.',
        advances: [{ value: '+2 to all Saves. The Vow: you may never imbibe alcohol, tobacco, or similar substances, nor drink potions or willingly receive any healing or magical benefit that is not from a Saintly source.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Flesh of the Martyr', category: 'Forbearance', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: actionCost({ act: 'reaction', trigger: 'when you take at least 1 damage (to Temp HP or normal HP)' }),
      targets: {
        base: 'One ally',
        advances: [
          { value: 'Two allies within 10\'', cost: 'm' },
          { value: 'Two allies within 20\'', cost: 'm' },
          { value: 'All allies visible', cost: 'M' },
        ],
      },
      effects: MARTYR_TEMP_HP,
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
      effects: MARTYR_TEMP_HP,
      duration: {
        base: 'Temp HP vanish at the end of the encounter',
        advances: [{ value: 'Temp HP last until a long rest', cost: 'M', note: 'L3' }],
      },
    },
  },
  {
    name: 'Endurance of the Saintly', category: 'Forbearance', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M', note: 'L5' }),
      action: ACTION_SMM,
      targets: { base: 'Self' },
      effects: {
        base: 'While active, you cannot be reduced below 1 HP.',
        advances: [
          { value: 'While active, you cannot be reduced below 1 HP, and ongoing damage you take is reduced by 1', cost: 'm' },
          { value: 'While active, you cannot be reduced below 1 HP, and ongoing damage you take is reduced by 2', cost: 'm' },
          { value: 'While active, you cannot be reduced below 1 HP, ongoing damage you take is reduced by 2, and you shrug off (end) one Condition on you each round', cost: 'M' },
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
      frequency: FREQ_PASSIVE,
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
          { value: 'Ignore the ill effects of hunger, thirst, exposure to weather, and fatigue from forced marches', cost: 'm' },
          { value: 'Ignore the ill effects of hunger, thirst, exposure to weather, and forced marches, and need only half the normal provisions and rest', cost: 'm' },
          { value: 'Ignore the ill effects of hunger, thirst, exposure to weather, and forced marches, and need only half the normal provisions and rest; the company may push a longer day\'s travel with no penalty, and shrugs one environmental hazard', cost: 'M' },
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
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Charisma vs AC (Light Blade or Mace)' },
      damage: { base: '1[W]', advances: [{ value: '1[W] + Cha', cost: 'm' }] },
      effects: {
        base: '−1 to all the target’s Defences.',
        advances: [
          { value: '−2 to all the target’s Defences', cost: 'm' },
          { value: '−2 to all the target’s Defences, and Vulnerable 1', cost: 'm' },
          { value: '−2 to all the target’s Defences, and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Rebuke', category: 'Spiritual', role: 'Offensive · debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: actionCost({ act: 'standard' }, { act: 'move', cost: 'M' }, { act: 'minor', cost: 'M' }, { act: 'free', cost: 'M' }),
      range: { base: '30\'' },
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: DAZE_EFFECTS,
      duration: { base: 'Save ends' },
    },
  },
  {
    name: "Kerrigan's Prayer", category: 'Spiritual', role: 'Debuff · dispel', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: STD_RANGE,
      targets: STD_AREA,
      effects: {
        base: 'All opponents lose all Temp HP.',
        advances: [
          { value: 'All opponents lose all Temp HP, and 1 beneficial effect (your choice)', cost: 'm' },
          { value: 'All opponents lose all Temp HP and all beneficial effects', cost: 'm' },
          { value: 'All opponents lose all Temp HP and all beneficial effects, and can gain no new buffs or Temp HP (Save ends)', cost: 'M' },
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
      range: { base: 'Close burst, centred on you' },
      targets: STD_AREA,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: FEAR_EFFECTS,
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Vow of Nicetus', category: 'Spiritual', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to attack rolls and Skill checks against the Black Faith, Demons, Devils, and Undead. The Vow: never knowingly suffer a creature of the Black Faith to pass unopposed — neither aid, shelter, nor parley with them.',
        advances: [{ value: '+2 to attack rolls and Skill checks against the Black Faith, Demons, Devils, and Undead. The Vow: never knowingly suffer a creature of the Black Faith to pass unopposed — neither aid, shelter, nor parley with them.', cost: 'M', note: 'L5' }],
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
        base: 'Reduce the target’s Control Condition by one Rank.',
        advances: [
          { value: 'Reduce by two Ranks', cost: 'm' },
          { value: 'End the Control Condition entirely', cost: 'm' },
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
      action: actionCost({ act: 'scene', combat: 'standard', detail: 'a few minutes of questioning' }),
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
// same cards in both lists. The Scholar's Subclasses get their literacy from Letters;
// the Occultist has no Letters, so Occult must carry its own.
const READ_SCROLLS: Ability = {
  name: 'Read Scrolls', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    frequency: FREQ_2ENC_L3,
    action: ACTION_FULL_STD,
    attack: { base: 'Int (+ Scroll Specialization) vs the spell’s Defence' },
    effects: {
      base: 'Read only — identify a scroll’s spell. You must know its language (e.g. the Elder Arcana Tongue).',
      advances: [
        { value: 'Identify and cast Lesser spells from a scroll (consumed on use). You must know its language.', cost: 'm' },
        { value: 'Identify and cast Lesser and Greater spells from a scroll (consumed on use). You must know its language.', cost: 'M', note: 'L5' },
      ],
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('scroll'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_SPECIALIZATION('scroll', 'Scroll Specialization') },
  ],
  extraVars: [SCRIBE_CREATE],
};

const READ_SPELLBOOKS: Ability = {
  name: 'Read Spellbooks', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    frequency: FREQ_2ENC_L3,
    action: ACTION_FULL_STD,
    attack: { base: 'Int (+ Spellbook Specialization) vs the spell’s Defence' },
    effects: {
      base: 'Read only — identify a spellbook’s spell. You must know its language. (Reusable; supply the components each casting.)',
      advances: [
        { value: 'Identify and cast Lesser spells from a spellbook. You must know its language. (Reusable; supply the components each casting.)', cost: 'm' },
        { value: 'Identify and cast Lesser and Greater spells from a spellbook. You must know its language. (Reusable; supply the components each casting.)', cost: 'M', note: 'L5' },
      ],
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('spellbook'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_SPECIALIZATION('spellbook', 'Spellbook Specialization') + ' A Spellbook Specialist also adds Int to a damaging spell’s damage.' },
  ],
  extraVars: [SCRIBE_CREATE],
};

const CONDUCT_RITUAL: Ability = {
  name: 'Conduct Ritual', category: 'Letters', role: 'Magic literacy', mode: 'Effect',
  vars: {
    frequency: frequency({ freq: 'uncapped', detail: 'as often as you have scrolls, time, and components' }),
    action: actionCost({ act: 'varies', detail: 'the ritual’s own casting time' }),
    effects: {
      base: 'Anyone with the materials and the language may perform a ritual at its base. Conduct Ritual lets you improve one, applying your Generic Advances (below) to its variables — e.g. shortening its casting time.',
    },
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('ritual'), ladders: [GENERIC_ADV] },
    { label: 'Ritual Specialization Hooks', note: GA_SPECIALIZATION('ritual', 'Ritual Specialization') + ' A Ritual Specialist also gains +1 to any d20 roll for the ritual.' },
  ],
  extraVars: [
    { name: 'Participant Ladder', base: '—', advances: [{ value: 'Improved one degree (more effect from fewer participants)', cost: 'M' }] },
    SCRIBE_CREATE,
  ],
};

// Research and Recall — the scholar's study and memory. Shared verbatim by
// Letters (the Scholar's class category) and Botany (the Naturalist's
// Botanist): the Naturalist has no Letters, so his schooled Subclass carries them.
const RESEARCH: Ability = {
  name: 'Research', category: 'Letters', role: 'Utility · non-combat', mode: 'Effect',
  vars: {
    frequency: frequency({ freq: 'uncapped', detail: 'limited by time' }),
    action: actionCost({ act: 'downtime', time: '8 hours', detail: 'of study' }, { act: 'downtime', time: '6 hours', detail: 'of study', cost: 'm' }, { act: 'downtime', time: '4 hours', detail: 'of study', cost: 'm' }, { act: 'downtime', time: '1 hour', detail: 'of study', cost: 'M' }),
    effects: {
      base: 'With relevant written sources, make a Knowledge Skill check vs a GM-set DC, with a +1 research bonus.',
      advances: [
        { value: 'With relevant written sources, make a Knowledge Skill check vs a GM-set DC, with a +2 research bonus', cost: 'm' },
        { value: 'With relevant written sources, make a Knowledge Skill check vs a GM-set DC, with a +3 research bonus', cost: 'm' },
        { value: 'With relevant written sources, make a Knowledge Skill check vs a GM-set DC, with a +3 research bonus and a Reroll', cost: 'M' },
      ],
    },
  },
};

const RECALL: Ability = {
  name: 'Recall', category: 'Letters', role: 'Utility', mode: 'Effect',
  vars: {
    // Daily→Encounter as a MINOR is deliberate (Les, Aug 2026) — a mercy for
    // this utility card; everywhere else that step prices as a Major.
    frequency: frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'm' }, { freq: 'encounter', uses: 2, cost: 'M' }),
    action: actionCost({ act: 'standard' }, { act: 'move', cost: 'm' }, { act: 'minor', cost: 'm' }, { act: 'free', cost: 'M' }),
    effects: {
      base: 'Make a Knowledge Skill check to recall a detail relevant to the situation or foe.',
      advances: [
        { value: 'Make a Knowledge Skill check at +1 to recall a detail relevant to the situation or foe', cost: 'm' },
        { value: 'Make a Knowledge Skill check at +2 to recall a detail relevant to the situation or foe', cost: 'm' },
        { value: 'Make a Knowledge Skill check at +2, with a Reroll, to recall a detail relevant to the situation or foe', cost: 'M' },
      ],
    },
  },
};

const LETTERS: Ability[] = [
  RESEARCH,
  {
    name: 'Scholar’s Strike', category: 'Letters', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Intelligence vs AC' },
      damage: { base: '1[W] (fixed)' },
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: ['Light Blades → +1 to hit', 'Staves → +1 to one of your Defences until your next turn'] }],
  },
  {
    name: 'Evade', category: 'Letters', role: 'Defensive · mobility', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: { base: 'One engaging opponent' },
      targets: { base: 'One' },
      attack: {
        base: 'Intelligence vs Unarmoured Wisdom',
        advances: [
          { value: 'Intelligence vs Unarmoured Wisdom (+1 to the roll)', cost: 'm' },
          { value: 'Intelligence vs Unarmoured Wisdom (+2 to the roll)', cost: 'm' },
          { value: 'Intelligence vs Unarmoured Wisdom (+2 to the roll; the Shift becomes 10\')', cost: 'M' },
        ],
      },
      effects: { base: 'On a hit, Shift 1 (5\'); the opponent may not use a Reaction to this movement.' },
      duration: { base: 'Instant' },
    },
  },
  RECALL,
  READ_SCROLLS,
  READ_SPELLBOOKS,
  CONDUCT_RITUAL,
  {
    name: 'Identify', category: 'Letters', role: 'Magic literacy · utility', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'uncapped' }),
      action: actionCost({ act: 'scene', detail: 'a few minutes of study' }),
      effects: {
        base: 'An Arcana check vs the object’s DC reveals it is magical, its tradition, and its level.',
        advances: [
          { value: 'An Arcana check vs the object’s DC reveals it is magical, its tradition, its level, and its function', cost: 'm' },
          { value: 'An Arcana check vs the object’s DC reveals it is magical, its tradition, its level, its function, and how to use it — command words, components, charges', cost: 'm' },
          { value: 'An Arcana check vs the object’s DC reveals it is magical, its tradition, its level, its function, how to use it, and its flaws and secrets — curses, hidden properties, maker', cost: 'M' },
        ],
      },
    },
  },
];

// ── Medicine (Scholar — Physician) ──────────────────────────────
// Non-magical: a surgeon’s cuts and crafted poisons, a guarded stance,
// and hands-on healing that draws on a Healer’s Kit and its Supplies.
// Envenom — the crafted-poison delivery. Shared verbatim by the Physician
// (Medicine), the Assassin (Assassination), and the Botanist (Botany): the
// same card in all three lists.
const ENVENOM: Ability = {
  name: 'Envenom', category: 'Medicine', role: 'Offensive', mode: 'Attack',
  vars: {
    frequency: FREQ_FULL,
    action: actionCost({ act: 'standard', detail: 'coats the blade and attacks in one (no Wis check)' }),
    range: { base: 'Reach' },
    targets: { base: 'One' },
    attack: { base: 'Intelligence vs AC (Light Blade)' },
    damage: { base: '1[W]' },
    effects: {
      base: 'Delivers the crafted poison of your choice (you must have a full dose).',
      advances: [
        { value: 'Delivers the crafted poison of your choice, at +1 to the poison’s DC', cost: 'm' },
        { value: 'Delivers the crafted poison of your choice, at +1 to the poison’s DC and +1 Interval', cost: 'm' },
        { value: 'Delivers the crafted poison of your choice, at +2 to the poison’s DC and +2 Intervals', cost: 'M' },
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
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Intelligence vs AC (Light Blade)' },
      damage: { base: '1[W] (fixed)' },
      effects: ongoingDamage('Bleed'),
      duration: ongoingDuration('Int'),
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
      frequency: FREQ_2ENC,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Heal Int HP. (Requires a Healer’s Kit; spends 1 Supply.)',
        advances: [
          { value: 'Heal Int + 1 HP. (Healer’s Kit; 1 Supply.)', cost: 'm' },
          { value: 'Heal Int + 2 HP. (Healer’s Kit; 1 Supply.)', cost: 'm' },
          { value: 'Heal Int + 1d6 HP. (Healer’s Kit; 1 Supply.)', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Field Medicine', category: 'Medicine', role: 'Healing', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_SMM,
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'Reduce one bodily Condition, ongoing damage, or poison by 1 Rank. A touch also stabilises a dying creature. (Healer’s Kit; 1 Supply.)',
        advances: [
          { value: 'Reduce one bodily Condition, ongoing damage, or poison by 2 Ranks. A touch also stabilises a dying creature. (Healer’s Kit; 1 Supply.)', cost: 'm' },
          { value: 'End one bodily Condition, ongoing damage, or poison entirely. A touch also stabilises a dying creature. (Healer’s Kit; 1 Supply.)', cost: 'm' },
          { value: 'End one bodily Condition, ongoing damage, or poison entirely, and the target may Save against another. A touch also stabilises a dying creature. (Healer’s Kit; 1 Supply.)', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
  },
  {
    name: 'Dress the Wounded', category: 'Medicine', role: 'Utility · camp heal', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest', detail: 'Healer’s Kit; 1 Supply per target' }),
      range: { base: 'Those resting in camp' },
      targets: campTargets('Int'),
      effects: {
        base: 'Each recovers +Int HP on the rest, and may Save (+0) against a bodily affliction.',
        advances: [
          { value: 'Each recovers +Int + 1 HP on the rest, and may Save (+1) against a bodily affliction', cost: 'm' },
          { value: 'Each recovers +Int + 2 HP on the rest, and may Save (+2) against a bodily affliction', cost: 'm' },
          { value: 'Each recovers +Int + 1d6 HP on the rest, may Save (+2) against each bodily affliction, and heals 1 point of Str, Dex or Con Attribute Damage', cost: 'M' },
        ],
      },
      duration: { base: 'The rest' },
    },
  },
  {
    name: 'Convalescence', category: 'Medicine', role: 'Utility · long-term care', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'uncapped', detail: 'one patient at a time; 24 hours of care each' }),
      action: actionCost({ act: 'downtime', detail: 'the patient at complete rest, no activity' }),
      targets: campTargets('Int'),
      effects: {
        base: 'Tend 1 Wound OR 1 Attribute Damage point as though 7 days had passed (your Heal roll replaces the Save; 2 Supplies each). +3 HP bundled. At most 1 point per Attribute per day.',
        advances: [
          { value: 'Tend 2 Wounds or Attribute Damage points as though 7 days had passed (your Heal roll replaces the Save; 2 Supplies each). +3 HP bundled. At most 1 point per Attribute per day.', cost: 'm' },
          { value: 'Tend Int Wounds or Attribute Damage points as though 7 days had passed (your Heal roll replaces the Save; 2 Supplies each). +3 HP bundled. At most 1 point per Attribute per day.', cost: 'm' },
          { value: 'Tend all Wounds and Attribute Damage points as though 7 days had passed (your Heal roll replaces the Save; 2 Supplies each). +3 HP bundled. At most 1 point per Attribute per day.', cost: 'M' },
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

// Wield Artefact — the artefact engine. Shared verbatim by Elder Magic (the
// Antiquarian's) and Occult (the Occultist's): the same card in both lists.
// The artefact's own tradition tag decides what it actually does.
const WIELD_ARTEFACT: Ability = {
  name: 'Wield Artefact', category: 'Elder Magic', role: 'Utility · artefact engine', mode: 'Effect',
  vars: {
    frequency: FREQ_2ENC,
    action: actionCost({ act: 'varies', detail: 'the artefact\'s own activation' }),
    effects: WIELD_EFFECTS('Artefact'),
  },
  options: [
    { label: 'Generic Advancement Ladder', note: GA_NOTE('artefact'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_SPECIALIZATION('artefact', 'Artefact Specialization'), detail: ['Feat Hook (a studied Elder fragment) → a bonus when wielding artefacts of that tradition — e.g. +1 to its boosts'] },
  ],
};

const ELDER_MAGIC: Ability[] = [
  WIELD_ARTEFACT,
  {
    name: 'Whispers from the Doomed', category: 'Elder Magic', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: actionCost({ act: 'standard' }, { act: 'move', cost: 'M' }),
      range: STD_RANGE,
      targets: STD_FEW_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      damage: { base: 'Cha (Psychic)', advances: [{ value: 'Cha + 1', cost: 'm' }, { value: 'Cha + 1d6', cost: 'm' }, { value: 'Cha + 2d6', cost: 'M', note: 'L5' }] },
      duration: { base: 'Instant' },
    },
    options: [{ label: 'Specialization Hooks', detail: ['Specialization — Psychic → automatic +1 to hit and a critical hit on 19–20; unlocks a purchasable Fear Ladder (−1 to attack → can’t move closer → can’t attack you → flees; Save ends)'] }],
  },
  {
    name: 'Memory of Celestia', category: 'Elder Magic', role: 'Control · debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: actionCost({ act: 'standard' }, { act: 'move', cost: 'M' }, { act: 'minor', cost: 'M' }, { act: 'interrupt', trigger: 'when the target attacks or makes a Perception check', cost: 'M' }),
      range: STD_RANGE,
      targets: STD_FEW_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: '−1 to the target’s attack & Perception rolls (Sensory)',
        advances: [
          { value: '−2 to the target’s attack & Perception rolls (Sensory)', cost: 'm' },
          { value: '−2 to the target’s attack & Perception rolls, and it takes no Interrupts or Reactions (Sensory)', cost: 'm' },
          { value: 'Blinded', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [
      { label: 'Specialization Hooks', detail: ['Specialization — Radiant (off-list — typically via multiclass) → +1 to hit, and unlocks a Radiant damage Ladder (Cha → Cha + 1 → Cha + 1d6 → Cha + 2d6 at L5)'] },
      { label: 'Implement Specialization Hooks', detail: ["Artefact → Push 5'"] },
    ],
  },
  {
    name: 'Figments of Forgotten Places', category: 'Elder Magic', role: 'Control · forced movement', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_FULL_STD,
      range: STD_BURST_RANGE,
      targets: { base: 'One enemy in the burst', advances: [{ value: 'Cha enemies in the burst', cost: 'm' }, { value: 'Cha + 1 enemies in the burst', cost: 'm' }, { value: 'All enemies in the burst', cost: 'M' }] },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: "Shift the target 1 (5')",
        advances: [
          { value: "Shift the target 2 (10')", cost: 'm' },
          { value: "Shift the target 2 (10'), and Slowed 5 (1 round)", cost: 'm' },
          { value: "Shift the target 3 (15'), and Slowed 5 (Save ends)", cost: 'M' },
        ],
      },
      duration: { base: 'Instant (Slowed: Save ends)' },
    },
    options: [
      { label: 'Specialization Hooks', detail: ['Specialization — Psychic → adds a Psychic damage Ladder onto the Effect (1 → Cha → Cha + 1 → Cha + 1 and Ongoing 1, Save ends)'] },
      { label: 'Implement Specialization Hooks', detail: ["Spellbook → +5' to the burst, and unlocks a Movement debuff Ladder (−5'/−10'/−15'/Immobilized) that replaces the Slowed Conditions"] },
    ],
  },
  {
    name: 'Edict for the Thralls', category: 'Elder Magic', role: 'Control · domination', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_FULL_STD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
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
      { label: 'Specialization Hooks', detail: ['Specialization — Psychic → 1 Psychic damage each round it stays bound'] },
      { label: 'Implement Specialization Hooks', detail: ['Spellbook → unlocks a Targets Ladder (+1 / +2 / +3 / +4 targets)', 'Artefact → while you hold the artefact, the target takes −1 to its Saves against the Edict'] },
    ],
  },
  {
    name: 'Pall of Doubt', category: 'Elder Magic', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: ACTION_FULL_STD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: '−1 to a chosen Defence (Flat Debuff)',
        advances: [
          { value: '−2 to a chosen Defence (Flat Debuff)', cost: 'm' },
          { value: '−2 to a chosen Defence, and Vulnerable 1 (Flat Debuff)', cost: 'm' },
          { value: '−2 to a chosen Defence, and Vulnerable 3 (Flat Debuff)', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
    options: [
      { label: 'Specialization Hooks', detail: ['Specialization — Psychic → 1 Psychic damage each round the target is affected'] },
      { label: 'Implement Specialization Hooks', detail: ["Magic Staff (off-list — typically via multiclass) → +1 to your AC while any target remains under the Effect", "Artefact → −1 to the target's Saves, and unlocks a Targets Ladder (+1 / +2 / +3 / all enemies in range)"] },
    ],
  },
  {
    name: 'Psychometry', category: 'Elder Magic', role: 'Utility · divination', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'ritual', time: '4 hours' }, { act: 'ritual', time: '2 hours', cost: 'm' }, { act: 'ritual', time: '1 hour', cost: 'm' }, { act: 'ritual', time: '10 minutes', cost: 'M' }),
      effects: {
        base: 'Study an object you handle (no language gate) and make a Knowledge: History check vs its Resonance DC. An object can be read only once, ever, and a failed check silences it for good. On a success, the DM reveals something of the object’s past.',
        advances: [
          { value: 'Study an object you handle (no language gate) and make a Knowledge: History check vs its Resonance DC. An object can be read only once, ever, and a failed check silences it for good. On a success, the DM reveals the object’s past in greater detail.', cost: 'm' },
          { value: 'Study an object you handle (no language gate) and make a Knowledge: History check vs its Resonance DC. An object can be read only once, ever, and a failed check silences it for good. On a success, the DM reveals the object’s past in greater detail, and you may ask a clarifying question.', cost: 'm' },
          { value: 'Study an object you handle (no language gate) and make a Knowledge: History check vs its Resonance DC. An object can be read only once, ever, and a failed check silences it for good. On a success, the DM reveals as much as the object knows — its deepest history.', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Implement Specialization Hooks', detail: ['Artefact → on an Artefact-tagged object, also unlocks an Identify-grade read of its powers, and grants a second attempt if the first check failed'] }],
  },
  {
    name: 'Lessons from Dark Places', category: 'Elder Magic', role: 'Utility · delving', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'standard', detail: 'exploration' }, { act: 'interrupt', trigger: 'when a delving hazard is sprung', cost: 'M' }),
      range: { base: "Detect hazards & secret doors within 30' (Dungeoneering or History check)", advances: [{ value: "45'", cost: 'm' }, { value: "60'", cost: 'm' }, { value: "120'", cost: 'M' }] },
      effects: {
        base: 'Resolve a delving hazard with a Dungeoneering or History check in place of the Save or Skill it requires (+0 to the check).',
        advances: [
          { value: 'Resolve a delving hazard with a Dungeoneering or History check in place of the Save or Skill it requires (+1 to the check)', cost: 'm' },
          { value: 'Resolve a delving hazard with a Dungeoneering or History check in place of the Save or Skill it requires (+2 to the check)', cost: 'm' },
          { value: 'Resolve a delving hazard with a Dungeoneering or History check in place of the Save or Skill it requires (+2 to the check), and your allies may use your result', cost: 'M' },
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
// Specialization — [type] feat), so those ladders live in each card's Feats line;
// the Effect(s) row shows only the baseline (damage, or a Defence ladder
// on the close chassis). Implements (wand/staff/spellbook/scroll) lend hooks.

const RANGED_SINGLE_DMG: Variable = { base: '1d4', advances: [{ value: '1d4 + Int', cost: 'm' }, { value: '1d6 + Int', cost: 'm' }, { value: '2d6 + Int', cost: 'M', note: 'L5' }] };
const CLOSE_SINGLE_DMG: Variable = { base: '1d6', advances: [{ value: '1d6 + Int', cost: 'm' }, { value: '1d8 + Int', cost: 'm' }, { value: '2d8 + Int', cost: 'M', note: 'L5' }] };
const RANGED_AOE_DMG: Variable = { base: '1', advances: [{ value: 'Int', cost: 'm' }, { value: '1d4 + Int', cost: 'm' }, { value: '2d4 + Int', cost: 'M', note: 'L5' }] };
const CLOSE_AOE_DMG: Variable = { base: 'Int', advances: [{ value: '1d4 + Int', cost: 'm' }, { value: '1d6 + Int', cost: 'm' }, { value: '2d6 + Int', cost: 'M', note: 'L5' }] };
const NM_DEFENCE: Variable = { base: '+1 to one Defence (until your next turn)', advances: [{ value: '+1 to all Defences (until your next turn)', cost: 'm' }, { value: '+2 to all Defences (until your next turn)', cost: 'm' }, { value: '+2 to all Defences and DR 1 (until your next turn)', cost: 'M' }] };
const NM_AOE_TARGETS: Variable = { base: 'Each creature in the burst — one Dexterity vs AC roll resolved against each (friendly fire included)' };

const NM_ELEMENT_DETAIL = 'Choose one elemental damage type when you build the spell — Fire, Acid, Cold, Lightning, Sonic, or Force. This is the damage type of the Ability, and you can unlock additional effects if you have the Specialization Feat for that element.';
const NM_ELEMENTS = ['Fire', 'Acid', 'Cold', 'Lightning', 'Sonic', 'Force'];
const NM_IMPL_LIST = [
  'Wand → +1 to hit',
  'Magic Staff → +1 to one Defence until your next round',
  'Spellbook → the Elemental Specialization Effect Ladder lands one Rank higher',
  'Scroll → once per encounter, cast without consuming the scroll',
];
const NM_IMPL_AOE_LIST = [
  'Wand → +1 to hit',
  "Magic Staff → +5' burst radius",
  'Spellbook → the Elemental Specialization Effect Ladder lands one Rank higher',
  'Scroll → once per encounter, cast without consuming the scroll',
];
const NM_SPECIALIZATION_NOTE = 'Your spell does the damage based on your Damage Ladder above, and you can additionally purchase from the relevant Effect Ladder below.';
const NM_HOOK_NOTE = 'You gain +1 to hit with the spell if your Specialization Feat and the Damage Type are the same. Additionally, you get an automatic Effect which improves as you Advance the Damage Ladder in the spell, as follows:';

// The four New Magic Effect ladders, each tied to its damage types. Same on
// every offensive chassis (any element can be built into any chassis).
// Follows the Standard Ongoing Damage amount (caps at 3; the Major buys a
// harder save, not a bigger tick). New Magic ongoing is a spell rider, so it
// keeps the elemental "/ round" phrasing and has no separate duration ladder.
const EFL_ONGOING: NamedLadder = {
  name: 'Ongoing Damage — Fire & Acid',
  base: '1 damage / round',
  advances: [
    { value: '2 damage / round', cost: 'm' },
    { value: '3 damage / round', cost: 'm' },
    { value: '3 damage / round, and −2 to the Save against it', cost: 'M' },
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
  ...DAZE_EFFECTS,
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
    { value: '1 damage to 2 adjacent creatures', cost: 'm' },
    { value: '1 damage to Int adjacent creatures', cost: 'm' },
    { value: '2 damage to all adjacent creatures', cost: 'M' },
  ],
};
const HKL_GLANCING: NamedLadder = {
  name: 'Glancing — Force & Cold',
  base: '1 damage on a miss',
  advances: [
    { value: '2 damage on a miss', cost: 'm' },
    { value: 'Int damage on a miss', cost: 'm' },
    { value: 'Half the spell’s damage on a miss', cost: 'M' },
  ],
};
const HKL_PIERCE: NamedLadder = {
  name: 'Pierce — Fire & Lightning',
  base: '1 damage to 1 enemy in the line to the target',
  advances: [
    { value: '1 damage to 2 enemies in the line to the target', cost: 'm' },
    { value: '1 damage to Int enemies in the line to the target', cost: 'm' },
    { value: '2 damage to all enemies in the line to the target', cost: 'M' },
  ],
};
const HKL_RETAL: NamedLadder = {
  name: 'Retaliation — Fire & Lightning',
  base: 'The next enemy to melee you takes 1 typed damage (until your next turn)',
  advances: [
    { value: 'All enemies that melee you take 1 typed damage (until your next turn)', cost: 'm' },
    { value: 'All enemies that melee you take 2 typed damage (until your next turn)', cost: 'm' },
    { value: 'All enemies that melee you take 2 typed damage (until the end of the encounter)', cost: 'M' },
  ],
};
const HKL_LINGER: NamedLadder = {
  name: 'Lingering — Acid & Sonic',
  base: 'A creature entering or ending its turn in the area takes 1 typed damage',
  advances: [
    { value: 'A creature entering or ending its turn in the area takes 2 typed damage', cost: 'm' },
    { value: 'A creature entering or ending its turn in the area takes Int typed damage', cost: 'm' },
    { value: 'A creature entering or ending its turn in the area takes Int typed damage, and the hazard lingers a second round', cost: 'M' },
  ],
};

const NEW_MAGIC: Ability[] = [
  {
    name: 'Telum Eminus', category: 'New Magic', role: 'Offensive · ranged · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: RANGED_SINGLE_DMG,
      duration: { base: 'Instant' },
    },
    builder: true,
    builderChoice: { key: 'element', label: 'Element', options: NM_ELEMENTS },
    options: [
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Specialization - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_PIERCE, HKL_SPLASH, HKL_GLANCING] },
      { label: 'Elemental Specialization - Optional Hooks', note: NM_SPECIALIZATION_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_LIST },
    ],
  },
  {
    name: 'Tactus Comminus', category: 'New Magic', role: 'Offensive · close · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: CLOSE_SINGLE_DMG,
      effects: NM_DEFENCE,
      duration: { base: 'Instant (Defence: until your next turn)' },
    },
    builder: true,
    builderChoice: { key: 'element', label: 'Element', options: NM_ELEMENTS },
    options: [
      { label: 'Defence (baseline)', detail: 'The Effect row’s Defence Ladder is always on — no element or feat needed.' },
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Specialization - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_RETAL, HKL_SPLASH, HKL_GLANCING] },
      { label: 'Elemental Specialization - Optional Hooks', note: NM_SPECIALIZATION_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_LIST },
    ],
  },
  {
    name: 'Globus Eminus', category: 'New Magic', role: 'Offensive · ranged burst · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: STD_BURST_RANGE,
      targets: NM_AOE_TARGETS,
      attack: { base: 'Dexterity vs AC' },
      damage: RANGED_AOE_DMG,
      duration: { base: 'Instant' },
    },
    builder: true,
    builderChoice: { key: 'element', label: 'Element', options: NM_ELEMENTS },
    options: [
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Specialization - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_PIERCE, HKL_LINGER, HKL_GLANCING] },
      { label: 'Elemental Specialization - Optional Hooks', note: NM_SPECIALIZATION_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_AOE_LIST },
    ],
  },
  {
    name: 'Corona Comminus', category: 'New Magic', role: 'Offensive · close burst · spell-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: { base: "5' burst (centred on you)", advances: [{ value: "10' burst", cost: 'M' }, { value: "15' burst", cost: 'M' }, { value: "20' burst", cost: 'M' }] },
      targets: NM_AOE_TARGETS,
      attack: { base: 'Dexterity vs AC' },
      damage: CLOSE_AOE_DMG,
      effects: NM_DEFENCE,
      duration: { base: 'Instant (Defence: until your next turn)' },
    },
    builder: true,
    builderChoice: { key: 'element', label: 'Element', options: NM_ELEMENTS },
    options: [
      { label: 'Defence (baseline)', detail: 'The Effect row’s Defence Ladder is always on — you stand in your own burst, so it needs no element or feat.' },
      { label: 'Element', detail: NM_ELEMENT_DETAIL, placement: 'top' },
      { label: 'Elemental Specialization - Automatic Hooks', note: NM_HOOK_NOTE, hideCosts: true, ladders: [HKL_RETAL, HKL_LINGER, HKL_GLANCING] },
      { label: 'Elemental Specialization - Optional Hooks', note: NM_SPECIALIZATION_NOTE, baseCost: 'm', ladders: NM_EFFECT_LADDERS },
      { label: 'Implement Specialization Hooks', detail: NM_IMPL_AOE_LIST },
    ],
  },
  {
    name: 'Lorica Arcana', category: 'New Magic', role: 'Defensive · arcane armour', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'ritual', time: '1 minute' }),
      targets: { base: 'Self' },
      effects: {
        base: '+1 AC',
        advances: [
          { value: '+1 to all Armoured Defences', cost: 'm' },
          { value: '+1 to all Defences', cost: 'm' },
          { value: '+1 to all Defences, and DR 1', cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '2 hours', cost: 'm' }, { value: '4 hours', cost: 'm' }, { value: 'Until your next Long Rest', cost: 'M' }] },
    },
    options: [{ label: 'Implement Specialization Hooks', note: 'No element — Lorica Arcana is not an elemental spell.', detail: ['Magic Staff → every Defence improvement is +1 more'] }],
  },
  {
    name: 'Scutum Virium', category: 'New Magic', role: 'Defensive · force shield', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: actionCost({ act: 'interrupt', trigger: 'when you are hit by an attack' }),
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
      { label: 'Specialization Hooks', detail: ['Specialization — Force → the bonus applies to all Armoured Defences, not just AC'] },
      { label: 'Implement Specialization Hooks', detail: ['Magic Staff → +1 to both AC and DR'] },
    ],
  },
  {
    name: 'Manus Eminus', category: 'New Magic', role: 'Utility · telekinesis', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      attack: { base: "Dexterity vs Armoured Strength (to shove an unwilling creature up to 10', within capacity)" },
      effects: {
        base: 'Move an unattended object up to 10 lb',
        advances: [
          { value: 'Move an unattended object up to 50 lb', cost: 'm' },
          { value: 'Move an unattended object up to 200 lb (a person)', cost: 'm' },
          { value: 'Move an unattended object up to 1,000 lb', cost: 'M' },
        ],
      },
    },
    options: [{ label: 'Implement Specialization Hooks', detail: ["Wand → each Ladder counts one Rank higher; at the top Rank it doubles instead → 240' / 2,000 lb"] }],
  },
  {
    name: 'Lumen Arcanum', category: 'New Magic', role: 'Utility · light', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_MINOR,
      effects: {
        base: "Dim light, 10' radius",
        advances: [
          { value: "Bright light, 20' radius", cost: 'm' },
          { value: "Bright light, 20' radius (+ dim 20' beyond); you may move it or affix it to a moving object", cost: 'm' },
          { value: "Magical Light, 30' radius — the ceiling of magic; where it overlaps Magical Darkness the two cancel. It is not a sun.", cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '2 hours', cost: 'm' }, { value: '4 hours', cost: 'm' }, { value: 'Until you dismiss it', cost: 'M' }] },
    },
    options: [
      { label: 'Specialization Hooks', detail: ['Specialization — Fire → the light is a magical, unquenchable flame (and behaves like a torch for setting things alight)'] },
      { label: 'Implement Specialization Hooks', detail: ["Wand → adds a Range Ladder (30'/45'/60'/120') that tracks the Brightness Rank — place the light as far as it reaches"] },
    ],
  },
];

// ── The Lost (Scoundrel — Class) ────────────────────────────────
// The Category's engine: a strike only pays when the mark is Off Guard or
// flanked (see Combat). Everything else here exists to buy that condition.
const OFF_GUARD_NOTE =
  'The mark is Off Guard against you when it cannot see you, has not yet acted, is Prone, Stunned or Immobilized — or you have Feinted it. Flanking counts too.';

// The Scoundrel's weapon hooks — the groups the Class and its three Subclasses train.
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
      action: ACTION_STANDARD,
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
      effects: BLEED_EFFECTS,
      duration: { base: 'Instant (Bleed: Save ends)' },
    },
    options: [
      { label: 'The mark must be Off Guard or flanked', note: OFF_GUARD_NOTE, placement: 'top' },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: LOST_HOOKS },
    ],
  },
  {
    name: 'Feint', category: 'The Lost', role: 'Debuff · setup', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_SMM,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs Unarmoured Wisdom' },
      damage: { base: 'None — a false move, not a real one' },
      effects: {
        base: 'The mark is Off Guard against your attacks.',
        advances: [
          { value: 'The mark is Off Guard against your attacks and one ally’s', cost: 'm' },
          { value: 'The mark is Off Guard against everyone’s attacks', cost: 'm' },
          { value: 'The mark is Off Guard against everyone’s attacks, and Dazed (no Reactions or Interrupts)', cost: 'M' },
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
      action: ACTION_SMM,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs Unarmoured Dexterity' },
      damage: { base: 'None — sand, ash, a flung cloak, a boot to the knee' },
      effects: {
        base: 'Sensory: −1 to the mark’s attack and Perception rolls.',
        advances: [
          { value: 'Sensory: −2 to the mark’s attack and Perception rolls', cost: 'm' },
          { value: 'Sensory: −2 to the mark’s attack and Perception rolls, and it takes no Interrupts or Reactions', cost: 'm' },
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
      action: actionCost({ act: 'move' }, { act: 'minor', cost: 'M' }, { act: 'interrupt', trigger: 'when an enemy attacks you', cost: 'M' }),
      range: { base: 'Self' },
      effects: {
        base: 'Shift 5′. The movement provokes no Opportunity Attacks.',
        advances: [
          { value: 'Shift 10′, provoking no Opportunity Attacks', cost: 'm' },
          { value: 'Shift 10′, provoking no Opportunity Attacks, and the next attack against you this round takes −2', cost: 'm' },
          { value: 'Shift 10′, provoking no Opportunity Attacks — and if you end it out of the attacker’s reach, the triggering attack misses', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Vanish', category: 'The Lost', role: 'Defensive · utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_SMM,
      range: { base: 'Self' },
      effects: {
        base: 'Hide (Stealth vs Perception) even while observed, so long as you have cover or concealment. Anyone who loses you is Off Guard against you.',
        advances: [
          { value: 'Hide (Stealth vs Perception, at +2) even while observed, so long as you have cover or concealment. Anyone who loses you is Off Guard against you', cost: 'm' },
          { value: 'Hide (Stealth vs Perception, at +2) even while observed — no cover needed; a shadow, a crowd, or a distraction is enough. Anyone who loses you is Off Guard against you', cost: 'm' },
          { value: 'Hide (Stealth vs Perception, at +2) in plain sight, with nothing at all to hide behind. Anyone who loses you is Off Guard against you', cost: 'M' },
        ],
      },
      duration: { base: 'Until you attack or are found' },
    },
  },
  {
    name: 'Tumble', category: 'The Lost', role: 'Movement', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: actionCost({ act: 'move' }),
      range: { base: 'Self' },
      effects: {
        base: 'Move up to half your Speed, provoking no Opportunity Attacks.',
        advances: [
          { value: 'Move up to half your Speed, provoking no Opportunity Attacks, moving through enemies’ squares with no check', cost: 'm' },
          { value: 'Move up to your full Speed, provoking no Opportunity Attacks, moving through enemies’ squares with no check', cost: 'm' },
          { value: 'Move up to your full Speed, provoking no Opportunity Attacks, moving through enemies’ squares with no check — and every enemy whose square you pass through is Off Guard until the end of your next turn', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Light Fingers', category: 'The Lost', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'encounter' }, { freq: 'at-will', cost: 'M' }),
      action: ACTION_SMM,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Thievery vs the mark’s Perception' },
      effects: {
        base: 'Lift, palm, or plant a small unattended or pocketed item.',
        advances: [
          { value: 'Lift, palm, or plant an item on the mark’s belt or person — a purse, a key, a signet', cost: 'm' },
          { value: 'Lift, palm, or plant an item, even one in the mark’s hand', cost: 'm' },
          { value: 'Lift, palm, or plant an item, even one in the mark’s hand, and the mark does not notice until the scene has ended — no second check', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Lay Low', category: 'The Lost', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'downtime', time: '1 hour', detail: 'in a settlement' }),
      targets: {
        base: 'Self',
        advances: [
          { value: 'Self and 1 other', cost: 'm' },
          { value: 'Self and 2 others', cost: 'm' },
          { value: 'The entire party', cost: 'M' },
        ],
      },
      effects: {
        base: 'You go to ground in some abandoned or hidden place. Opponents take −1 to locate you (Gather Information, or another relevant Skill check).',
        advances: [
          { value: 'You go to ground; opponents take −2 to locate you', cost: 'm' },
          { value: 'You go to ground; opponents take −2 to locate you, and a failed check turns up a misdirection ("they left town", "took the river road")', cost: 'm' },
          { value: 'You go to ground; opponents take −2 to locate you, and you may venture out up to 4 hours a day without compromising the hiding place', cost: 'M' },
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
      frequency: frequency({ freq: 'encounter' }, { freq: 'encounter', uses: 2, cost: 'M' }),
      action: actionCost({ act: 'scene', combat: 'minor', detail: 'a few minutes’ watching' }),
      range: { base: 'Sight' },
      targets: { base: 'One', advances: [{ value: 'Two', cost: 'm' }, { value: 'Int', cost: 'm' }] },
      attack: { base: 'Intelligence vs the target’s Difficulty Class' },
      effects: {
        base: 'The mark is Studied: +1 damage to any Sneak Attack, Death Blow, or Anatomist’s Cut against it.',
        advances: [
          { value: 'The mark is Studied: +Int damage to any Sneak Attack, Death Blow, or Anatomist’s Cut against it', cost: 'm' },
          { value: 'The mark is Studied (+Int damage), and you learn its HP and Defences', cost: 'm' },
          { value: 'The mark is Studied (+2 × Int damage), and you learn its HP and Defences', cost: 'M', note: 'L5' },
        ],
      },
      duration: { base: 'Until the end of the encounter' },
    },
  },
  {
    name: 'Death Blow', category: 'Assassination', role: 'Offensive · finisher', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
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
      effects: BLEED_EFFECTS,
      duration: { base: 'Instant (Bleed: Save ends)' },
    },
    options: [
      { label: 'Studied and Off Guard', note: STUDIED_NOTE, detail: 'Death Blow can only be aimed at a mark you have Studied who is also Off Guard against you, or whom you flank.', placement: 'top' },
      { label: 'Weapon Specialization Hooks', note: WEAPON_HOOK_NOTE, detail: DEATHBLOW_HOOKS },
    ],
  },
  ENVENOM,
  {
    name: 'Anatomist’s Cut', category: 'Assassination', role: 'Debuff', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: { base: 'Reach' },
      targets: { base: 'One' },
      attack: { base: 'Dexterity vs AC' },
      damage: { base: '1[W] + Dex (+ the study bonus against a Studied mark)' },
      effects: {
        base: 'A crippling cut to nerve, tendon, or joint: −1 to a Defence of your choice.',
        advances: [
          { value: '−2 to the chosen Defence', cost: 'm' },
          { value: '−2 to the chosen Defence, and Vulnerable 1', cost: 'm' },
          { value: '−2 to the chosen Defence, and Vulnerable 3', cost: 'M' },
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
      action: ACTION_STANDARD,
      range: { base: 'Reach (from behind — the mark must be Off Guard)' },
      targets: { base: 'One Off Guard opponent' },
      attack: { base: 'Dexterity vs Armoured Strength (a choke, not a cut)' },
      damage: { base: '1[W]' },
      effects: {
        base: 'The mark is Grabbed and silenced — no speech, no spell with a spoken part.',
        advances: [
          { value: 'The mark is Grabbed and silenced, and takes 1[W] damage every round while held', cost: 'm' },
          { value: 'The mark is Grabbed, silenced, and Dazed (no Reactions or Interrupts), and takes 1[W] damage every round while held', cost: 'm' },
          { value: 'The mark is Grabbed, silenced, and Dazed, and takes 1[W] damage every round while held — and from the second round, it must make a Constitution Save (vs your Strength Offence + 10) each round or fall Unconscious', cost: 'M' },
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
      action: actionCost({ act: 'scene', detail: 'a social interaction' }),
      range: { base: 'Conversation' },
      targets: { base: 'A person or creature that knows something about your quarry' },
      attack: { base: 'Intimidate, Diplomacy, or Bluff vs the target’s matching Defence' },
      effects: {
        base: 'You wring out details of your quarry: +2 to any roll to learn its weaknesses or Defences, in or before combat while you can observe it — Study the Mark checks included.',
        advances: [
          { value: 'You wring out details of your quarry: +2 to any roll to learn its weaknesses or Defences, and +2 Initiative against it', cost: 'm' },
          { value: 'You wring out details of your quarry: +2 to any roll to learn its weaknesses or Defences, +2 Initiative against it, and +1 to hit it in your next encounter with it', cost: 'm' },
          { value: 'You wring out details of your quarry: +2 to any roll to learn its weaknesses or Defences, +2 Initiative against it, and permanently +1 to hit and +1 damage against it', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Clean Kill', category: 'Assassination', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: FREQ_ENCOUNTER,
      action: actionCost({ act: 'scene', detail: 'a few minutes with the body' }),
      range: { base: 'Touch' },
      effects: {
        base: 'You leave nothing behind: the death raises no alarm, and body and signs are hidden from a casual search.',
        advances: [
          { value: 'You leave nothing behind: the death raises no alarm, and even a deliberate search takes −2 to turn anything up', cost: 'm' },
          { value: 'You leave nothing behind: the death raises no alarm, even a deliberate search takes −2 to turn anything up, and you can make the death read as natural or accidental', cost: 'm' },
          { value: 'No trace at all — no Gather Information check can connect the death to you, and you can make it read as natural or accidental', cost: 'M' },
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
      action: ACTION_SMM,
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: '“Look there.” The Target is Off Guard to your attacks.',
        advances: [
          { value: 'The Target is Off Guard to all attacks', cost: 'm' },
          { value: 'The Target is Off Guard to all attacks, and you may Shift one Target 5′', cost: 'm' },
          { value: 'The Target is Off Guard to all attacks, you may Shift one Target 5′, and one Target is Dazed until the end of your next turn', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next turn' },
    },
  },
  {
    name: 'Cutting Remark', category: 'Guile', role: 'Debuff · offence', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_SMM,
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: 'A jibe that gets under the skin: −1 to the Target’s attack rolls.',
        advances: [
          { value: '−1 to the Target’s attack and damage rolls', cost: 'm' },
          { value: '−2 to the Target’s attack and damage rolls', cost: 'm' },
          { value: '−2 to the Target’s attack and damage rolls, and it may not take Reactions or Interrupts', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next turn' },
    },
  },
  {
    name: 'Bluster', category: 'Guile', role: 'Debuff · Defences', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_SMM,
      range: STD_RANGE,
      targets: GUILE_TARGETS,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: {
        base: 'Bluff and bravado throw the Target off its guard: −1 to a Defence of your choice.',
        advances: [
          { value: '−2 to the chosen Defence', cost: 'm' },
          { value: '−2 to the chosen Defence, and Vulnerable 1', cost: 'm' },
          { value: '−2 to the chosen Defence, and Vulnerable 3', cost: 'M' },
        ],
      },
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Confidence', category: 'Guile', role: 'Buff · self', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_MMF,
      range: { base: 'Self' },
      effects: {
        base: 'A performer’s unshakeable front: gain 1 Temp HP.',
        advances: [
          { value: 'Gain Cha Temp HP', cost: 'm' },
          { value: 'Gain Cha Temp HP, and +1 to all your Defences while the Temp HP lasts', cost: 'm' },
          { value: 'Gain Cha Temp HP, +1 to all your Defences while the Temp HP lasts, and you cannot be made Off Guard while it lasts', cost: 'M' },
        ],
      },
      duration: { base: 'Until you lose the Temp HP' },
    },
  },
  {
    name: 'Swindle', category: 'Guile', role: 'Utility · non-combat', mode: 'Attack',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'downtime', time: '24 hours', detail: 'setting up the con' }, { act: 'downtime', time: '12 hours', detail: 'setting up the con', cost: 'm' }, { act: 'downtime', time: '6 hours', detail: 'setting up the con', cost: 'm' }, { act: 'downtime', time: '1 hour', detail: 'setting up the con', cost: 'M' }),
      range: { base: 'Conversation' },
      targets: { base: 'One person, household, business, or other organization' },
      attack: { base: 'Bluff vs the Target’s Unarmoured Wisdom' },
      effects: {
        base: 'Con the Target out of 1d6 sp.',
        advances: [
          { value: 'Con the Target out of 1d6 + Cha sp', cost: 'm' },
          { value: 'Con the Target out of 2d6 + Cha sp', cost: 'm' },
          { value: 'Con the Target out of 1d4 × 10 sp', cost: 'M' },
        ],
      },
      duration: { base: 'Instant — the take is yours' },
    },
  },
  {
    name: 'Parley', category: 'Guile', role: 'Utility · social', mode: 'Attack',
    vars: {
      frequency: FREQ_ENCOUNTER,
      action: actionCost({ act: 'scene', combat: 'standard', detail: 'a conversation' }),
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
    options: [{ label: 'Terms, not Attitude', note: 'Parley wins concessions. Shifting an NPC’s Attitude is the Diplomacy skill’s Persuade action, and the Friar’s Preach to the Saintly — not this.', placement: 'top' }],
  },
  {
    name: 'Contionem habere', category: 'Guile', role: 'Utility · rally', mode: 'Attack',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'a rousing speech (a few minutes)' }),
      range: { base: 'You and all allies who can hear you' },
      targets: { base: 'The foe (or foes) your speech names' },
      attack: { base: 'Intimidate vs the named foe’s Unarmoured Wisdom' },
      effects: {
        base: 'You and your allies gain 1 Temp HP, held until your next encounter with the named foe.',
        advances: [
          { value: 'You and your allies gain Cha Temp HP, held until your next encounter with the named foe', cost: 'm' },
          { value: 'You and your allies gain Cha Temp HP and +1 to AC, held until your next encounter with the named foe', cost: 'm' },
          { value: 'You and your allies gain Cha + 1 Temp HP and +1 to all Defences, held until your next encounter with the named foe', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of your next encounter with the named foe (or until the Temp HP is spent)' },
    },
    options: [{ label: 'Contionem habere', note: 'Auld Imperial: “to hold forth.”', placement: 'top' }],
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
  'Some Occult Abilities carry a special property called the Price: a negative effect on you, applied when you use the Ability. Each Price is a Ladder like any other, and can be bought down. The Grey Faith Feat (which requires training in the Black Faith) improves the Price Ladder of every Occult Ability you own by one Rank.';

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
      action: actionCost({ act: 'minor', detail: 'instant out of combat' }),
      range: STD_RANGE,
      effects: {
        base: 'Lowlight Vision — Dim Light carries no penalty for you.',
        advances: [
          { value: 'Darkvision — neither Dim Light nor Darkness carries a penalty for you (Magical Darkness and the Void still blind you)', cost: 'm' },
          { value: 'Darkvision, and See Invisible — you see invisible creatures and things', cost: 'm' },
          { value: 'Darkvision, See Invisible, and Ghost Sight — you see spirits and shades, and into the other side', cost: 'M' },
        ],
      },
      duration: STD_SCENE_DURATION,
    },
    extraVars: [PRICE_MAXHP],
    options: [{ label: 'The Price', note: PRICE_NOTE, placement: 'top' }],
  },
  {
    name: 'Dark Blessing', category: 'Occult', role: 'Buff · party support', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'a few minutes of asking' }),
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
        base: 'The favour of the dead settles on the blessed: +1 to their Saves.',
        advances: [
          { value: '+1 to their Saves and Defences', cost: 'm' },
          { value: '+1 to their Saves, Defences, and attack rolls', cost: 'm' },
          { value: '+1 to their Saves, Defences, and attack rolls, and one Reroll for the party on any d20 roll', cost: 'M' },
        ],
      },
      duration: { base: 'Until your next rest' },
    },
    extraVars: [PRICE_MAXHP],
  },
  {
    name: 'Spirit Guide', category: 'Occult', role: 'Utility · non-combat', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'a few minutes of asking' }),
      range: { base: 'You (the party, from Rank 2)' },
      effects: {
        base: 'You gain 1 Reroll during the Duration, for any non-combat roll.',
        advances: [
          { value: 'The party gains 1 Reroll during the Duration, for any non-combat roll', cost: 'm' },
          { value: 'The party gains 2 Rerolls during the Duration, for any non-combat roll', cost: 'm' },
          { value: 'The party gains 2 Rerolls during the Duration, for any non-combat roll, and you know the direction to a safe place', cost: 'M' },
        ],
      },
      duration: { base: '1 hour', advances: [{ value: '4 hours', cost: 'm' }, { value: '8 hours', cost: 'm' }, { value: '24 hours', cost: 'M' }] },
    },
    extraVars: [PRICE_MAXHP],
    options: [{ label: 'Special', note: 'If you name the kind of roll you are asking after when you ask — Dungeoneering, Survival, and so on — you gain +2 to rolls of that kind, and to the Reroll.' }],
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

// ── Witchcraft (Occultist — Witch) ────────────────────────────────────
// The malevolent half of the Occult line, and the Occultist's teeth. The
// Witch never knelt at the Black Faith's altar — she worked out what its
// worship actually *pays*, and cut out the priest, so the power is hers and
// the sin is not. Charisma vs a foe's Unarmoured Wisdom, the debuffer chassis.
//
// Where Occult bears its own cost (the Price), Witchcraft makes ANOTHER bleed.
// Its two costed workings soften, at their height, onto a COVEN — willing
// sisters who share what would otherwise fall on a victim. (Grey Faith is an
// Occult Feat and does not touch these.)

// ── The Maledictions — the "elements" of the Curse Builder ──────
// A Witch chooses ONE Malediction when she whispers a curse (as an Arcanist
// picks an element); it is the curse's effect and advances on its own ladder.
// Wasting is the Standard Ongoing Damage; the rest are save-ends afflictions
// (all carried by the card's Standard Ongoing Duration ladder). Hex, Evil Eye
// and Grasp of the Grave are subsumed here as Wasting, Ill Luck and Palsy.
const MAL_WASTING: NamedLadder = { name: 'Wasting (Necrotic)', ...ongoingDamage('Necrotic') };
const MAL_ILL_LUCK: NamedLadder = {
  name: 'Ill Luck',
  base: '−1 to all its Saves',
  advances: [
    { value: '−2 to all its Saves', cost: 'm' },
    { value: '−2 to its Saves and all its Skill checks', cost: 'm' },
    { value: '−2 to its Saves and Skill checks, and −2 to all its attacks', cost: 'M' },
  ],
};
const MAL_PALSY: NamedLadder = {
  name: 'Palsy',
  base: "Slowed — Speed −5'",
  advances: [
    { value: "Slowed — Speed −10'", cost: 'm' },
    { value: "Slowed — Speed −15'", cost: 'm' },
    { value: 'Immobilized — Speed 0', cost: 'M' },
  ],
};
const MAL_STUPOR: NamedLadder = { name: 'Stupor', ...DAZE_EFFECTS };
const MAL_ENFEEBLEMENT: NamedLadder = {
  name: 'Enfeeblement',
  base: '−1 to its damage rolls',
  advances: [
    { value: '−1 to its attack and damage rolls', cost: 'm' },
    { value: '−2 to its attack and damage rolls', cost: 'm' },
    { value: '−2 to its attack rolls, and its attacks deal half damage', cost: 'M' },
  ],
};
const MAL_DREAD: NamedLadder = { name: 'Dread (Fear)', ...FEAR_EFFECTS };
const CURSE_MALEDICTIONS = [MAL_WASTING, MAL_ILL_LUCK, MAL_PALSY, MAL_STUPOR, MAL_ENFEEBLEMENT, MAL_DREAD];
// Implement hooks — parallel to New Magic's, to keep the two builders level.
const CURSE_IMPL_LIST = [
  'Wand → +1 to hit',
  'Magic Staff → +1 to one Defence until your next round',
  'Spellbook → the chosen Malediction Ladder lands one Rank higher',
  'Scroll → once per encounter, whisper the curse without consuming the scroll',
];
// Malediction Specialization hooks — the automatic rider each "Specialization — [Malediction]"
// Feat bolts on (see the Feats page). The Feat also grants +1 to hit with that
// Malediction. Prerequisite: Black Tongue + Religion (Black Faith), a Minor each.
const CURSE_SPECIALIZATION_NOTE = 'With the matching Specialization — [Malediction] Feat (requires Language (Black Tongue) and Religion (Black Faith)): +1 to hit when you curse with that Malediction, plus an automatic Hook:';
const CURSE_SPECIALIZATION_HOOKS = [
  'Wasting → +1 to all Necrotic damage you deal',
  'Ill Luck → the cursed target may not use Rerolls',
  'Palsy → a Palsied target also cannot take Reactions or Opportunity Attacks',
  'Stupor → a Stupored target takes −2 to its Save against the curse',
  'Enfeeblement → the target cannot gain Temp HP while cursed',
  "Dread → allies within 10' of the cursed target also take −1 to their attacks (Fear)",
];

const WITCHCRAFT: Ability[] = [
  {
    name: 'Dictiones Atras Susurrare', category: 'Witchcraft', role: 'Offensive · curse · curse-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: { base: 'Your chosen Malediction (see below). The whispered curse clings: the target takes −2 to its Save against it.' },
      duration: ongoingDuration('Cha'),
    },
    builder: true,
    builderChoice: { key: 'malediction', label: 'Malediction', options: CURSE_MALEDICTIONS.map((l) => l.name) },
    builderNoun: 'Curse',
    options: [
      { label: 'Malediction', detail: 'Choose one Malediction when you whisper this curse, as an Arcanist picks an element — it is the curse’s effect, and advances on its own Ladder. Buy this Ability again to whisper another curse with a different Malediction.', placement: 'top' },
      { label: 'The Maledictions — choose one', ladders: CURSE_MALEDICTIONS },
      { label: 'Malediction Specialization Hooks', note: CURSE_SPECIALIZATION_NOTE, detail: CURSE_SPECIALIZATION_HOOKS },
      { label: 'Implement Specialization Hooks', detail: CURSE_IMPL_LIST },
    ],
  },
  {
    name: 'Dictiones Atras Clamare', category: 'Witchcraft', role: 'Offensive · curse burst · curse-builder', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: STD_AREA,
      attack: { base: 'Charisma vs Unarmoured Wisdom' },
      effects: { base: 'Your chosen Malediction (see below), on every enemy in the burst.' },
      duration: ongoingDuration('Cha'),
    },
    builder: true,
    builderChoice: { key: 'malediction', label: 'Malediction', options: CURSE_MALEDICTIONS.map((l) => l.name) },
    builderNoun: 'Curse',
    options: [
      { label: 'Malediction', detail: 'As Dictiones Atras Susurrare, but proclaimed over an area — choose one Malediction and it strikes every enemy in the burst. Buy this Ability again for another curse with a different Malediction.', placement: 'top' },
      { label: 'The Maledictions — choose one', ladders: CURSE_MALEDICTIONS },
      { label: 'Malediction Specialization Hooks', note: CURSE_SPECIALIZATION_NOTE, detail: CURSE_SPECIALIZATION_HOOKS },
      { label: 'Implement Specialization Hooks', detail: CURSE_IMPL_LIST },
    ],
  },
  {
    name: 'Renunciation of Nicetus', category: 'Witchcraft', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'defenceMod', value: 1 }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to all your Defences. The Renunciation: you have renounced the Saintly Faith. You may not willingly enter their churches or other places of worship, may not invoke the Saints’ names, and may not receive benefit from any Saintly source (a Friar of the Saintly Faith’s healing, a blessing, a relic). The Saintly Market is closed to you.',
        advances: [{ value: '+2 to all your Defences. The Renunciation: you have renounced the Saintly Faith. You may not willingly enter their churches or other places of worship, may not invoke the Saints’ names, and may not receive benefit from any Saintly source (a Friar of the Saintly Faith’s healing, a blessing, a relic). The Saintly Market is closed to you.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Aversio Fontis', category: 'Witchcraft', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: 'DR 1. The Renunciation: you have vowed never to willingly bathe in clean water.',
        advances: [{ value: 'DR 2. The Renunciation: you have vowed never to willingly bathe in clean water.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Votum Sinistrum', category: 'Witchcraft', role: 'Vow', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: 'One Reroll per day, on any d20 roll. The Renunciation: you do everything with the left hand, and whenever you are in doubt which way to go, you always turn left.',
        advances: [{ value: 'One Reroll per encounter, on any d20 roll. The Renunciation: you do everything with the left hand, and whenever you are in doubt which way to go, you always turn left.', cost: 'M', note: 'L5' }],
      },
    },
  },
  {
    name: 'Bind Spirit', category: 'Witchcraft', role: 'Companion', companionType: 'Summoned', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'ritual' }, { act: 'full-round', cost: 'm' }, { act: 'standard', cost: 'm' }),
      range: STD_RANGE,
      effects: {
        base: 'You summon a shade that performs tasks for the Duration. It has Speed 15, 5 HP, and all Defences 11, and is invulnerable to every kind of damage but Radiant and Force (and weapons made to battle the undead).',
        advances: [
          { value: 'The shade performs tasks and will fight your enemies: spend a Move Action to command it, and it may take a move and a Standard Action; its attack uses your Charisma attack bonus and deals 1d4 Necrotic. (Speed 15, 5 HP, all Defences 11, invulnerable to all damage but Radiant and Force.)', cost: 'm' },
          { value: 'The shade performs tasks and will fight your enemies: spend a Minor Action to command it, and it may take a move and a Standard Action; its attack uses your Charisma attack bonus and deals 1d4 Necrotic. (Speed 15, 5 HP, all Defences 11, invulnerable to all damage but Radiant and Force.)', cost: 'm' },
          { value: 'The shade performs tasks and will fight your enemies: spend a Minor Action to command it, and it may take a move and a Standard Action; its attack uses your Charisma attack bonus and deals 1d6 Necrotic. (Speed 20, 10 HP, all Defences 12, invulnerable to all damage but Radiant and Force.)', cost: 'M' },
        ],
      },
      duration: STD_SCENE_DURATION,
    },
    options: [{ label: 'The Binding', note: 'Each casting consumes 1 sp worth of powdered obsidian — the shade’s tether.' }],
  },
];

// ── The Outside (Occultist — Cosmologist) ───────────────────────
// The dangerous blaster — bespoke, not a builder. Wis aims every attack; Con is
// the fuse (Overload). Eldritch is his only damage type: it attacks AC and
// ignores Temp HP, and almost nothing in the world resists it. His chaos is the
// Madness ladder (Confused → Insane, see the Conditions page). Card names are
// provisional (Les to bless/rename); the transformative Vows come later.
const ELDRITCH_NOTE = 'Eldritch Damage ignores Temp HP.';
// Overload is per-card — the Surge clause differs by Ability; the save/backlash
// tail is the same. OVERLOAD_NOTE is the default (+Con damage or +1 target).
const OVERLOAD_NOTE = 'Overload — when you use this Ability you may Overload it. You may choose to do +Con Damage or hit +1 target within range. Then make a Constitution Save against this Ability’s own Save DC. On a failure you take 1d4 Eldritch damage (it cannot be reduced); on a critical failure you are also Dazed (no Reactions or Interrupts) until your next turn.';
const OVERLOAD_GAZE = 'Overload — when you use this Ability you may Overload it. You may choose to do +1 target within range, or increase the Effect or Duration Ladder by one step. Then make a Constitution Save against this Ability’s own Save DC. On a failure you take 1d4 Eldritch damage (it cannot be reduced); on a critical failure you are also Dazed (no Reactions or Interrupts) until your next turn.';
const OVERLOAD_PANDEMONIUM = 'Overload — when you use this Ability you may Overload it. You may choose to increase the Range, Area Effect, Effects or Duration Ladders by one step. Then make a Constitution Save against this Ability’s own Save DC. On a failure you take 1d6 Eldritch damage (it cannot be reduced); on a critical failure you are also Dazed (no Reactions, Interrupts, or Minor Action) until your next turn.';
const OVERLOAD_VISAGE = 'Overload — when you use this Ability you may Overload it. You may choose to replace the −# to attack with “roll twice and take the worst result”, or +Con Eldritch damage. Then make a Constitution Save against this Ability’s own Save DC. On a failure you take 1d6 Eldritch damage (it cannot be reduced); on a critical failure you are also Dazed (no Reactions, Interrupts, or Minor Action) until your next turn.';
const ORB_HOOK = ['Orb → +1 to your Overload Constitution Saves (the globe steadies the channel)'];
// Fuller implement hooks for the ability cards (Orb is the Cosmologist's own;
// the rest are off-list, via multiclass), parallel to New Magic's.
const OUTSIDE_IMPL = [
  'Orb → +1 to your Overload Constitution Saves',
  'Wand → +1 to hit',
  'Magic Staff → +1 to one Defence until your next round',
  'Spellbook → Range, Damage, Effect or Duration Ladder can be increased one step',
  'Scroll → once per encounter, cast without consuming the scroll',
];
const ELDRITCH_DMG: Variable = { base: '1d6 Eldritch', advances: [{ value: '1d6 + Wis Eldritch', cost: 'm' }, { value: '1d8 + Wis Eldritch', cost: 'm' }, { value: '2d8 + Wis Eldritch', cost: 'M', note: 'L5' }] };
// Mirrors the Madness ladder on the Conditions page.
const MAD_LADDER: Variable = {
  base: 'Confused — it rolls on the Confusion table each turn',
  advances: [
    { value: 'Confused, −1 to the Confusion roll', cost: 'm' },
    { value: 'Confused, −2 to the Confusion roll', cost: 'm' },
    { value: 'Insane — a single action each turn: an unarmed attack against itself', cost: 'M' },
  ],
};

const OVERLOAD_ORB = 'Overload — when you use this Ability you may Overload it. You may choose to do +Con Damage for any damaging effect, or hit +1 target within range, or improve one Ladder by one Rank. Then make a Constitution Save against this Ability’s own Save DC. On a failure you take 1d4 Eldritch damage (it cannot be reduced); on a critical failure you are also Dazed (no Reactions or Interrupts) until your next turn.';
const WIELD_ORB: Ability = {
  name: 'Wield Orb', category: 'The Outside', role: 'Utility · orb engine', mode: 'Effect',
  vars: {
    frequency: FREQ_2ENC,
    action: actionCost({ act: 'varies', detail: 'the orb\'s own activation' }),
    effects: WIELD_EFFECTS('Orb'),
  },
  options: [
    { label: 'Overload', note: OVERLOAD_ORB, placement: 'top' },
    { label: 'Generic Advancement Ladder', note: GA_NOTE('orb'), ladders: [GENERIC_ADV] },
    { label: 'Implement Specialization Hooks', note: GA_SPECIALIZATION('orb', 'Orb Specialization'), detail: ORB_HOOK },
  ],
};

const OUTSIDE: Ability[] = [
  {
    name: 'Eldritch Blast', category: 'The Outside', role: 'Offensive · blast', mode: 'Attack',
    vars: {
      frequency: FREQ_ATWILL_L3,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Wisdom vs AC' },
      damage: ELDRITCH_DMG,
      duration: { base: 'Instant' },
    },
    options: [
      { label: 'Overload', note: OVERLOAD_NOTE, placement: 'top' },
      { label: 'Eldritch Damage', note: ELDRITCH_NOTE },
      { label: 'Implement Specialization Hooks', detail: OUTSIDE_IMPL },
    ],
  },
  {
    name: 'Unraveling Gaze', category: 'The Outside', role: 'Offensive · Madness', mode: 'Attack',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: { base: 'One' },
      attack: { base: 'Wisdom vs Unarmoured Wisdom' },
      effects: MAD_LADDER,
      duration: ongoingDuration('Wis'),
    },
    options: [
      { label: 'Overload', note: OVERLOAD_GAZE, placement: 'top' },
      { label: 'Implement Specialization Hooks', detail: OUTSIDE_IMPL },
    ],
  },
  {
    name: 'Pandemonium', category: 'The Outside', role: 'Control · area', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: STD_RANGE,
      targets: STD_AREA,
      attack: { base: 'Wisdom vs Unarmoured Wisdom' },
      damage: { base: 'Wis Eldritch' },
      effects: MAD_LADDER,
      duration: ongoingDuration('Wis'),
    },
    options: [
      { label: 'Overload', note: OVERLOAD_PANDEMONIUM, placement: 'top' },
      { label: 'Eldritch Damage', note: ELDRITCH_NOTE },
      { label: 'Implement Specialization Hooks', detail: OUTSIDE_IMPL },
    ],
  },
  {
    name: 'Impossible Visage', category: 'The Outside', role: 'Defensive', mode: 'Effect',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_MINOR,
      range: { base: 'Self' },
      effects: {
        base: 'You are wrong to look upon: −1 for all opponents to attack you directly.',
        advances: [
          { value: '−2 for all opponents to attack you directly', cost: 'm' },
          { value: '−2 for all opponents to attack you directly, and those that do take 1 Eldritch damage', cost: 'm' },
          { value: '−2 for all opponents to attack you directly, and those that do take Wis Eldritch damage', cost: 'M' },
        ],
      },
      duration: {
        base: 'Wis rounds',
        advances: [
          { value: 'Wis + 1 rounds', cost: 'm' },
          { value: 'Wis + 2 rounds', cost: 'm' },
          { value: 'The encounter', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'Overload', note: OVERLOAD_VISAGE, placement: 'top' },
      { label: 'Eldritch Damage', note: ELDRITCH_NOTE },
      { label: 'Implement Specialization Hooks', detail: OUTSIDE_IMPL },
    ],
  },
  {
    name: 'Conversant with the Outside', category: 'The Outside', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'defenceMod', value: 1, attr: 'Wisdom' }, { kind: 'saveMod', value: 1, attr: 'Wisdom' }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to your Wisdom Defence and Wisdom Saves, and DR 3 against Psychic damage. The cost: −1 Charisma.',
      },
    },
  },
  {
    name: 'Observer of the Outside', category: 'The Outside', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'defenceMod', value: 1, attr: 'Intelligence' }, { kind: 'saveMod', value: 1, attr: 'Intelligence' }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to your Intelligence Defence and Intelligence Saves, and DR 3 against Radiant damage. The cost: −1 Dexterity.',
      },
    },
  },
  {
    name: 'Traveller', category: 'The Outside', role: 'Vow', mode: 'Passive',
    passiveEffects: [{ kind: 'defenceMod', value: 1, attr: 'Constitution' }, { kind: 'saveMod', value: 1, attr: 'Constitution' }],
    vars: {
      frequency: FREQ_PASSIVE,
      effects: {
        base: '+1 to your Constitution Defence and Constitution Saves, and DR 3 against Cold damage. The cost: −1 Strength.',
      },
    },
  },
  WIELD_ORB,
];

// ── Harvest (Naturalist — Class) ────────────────────────────────
// The common country craft, wholly mundane — what every village expects of
// the land-wise. No attacks: the teeth live in the Subclasses (Old Magic, the
// Botanist's learning, the Hound Master's dog). Mechanical theme: TEMP HP AS
// COMFORT — a full belly, a dry bed, a warm welcome. Kept small (2s and 3s,
// Bulwark's range), granted out of combat and carried into the day; it stacks
// with other small sources per the small-numbers rule. Distinct lanes held:
// no HP healing (Mercy is the floor), supply-of-comfort not ascetic-immunity
// (that's Pilgrim's Endurance), and nothing animal (saved for Husbandry).
const HARVEST: Ability[] = [
  {
    name: 'Provender', category: 'Harvest', role: 'Utility · provision', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'downtime', detail: 'foraging and gathering, over the day’s travel or rest' }),
      range: { base: 'The surrounding country' },
      targets: {
        base: 'Yourself',
        advances: [
          { value: 'Yourself and your immediate travelling companions', cost: 'm' },
          { value: 'Up to 10 people', cost: 'm' },
          { value: 'Up to 20 people', cost: 'M' },
        ],
      },
      effects: {
        base: 'The land feeds them: a day’s food and water, and the makings your craft needs (herbs, simples, salves). Those who eat the hot meal gain 1 Temp HP.',
        advances: [
          { value: 'The land feeds them: a day’s food and water, and the makings your craft needs. Those who eat the hot meal gain 2 Temp HP.', cost: 'm' },
          { value: 'The land feeds them: a day’s food and water, and the makings your craft needs. Those who eat the hot meal gain 3 Temp HP.', cost: 'm' },
          { value: 'The land feeds them: a day’s food and water, and the makings your craft needs. Those who eat the hot meal gain 3 Temp HP and +1 to Saves, and you discover 1d4 Supply for a Herbalist’s Bag.', cost: 'M' },
        ],
      },
      duration: { base: 'The day (Temp HP until lost)' },
    },
    options: [{ label: 'Ingredients', note: 'The Naturalist will need 1 cp worth of seasonings for every 10 people.' }],
  },
  {
    name: 'Simples', category: 'Harvest', role: 'Remedy', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest', detail: 'brewing; a Minor Action to drink' }),
      range: { base: 'The draught is carried and drunk' },
      targets: {
        base: 'One draught',
        advances: [
          { value: 'Two draughts', cost: 'm' },
          { value: 'Wis draughts', cost: 'm' },
          { value: 'Wis + 2 draughts, and they keep for a week', cost: 'M' },
        ],
      },
      effects: {
        base: 'The drinker takes +1 on Saves against poison and disease (a poison’s Interval Saves included).',
        advances: [
          { value: 'The drinker takes +1 on Saves against poison and disease (Interval Saves included), and may make a Save immediately', cost: 'm' },
          { value: 'The drinker takes +1 on Saves against poison and disease (Interval Saves included), may make a Save immediately, and gains 1 Temp HP', cost: 'm' },
          { value: 'The drinker takes +2 on Saves against poison and disease (Interval Saves included), may make a Save immediately, and gains 2 Temp HP', cost: 'M' },
        ],
      },
      duration: { base: 'The draughts are meant to be drunk within 24 hours (the Targets ladder can extend their keeping); the Save bonus and Temp HP also last 24 hours.' },
    },
    options: [{ label: 'Materials', note: 'Requires a Herbalist’s Bag, and uses 1 Supply per draught. Draughts not drunk right away need a suitable vessel (bottle, flask, or the like).' }],
  },
  {
    name: 'Hedge-Wise', category: 'Harvest', role: 'Movement · defensive', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      targets: {
        base: 'Self',
        advances: [
          { value: 'Self + one ally following your line', cost: 'm' },
          { value: 'Self + Wis allies following your line', cost: 'm' },
          { value: 'The whole company, single file at your pace', cost: 'M' },
        ],
      },
    },
    extraVars: [
      {
        name: 'Effect(s) — In Combat',
        base: 'You ignore Difficult Terrain movement penalties from vegetation.',
        advances: [
          { value: 'Ignore Difficult Terrain from vegetation, and +1 Stealth while in vegetation', cost: 'm' },
          { value: 'Ignore Difficult Terrain from vegetation, and +1 Stealth and +1 AC while in vegetation', cost: 'm' },
          { value: 'Ignore Difficult Terrain from vegetation, and +1 Stealth, +1 AC, and DR 2 while in vegetation', cost: 'M' },
        ],
      },
      {
        name: 'Effect(s) — Overland',
        base: 'You ignore Difficult Terrain movement penalties from vegetation.',
        advances: [
          { value: 'Ignore Difficult Terrain from vegetation, and +1 Stealth and +1 Initiative while travelling where the vegetation is high or dense enough to partially conceal the travellers', cost: 'm' },
          { value: 'Ignore Difficult Terrain from vegetation, +1 Stealth and +1 Initiative while travelling in concealing vegetation, and the DC to track the travellers is increased by 1', cost: 'm' },
          { value: 'Ignore Difficult Terrain from vegetation, +2 Stealth and +2 Initiative while travelling in concealing vegetation, and the DC to track the travellers is increased by 2', cost: 'M' },
        ],
      },
    ],
    options: [
      { label: 'Two Ladders', note: 'The In-Combat and Overland Effect Ladders are bought and climbed separately. The Targets Ladder extends the Overland effects only — in combat, Hedge-Wise is always Self.' },
    ],
  },
  {
    name: 'Countryman’s Welcome', category: 'Harvest', role: 'Utility · social', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'an evening’s fellowship' }),
      range: { base: 'A farmstead, hamlet or village' },
      targets: {
        base: 'Self',
        advances: [
          { value: 'Self + 1 Ally', cost: 'm' },
          { value: 'Self + Wis Allies', cost: 'm' },
          { value: 'Self and all Allies', cost: 'm' },
          { value: 'Self and all Allies, and you can extend the welcome to Wis days', cost: 'M' },
        ],
      },
      effects: {
        base: 'Country folk take you for their own: board and lodging offered where strangers are turned away, and rural NPC Attitude starts one step better toward you and your company.',
        advances: [
          { value: 'Country folk take you for their own: board and lodging offered, rural NPC Attitude one step better, and the lodging, hearth and fellowship provide 1 Temp HP', cost: 'm' },
          { value: 'Country folk take you for their own: board and lodging offered, rural NPC Attitude one step better, and the lodging, hearth and fellowship provide 2 Temp HP', cost: 'm' },
          { value: 'Country folk take you for their own: board and lodging offered, rural NPC Attitude one step better, 2 Temp HP, and they will provide you with material aid, per the DM’s adjudication', cost: 'M' },
        ],
      },
      duration: { base: 'Temp HP last 24 hours' },
    },
  },
  {
    name: 'Beast-Wise', category: 'Harvest', role: 'Utility · animals', mode: 'Passive',
    passiveEffects: [{ kind: 'skillMod', value: 1, skill: 'Handle Animal' }],
    vars: {
      frequency: FREQ_PASSIVE,
      targets: { base: 'Self' },
      effects: {
        base: '+1 to Handle Animal checks.',
        advances: [
          { value: '+1 to Handle Animal checks, and you may Push a trained animal as a Minor Action (the skill’s own ceiling is a Move Action)', cost: 'm' },
          { value: '+1 to Handle Animal checks, Push a trained animal as a Minor Action, Calm or Control extends to wild animals, and training an animal takes days, not weeks', cost: 'm' },
          { value: '+2 to Handle Animal, Push as a Free Action (once per turn), and Calm or Control works even on beasts set against you — another’s guard-dog, a war-trained mount', cost: 'M' },
        ],
      },
    },
  },
  {
    name: 'Eola-Gesta', category: 'Harvest', role: 'Utility · social', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'an evening’s cavorting at a pub, inn, festival or similar gathering' }),
      range: { base: 'The building or event' },
      targets: { base: 'Self' },
      effects: {
        base: 'The Naturalist becomes trained in Gather Information, which is Wis-based and can only be used with this Ability.',
        advances: [
          { value: 'Trained in Gather Information (Wis-based, only with this Ability), at +1 to the roll', cost: 'm' },
          { value: 'Trained in Gather Information (Wis-based, only with this Ability), at +1 to the roll, and NPC Attitudes toward you are improved by 1 step', cost: 'm' },
          { value: 'Trained in Gather Information (Wis-based, only with this Ability), at +2 to the roll, and NPC Attitudes toward you are improved by 2 steps', cost: 'M' },
        ],
      },
    },
    extraVars: [
      {
        name: 'Cost',
        base: '2 sp worth of drink and food, supplied or purchased',
        advances: [
          { value: '1 sp', cost: 'm' },
          { value: '5 cp', cost: 'm' },
          { value: 'Free', cost: 'M' },
        ],
      },
    ],
  },
];

// ── Husbandry (Naturalist — Shepherd) ───────────────────────────
// The Shepherd's craft: the dog. Home of the game's first Animal Companion.
// The general Companion rules now live in mechanics/companions.md and, as
// data, in lib/companions.ts — this card states only what is the dog's own.
// COMPANION RULES (general — locked by Les, Aug 2 2026, for ALL Companions):
// a Companion is nameable and describable by the player (the future Character
// Builder must carry fields for both on every Companion card).
// A Companion has its own Level — 0 when bonded, rising whenever its owner
// levels thereafter, so one taken late or replaced lags naturally. Each of its
// own levels earns it 1 Minor, and every third level a Major (m-m-M) —
// slimmer than a PC's curve, so the beast stays a beast. The owner may ALSO
// spend his own Advances on the Companion's Ladders (normal pacing). If the
// Companion dies, the owner's invested Advances return to him, to respend on
// himself or on a new companion; the beast's own earned Advances die with it.
const HUSBANDRY: Ability[] = [
  {
    name: 'Shepherd’s Dog', category: 'Husbandry', role: 'Companion', companionType: 'Beast', mode: 'Passive',
    vars: {
      frequency: frequency({ freq: 'passive', detail: 'the dog is always with you' }),
    },
    extraVars: [
      {
        name: 'Defences',
        base: 'AC 12, other Defences 10',
        advances: [
          { value: 'AC 13, other Defences 10, DR 1, Resist Cold 1', cost: 'm' },
          { value: 'AC 13, other Defences 11, DR 1, Resist Cold 1', cost: 'm' },
          { value: 'AC 14, other Defences 11, DR 2, Resist Cold 1', cost: 'M' },
        ],
      },
      {
        name: 'Attack',
        base: 'Bite +2, 1d4',
        advances: [
          { value: 'Bite +3, 1d4', cost: 'm' },
          { value: 'Bite +3, 1d6', cost: 'm' },
          { value: 'Bite +4, 1d6+1', cost: 'M' },
        ],
      },
      {
        name: 'HP',
        base: '5',
        advances: [
          { value: '7', cost: 'm' },
          { value: '9', cost: 'm' },
          { value: '12', cost: 'M' },
        ],
      },
      {
        name: 'Speed',
        base: "40'",
        advances: [
          { value: "45'", cost: 'm' },
          { value: "50'", cost: 'm' },
          { value: "60'", cost: 'M' },
        ],
      },
      {
        name: 'Orders',
        base: 'As many Orders as its owner’s Wis',
        advances: [
          { value: 'As many Orders as its owner’s Wis + 1', cost: 'm' },
          { value: 'As many Orders as its owner’s Wis + 2', cost: 'm' },
          { value: 'As many Orders as its owner’s Wis + 4', cost: 'M' },
        ],
      },
    ],
    options: [
      {
        label: 'The Guard Dog',
        note: 'An average guard dog, Level 0:',
        detail: [
          "HP 5 · Speed 40'",
          'AC 12 · other Defences 10 · DC 10 (= 10 + its Level)',
          'Bite +2 vs AC, 1d4 damage',
        ],
        placement: 'top',
      },
      {
        label: 'Senses',
        note: 'Perception +3, and it smells what no man can.',
      },
      {
        label: 'Interpose',
        note: 'Built in. Interrupt, when an opponent attempts to move adjacent to an ally: the dog may shift 10\' and snap at them — the opponent takes −1 on attacks until the end of its next turn.',
      },
      {
        label: 'Orders',
        note: 'The dog knows as many Orders as its Orders Ladder allows, chosen from the list. [[Order effects to come]]',
        detail: ['Come', 'Stay', 'Attack', 'Guard', 'Fetch', 'Follow'],
      },
      {
        label: 'Bonding',
        note: 'Bonding a dog takes weeks of training — days, with Beast-Wise.',
      },
    ],
  },
  {
    name: 'Worry', category: 'Husbandry', role: 'Offensive · control', mode: 'Effect',
    vars: {
      frequency: FREQ_FULL,
      action: ACTION_SMM,
      range: { base: 'The dog, within earshot of your whistle' },
      targets: { base: 'One opponent the dog can reach' },
      attack: { base: 'The dog’s Bite vs AC' },
      damage: { base: 'The dog’s Bite (its Attack Ladder)' },
      effects: {
        base: 'On a hit, the dog worries what it grips: the target is Slowed (half Speed) until the end of its next turn.',
        advances: [
          { value: 'On a hit, the target is Slowed (half Speed) and cannot shift while the dog is adjacent, until the end of its next turn', cost: 'm' },
          { value: 'On a hit, the target is Immobilized while the dog stays adjacent, until the end of its next turn', cost: 'm' },
          { value: 'On a hit, the target is Immobilized while the dog stays adjacent, and dragged down — knocked Prone', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of the target’s next turn' },
    },
    options: [{ label: 'The Dog', note: 'Requires your dog in the field.' }],
  },
  {
    name: 'The Dog Watches', category: 'Husbandry', role: 'Utility · camp', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest', detail: 'the dog stands sentry while the whole company sleeps' }),
      range: { base: 'The camp' },
      targets: { base: 'You and all who rest with you' },
      effects: {
        base: 'The camp cannot be surprised while the dog watches: 2 hours of the rest, guarded by its nose and ears (Perception +3).',
        advances: [
          { value: 'The camp cannot be surprised while the dog watches: 4 hours of the rest, guarded by its nose and ears (Perception +3)', cost: 'm' },
          { value: 'The camp cannot be surprised while the dog watches: the whole rest, guarded by its nose and ears (Perception +3)', cost: 'm' },
          { value: 'The camp cannot be surprised for the whole rest, and the dog wakes you quietly, and in time: the company meets any night attack on its feet, weapons in hand', cost: 'M' },
        ],
      },
      duration: { base: 'The rest' },
    },
    options: [{ label: 'The Dog', note: 'No one stands watch rotation — the dog does. The company sleeps whole.' }],
  },
  {
    name: 'Turn the Wolf', category: 'Husbandry', role: 'Defensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_WARD_REACTION,
      range: { base: '1×WRI' },
      targets: { base: 'The moving opponent' },
      attack: { base: 'Dex vs AC' },
      damage: {
        base: 'W',
        advances: [
          { value: 'W + 1', cost: 'm' },
          { value: 'W + Dex', cost: 'm' },
          { value: '2[W] + Dex', cost: 'M', note: 'L5' },
        ],
      },
      effects: {
        base: 'On a hit, the advance breaks: the target’s movement ends where it stands.',
        advances: [
          { value: 'On a hit, the target’s movement ends where it stands, and −1 to its attacks until the end of its next turn', cost: 'm' },
          { value: 'On a hit, the target must end its turn where it stands, and −1 to its attacks until the end of its next turn', cost: 'm' },
          { value: 'On a hit, the target is Turned: it cannot willingly approach your flock (you, and allies within 10\' of you) until the end of its next turn', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of the target’s next turn' },
    },
    options: [{ label: 'Specialization Hook', note: 'With the Slings Specialization Feat: the stone also Pushes the target 5\'.' }],
  },
  {
    name: 'Ward the Fold', category: 'Husbandry', role: 'Defensive', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_WARD_REACTION,
      range: { base: 'Spear’s reach' },
      targets: { base: 'The approaching opponent' },
      attack: { base: 'Dex vs AC' },
      damage: {
        base: 'W',
        advances: [
          { value: 'W + 1', cost: 'm' },
          { value: 'W + Str', cost: 'm' },
          { value: '2[W] + Str', cost: 'M', note: 'L5' },
        ],
      },
      effects: {
        base: 'On a hit, Push the opponent 5\', away from the ally.',
        advances: [
          { value: 'On a hit, Push the opponent 10\', away from the ally', cost: 'm' },
          { value: 'On a hit, Push the opponent 10\' away from the ally, and −1 to its attacks until the end of its next turn', cost: 'm' },
          { value: 'On a hit, Push the opponent 10\' and it is driven off: it cannot approach that ally again until the end of its next turn', cost: 'M' },
        ],
      },
      duration: { base: 'Until the end of the target’s next turn' },
    },
    options: [{ label: 'Specialization Hook', note: 'With the Spears/Polearms Specialization Feat: your reach for this Interrupt extends 5\'.' }],
  },
  {
    name: 'Drive Them', category: 'Husbandry', role: 'Offensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_STANDARD,
      range: { base: 'An opponent adjacent to you or your dog' },
      targets: {
        base: 'One opponent',
        advances: [{ value: 'Two opponents (each adjacent to you or the dog)', cost: 'm' }],
      },
      attack: { base: 'Wis vs Unarmoured Wisdom — man or beast, the pair work them like sheep' },
      damage: { base: '—' },
      effects: {
        base: 'Slide the target 5\' in a direction of your choice — bunch the pack together, or cut one out from it.',
        advances: [
          { value: 'Slide the target 10\' in a direction of your choice', cost: 'm' },
          { value: 'Slide the target 10\' in a direction of your choice, and the dog may shift 5\' to keep the press', cost: 'm' },
          { value: 'Slide the target 10\' and it is Driven: it cannot willingly move back the way it was driven until the end of its next turn', cost: 'M' },
        ],
      },
      duration: { base: 'Instant' },
    },
    options: [{ label: 'The Dog', note: 'Requires your dog in the field.' }],
  },
  {
    name: 'Ninety and Nine', category: 'Husbandry', role: 'Utility', mode: 'Passive',
    vars: {
      frequency: FREQ_PASSIVE,
      targets: { base: 'Your company — those who travel and camp with you' },
      effects: {
        base: 'Counting without counting: you know at a glance whether the company is whole, and notice at once when someone slips away or is taken, within your senses or the dog’s.',
        advances: [
          { value: 'You know the moment one strays beyond a bowshot of the company, wherever you are', cost: 'm' },
          { value: 'You know the moment one strays beyond a bowshot of the company, and the direction they lie in', cost: 'm' },
          { value: 'You know the moment one strays beyond a bowshot of the company, and the direction they lie in — and the dog can follow their trail unerringly, up to a day cold', cost: 'M' },
        ],
      },
    },
  },
];

// ── Botany (Naturalist — Botanist) ──────────────────────────────
// The formally educated man of science: plant chemistry as power. The
// Physician keeps surgery and healing; Simples keeps the kindly draughts;
// Botany is the dark green chemistry — poisons, distillates, fumes — plus
// the learning that schooled him. Three cards reused verbatim: Envenom
// (Medicine), Research and Recall (Letters — the Naturalist has no Letters,
// so his schooled Subclass carries the study). All attacks aim with Int.
// The preparations draw on the Herbalist's Bag and its Supplies, and
// Brew Poison is the poison system's player-facing craftsman.
const BOTANY: Ability[] = [
  ENVENOM,
  RESEARCH,
  RECALL,
  {
    name: 'Brew Poison', category: 'Botany', role: 'Utility · craft', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'uncapped', detail: 'limited by time and makings' }),
      action: actionCost({ act: 'downtime', time: 'a full day', detail: 'brewing' }, { act: 'downtime', time: '8 hours', detail: 'brewing', cost: 'm' }, { act: 'downtime', time: '4 hours', detail: 'brewing', cost: 'm' }, { act: 'downtime', time: '2 hours', detail: 'brewing', cost: 'M' }),
      targets: {
        base: '1 dose',
        advances: [
          { value: '2 doses', cost: 'm' },
          { value: 'Int doses', cost: 'm' },
          { value: 'Int ×2 doses', cost: 'M' },
        ],
      },
      effects: {
        base: 'Brew a poison whose recipe you know, at its stated Save DC, Onset and potency. Recipes are found, bought, or taught — as spells are.',
        advances: [
          { value: 'Brew a poison whose recipe you know, at +1 to its Save DC', cost: 'm' },
          { value: 'Brew a poison whose recipe you know, at +1 to its Save DC, and adjust the Onset by one Rank, faster or slower', cost: 'm' },
          { value: 'Brew a poison whose recipe you know, at +2 to its Save DC, and adjust the Onset by one Rank, faster or slower', cost: 'M' },
        ],
      },
      duration: {
        base: 'The brew keeps 1 day',
        advances: [
          { value: 'The brew keeps Int days', cost: 'm' },
          { value: 'The brew keeps 7 days', cost: 'm' },
          { value: 'The brew keeps 30 days', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'Materials', note: 'Requires a recipe and a Herbalist’s Bag; 2 Supplies per dose. What you brew follows the poison rules — Application, Onset, Duration, Intervals, Save DC.' },
    ],
  },
  {
    name: 'Vitriol', category: 'Botany', role: 'Offensive', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: actionCost({ act: 'full-round', detail: 'you mix the ingredients and throw them' }, { act: 'standard', detail: 'you mixed them beforehand', cost: 'M' }),
      range: STD_THROWN,
      targets: { base: '1', advances: [{ value: '5\' radius splash', cost: 'M' }] },
      attack: { base: 'Int vs AC' },
      damage: {
        base: '1d4 Acid',
        advances: [
          { value: '1d4 + 1 Acid', cost: 'm' },
          { value: '1d4 + Int Acid', cost: 'm' },
          { value: '2d4 + Int Acid', cost: 'M', note: 'L5' },
        ],
      },
      effects: {
        base: 'Ongoing 1 Acid',
        advances: [
          { value: 'Ongoing 2 Acid', cost: 'm' },
          { value: 'Ongoing 2 Acid, and −1 to the Save against it', cost: 'm' },
          { value: 'Ongoing 3 Acid, and −1 to the Save against it', cost: 'M' },
        ],
      },
      duration: ongoingDuration('Int'),
    },
    options: [
      { label: 'Materials', note: '2 Supplies from a Herbalist’s Bag per attack.' },
    ],
  },
  {
    name: 'Stupefying Fumes', category: 'Botany', role: 'Offensive · control', mode: 'Attack',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_STANDARD,
      range: STD_THROWN,
      targets: {
        base: 'All creatures in a 5\' radius — the fumes do not pick sides',
        advances: [
          { value: 'All creatures in a 10\' radius — the fumes do not pick sides', cost: 'M' },
          { value: 'All creatures in a 15\' radius — the fumes do not pick sides', cost: 'M' },
        ],
      },
      attack: { base: 'Int vs Unarmoured Constitution' },
      effects: DAZE_EFFECTS,
      duration: {
        base: 'The cloud lasts 1 round',
        advances: [
          { value: 'The cloud lasts Int rounds', cost: 'm' },
          { value: 'The cloud lasts Int + 1 rounds', cost: 'm' },
          { value: 'The cloud lasts Int ×2 rounds', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'Materials', note: '2 Supplies from a Herbalist’s Bag per pot. A strong wind clears the cloud in 1 round.' },
    ],
  },
  {
    name: 'Laudanum', category: 'Botany', role: 'Utility · succour', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'at-will', detail: 'one prepared dose per use' }),
      action: actionCost({ act: 'minor', detail: 'administer a prepared dose' }),
      range: { base: 'Touch' },
      targets: { base: 'One creature' },
      effects: {
        base: 'The dose quiets pain: suppress the penalties of one bodily Condition — not cured, only stilled.',
        advances: [
          { value: 'Suppress the penalties and ongoing damage of one bodily Condition — not cured, only stilled', cost: 'm' },
          { value: 'Suppress the penalties and ongoing damage of two bodily Conditions — not cured, only stilled', cost: 'm' },
          { value: 'Suppress the penalties and ongoing damage of two bodily Conditions, and the Wounded Condition’s penalties too — not cured, only stilled', cost: 'M' },
        ],
      },
      duration: {
        base: '1 minute',
        advances: [
          { value: '10 minutes', cost: 'm' },
          { value: '1 hour', cost: 'm' },
          { value: '8 hours', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'The Numbing', note: 'The dose dulls as it soothes: −1 to Perception and to Int-based checks while it lasts.' },
      { label: 'Materials', note: 'Each dose is prepared in advance, during a rest, from your Herbalist’s Bag — 1 Supply per dose.' },
    ],
  },
];

// ── Old Magic (Naturalist — Drymann) ────────────────────────────
// The sixth well: animism — spirits of place, beast, storm and stone,
// bargained with, never commanded. Two spines give the category its feel:
// OFFERINGS — every potent working spends Supplies from the Offerings Bag
// (fetishes and humble gifts, gathered with effort via The Old Custom, not
// coin); and PLACE — the Drymann wakes what is already there (root, stone,
// current, wind), so his power is keyed to the ground he stands on. All
// attacks aim with Cha (the parley). The spirits are addressed in the First
// Tongue (NOT Kellish — most Drymanns are no Kells). Distinct lanes held:
// no curses (Witchcraft), no elements hurled (New Magic), no dead (Occult).
const OLD_MAGIC: Ability[] = [
  {
    name: 'The Old Custom', category: 'Old Magic', role: 'Utility · foundation', mode: 'Effect',
    vars: {
      frequency: frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'm' }),
      action: actionCost({ act: 'scene', detail: 'a few minutes among the spirits of a place' }),
      range: { base: 'The place you stand in' },
      effects: {
        base: 'See and address the spirits of place and tree, beast, storm and stone, in the First Tongue. Learn the spirit’s temper, and what it treasures.',
        advances: [
          { value: 'Ask what it has seen: the place answers as a witness — who passed, what was done, within the last day', cost: 'm' },
          { value: 'Ask what it has seen: the place answers as a witness — who passed, what was done, within the last week', cost: 'm' },
          { value: 'Ask what it has seen: the place answers as a witness, within the living memory of the place — old spirits remember long, and old trees longest of all', cost: 'M' },
        ],
      },
    },
    options: [
      {
        label: 'Filling the Bag',
        note: 'An hour spent attending a place’s spirits gathers what they treasure — feathers, bone, river-glass, old iron, bread put by: 1d4 Supplies for an Offerings Bag. Effort, not coin — the only other way to fill it is buying (1 sp per 10).',
      },
    ],
  },
  {
    name: 'Dream Beneath the Yew Bough', category: 'Old Magic', role: 'Healing · camp', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'rest', detail: 'a night’s tending' }),
      targets: campTargets('Cha'),
      effects: {
        base: 'Tended sleep mends: targets recover 1 extra HP after the rest.',
        advances: [
          { value: 'Tended sleep mends: targets recover 2 extra HP after the rest', cost: 'm' },
          { value: 'Tended sleep mends: targets recover 2 extra HP after the rest, and may make a Save against any poison or disease they are currently suffering from', cost: 'm' },
          { value: 'Tended sleep mends: targets recover 2 extra HP after the rest, may make a Save against any poison or disease, and may attempt to recover from 1 Wound or 1 point of Attribute Damage (DC as Full Bed Rest with a Healer or Attendant)', cost: 'M' },
        ],
      },
      duration: { base: 'The rest' },
    },
    options: [
      { label: 'Offerings', note: '1 Supply from the Offerings Bag per patient — a candle kept burning, salt at the bedposts. Nothing shows: he only sat with them through the night, and the fever broke.' },
    ],
  },
  {
    name: 'The Warning', category: 'Old Magic', role: 'Defensive · deterrent', mode: 'Attack',
    vars: {
      frequency: FREQ_2ENC,
      action: ACTION_STANDARD,
      range: { base: 'Staff’s reach' },
      targets: { base: 'One' },
      attack: { base: 'Cha vs AC (Staff)' },
      damage: { base: 'W (fixed — a rap, not a wound)' },
      effects: FEAR_EFFECTS,
      duration: { base: 'Save ends' },
    },
  },
  {
    name: 'Favour of the Fauna', category: 'Old Magic', role: 'Utility', mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: actionCost({ act: 'scene', detail: 'a minute of discussion with a beast' }, { act: 'full-round', detail: 'in an encounter', cost: 'M' }),
      range: STD_RANGE,
      targets: {
        base: '1 small animal (a bird, a squirrel)',
        advances: [
          { value: 'Cha small animals, or 1 medium animal (a fox, a badger)', cost: 'm' },
          { value: 'Cha ×2 small animals, or 2 medium animals', cost: 'm' },
          { value: 'A swarm of small animals, Cha medium animals, or 1 large animal (a wolf, a black bear)', cost: 'M' },
        ],
      },
      effects: {
        base: 'Converse with the animal(s) — simple questions and answers, as its wits allow — and its Attitude improves one step.',
        advances: [
          { value: 'Converse with the animal(s); its Attitude improves one step, and it will do a brief favour for you, and may ask one in return', cost: 'm' },
          { value: 'Converse with the animal(s); its Attitude improves two steps, and it will provide friendly advice and service for up to 4 hours, depending on its nature', cost: 'm' },
          { value: 'Converse with the animal(s); its Attitude improves two steps, and it will fight for you for a short time, as its abilities and bravery allow — it will not sacrifice itself', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'Offerings', note: '1–6 Supplies from the Offerings Bag, depending on the number and size of the animals and the favour asked (the DM adjudicates).' },
    ],
  },
  {
    name: 'Threshold Ward', category: 'Old Magic', role: 'Defensive · home-magic', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'varies', detail: 'depends on Target and Duration — anywhere from a few minutes to an hour of work, or several days carving stones if Permanent' }),
      targets: {
        base: 'A threshold — a door, gate, or the entrance of a camp',
        advances: [
          { value: 'A 10\' radius circle', cost: 'm' },
          { value: 'A 15\' radius circle', cost: 'm' },
          { value: 'A 20\' radius circle', cost: 'M' },
        ],
      },
      effects: {
        base: 'Any creature crossing the boundary activates the Ward, notifying the Drymann or everyone inside (the Drymann chooses upon creation).',
        advances: [
          { value: 'Crossing the boundary activates the Ward, notifying the Drymann or everyone inside (chosen upon creation), and Undead may not cross', cost: 'm' },
          { value: 'Crossing the boundary activates the Ward, notifying the Drymann or everyone inside (chosen upon creation); Undead may not cross, and any uninvited creature must make a Wis Save to cross or to attack anyone inside', cost: 'm' },
          { value: 'Crossing the boundary activates the Ward, notifying the Drymann or everyone inside (chosen upon creation); Undead may not cross, any uninvited creature must make a Wis Save to cross or to attack anyone inside, and those inside have +1 to all Defences and Saves', cost: 'M' },
        ],
      },
      duration: {
        base: '24 hours',
        advances: [
          { value: '1 week', cost: 'm' },
          { value: '1 month', cost: 'm' },
          { value: 'Permanent', cost: 'M' },
        ],
      },
    },
    options: [
      { label: 'Offerings', note: 'Depends on Duration: 1 Supply for 24 hours, 2 Supplies for 1 week, 4 Supplies for 1 month. A Permanent ward requires the runes be carved into stone in the First Tongue, and consumes 10 Supplies.' },
    ],
  },
  {
    name: 'Drymann’s Token', category: 'Old Magic', role: 'Buff · charm', mode: 'Effect',
    vars: {
      frequency: FREQ_DAILY,
      action: actionCost({ act: 'scene', detail: 'a minute’s charm-work — a knot, a whisper, a pinch of salt in the pocket' }),
      targets: {
        base: '1 creature',
        advances: [
          { value: 'Cha creatures', cost: 'm' },
          { value: 'Cha + 1 creatures', cost: 'm' },
          { value: 'All creatures in company', cost: 'M' },
        ],
      },
      effects: {
        base: '+1 to Wis, Cha and Con Saves.',
        advances: [
          { value: '+1 to Wis, Cha and Con Saves, and +1 to all Saves and Defences vs the undead and spirits', cost: 'm' },
          { value: '+2 to Wis, Cha and Con Saves, and +1 to all Saves and Defences vs the undead and spirits', cost: 'm' },
          { value: '+2 to Wis, Cha and Con Saves, +1 to all Saves and Defences vs the undead and spirits, and the target gets one Reroll on any Save', cost: 'M' },
        ],
      },
      duration: { base: '24 hours' },
    },
    options: [
      { label: 'Offerings', note: '1 Supply from the Offerings Bag per target, worked into the token.' },
    ],
  },
];

// ── General ─────────────────────────────────────────────────────
// Cards open to every build — granted by Feats, not by a Class or Subclass.
// They advance through the ordinary Ability machinery.

const GENERAL: Ability[] = [
  {
    name: 'Second Wind',
    category: 'General',
    role: 'Defensive',
    mode: 'Effect',
    vars: {
      frequency: FREQ_ENC,
      action: ACTION_MM,
      targets: { base: 'Self' },
      effects: {
        base: 'Gain 2 Temp HP, or heal 2 HP',
        advances: [
          { value: 'Gain 3 Temp HP, or heal 3 HP', cost: 'm' },
          { value: 'Gain 3 Temp HP and heal 3 HP', cost: 'M' },
        ],
      },
    },
  },
];

export const CATEGORIES: CategoryGroup[] = [
  { name: 'General', source: 'Any build — granted by Feats', blurb: '[[text here]]', abilities: GENERAL },
  { name: 'Arms', source: 'Soldier — Class', blurb: '[[text here]]', abilities: ARMS },
  { name: 'Protection', source: 'Soldier — Vanguard', blurb: '[[text here]]', abilities: PROTECTION },
  { name: 'Leadership', source: 'Soldier — Commander', blurb: '[[text here]]', abilities: LEADERSHIP },
  { name: 'Marksmanship', source: 'Soldier — Marksman', blurb: '[[text here]]', abilities: MARKSMANSHIP },
  { name: 'Mercy', source: 'Friar — Class', blurb: '[[text here]]', abilities: MERCY },
  { name: 'Forbearance', source: 'Friar — Mendicant', blurb: '[[text here]]', abilities: FORBEARANCE },
  { name: 'Spiritual', source: 'Friar — Confessor', blurb: '[[text here]]', abilities: SPIRITUAL },
  { name: 'Letters', source: 'Scholar — Class', blurb: '[[text here]]', abilities: LETTERS },
  { name: 'Medicine', source: 'Scholar — Physician', blurb: '[[text here]]', abilities: MEDICINE },
  { name: 'New Magic', source: 'Scholar — Arcanist', blurb: '[[text here]]', abilities: NEW_MAGIC },
  { name: 'The Lost', source: 'Scoundrel — Class', blurb: '[[text here]]', abilities: THE_LOST },
  { name: 'Occult', source: 'Occultist — Class *(hosted by the Scoundrel’s Blackcoat)*', blurb: '[[text here]]', abilities: OCCULT },
  { name: 'Witchcraft', source: 'Occultist — Witch', blurb: '[[text here]]', abilities: WITCHCRAFT },
  { name: 'The Outside', source: 'Occultist — Cosmologist', blurb: '[[text here]]', abilities: OUTSIDE },
  { name: 'Guile', source: 'Scoundrel — Charlatan', blurb: '[[text here]]', abilities: GUILE },
  { name: 'Assassination', source: 'Scoundrel — Assassin', blurb: '[[text here]]', abilities: ASSASSINATION },
  { name: 'Elder Magic', source: 'Scholar — Antiquarian *(also the Occultist’s Grave Robber)*', blurb: '[[text here]]', abilities: ELDER_MAGIC },
  { name: 'Harvest', source: 'Naturalist — Class', blurb: '[[text here]]', abilities: HARVEST },
  { name: 'Husbandry', source: 'Naturalist — Shepherd', blurb: '[[text here]]', abilities: HUSBANDRY },
  { name: 'Botany', source: 'Naturalist — Botanist', blurb: '[[text here]]', abilities: BOTANY },
  { name: 'Old Magic', source: 'Naturalist — Drymann', blurb: '[[text here]]', abilities: OLD_MAGIC },
];
