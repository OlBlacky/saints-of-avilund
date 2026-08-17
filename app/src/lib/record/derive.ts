// derive(state) → the sheet's numbers, every one as a breakdown
// (builder spec §9): derivation returns labeled components, never bare
// totals — show-the-work is the shape of the engine's output, not a
// display feature.
//
// This slice covers the numbers the rules data can already feed: attributes,
// Offences, Saves, Defences, HP, Level, skills, languages, proficiencies.
// Armour/gear contributions join when the gear pillar lands.

import { classById } from '../classes';
import {
  ARMOURS,
  ARMOUR_TIER_AC,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  SHIELDS,
  carriesNoLoad,
  containerCoefficient,
  rungAt,
  rungIndex,
} from '../equipment';
import type { AccessRung } from '../equipment';
import { DEFAULT_LANGUAGE } from '../languages';
import { STARTING_COIN, gearById } from '../gear';
import { itemWeightLb } from '../markets';
import { qualityEase, qualityRange, qualityWeightLb } from '../masterwork';
import { ATTR_FULL, parseAttr } from '../notation';
import type { Attribute, Condition, Effect } from '../quirks';
import {
  classSkills,
  grantedProficiencies,
  isConditional,
  levelFor,
  packageEffects,
  skillBase,
  type CharacterState,
  type EffectGroup,
  type OwnedItem,
} from './replay';
import { SKILLS } from '../skills';

/** Using a Skill Untrained takes −1 (some Skills bar Untrained use entirely
 * — that flag joins the skills data when Les inventories them). */
export const UNTRAINED_PENALTY = -1;

/** One labeled component of a derived number. A part carrying a `group`
 * prints as that collective word ("Quirks", "Feats") in the math lines —
 * the source itself is named beneath the table (see `steadyMods`). */
export interface Part {
  label: string;
  value: number;
  group?: EffectGroup;
}

/** A derived number that shows its work. */
export interface Breakdown {
  total: number;
  parts: Part[];
}

function sum(parts: Part[]): Breakdown {
  return { total: parts.reduce((t, p) => t + p.value, 0), parts };
}

const ATTRIBUTES: Attribute[] = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
];

export interface DerivedAttribute {
  attr: Attribute;
  value: Breakdown;
  offence: Breakdown;
  save: Breakdown;
  /** Target number, 10-based. Armoured adds armour when gear data lands. */
  unarmouredDefence: Breakdown;
  armouredDefence: Breakdown;
}

export interface DerivedSkill {
  skill: string;
  attr: Attribute;
  isClassSkill: boolean;
  /** True when the skill is listed only because a modifier touches it —
   * the Untrained −1 is then part of its breakdown. */
  untrained?: boolean;
  value: Breakdown;
  /** One bonus per attribute the Skill may be rolled with ("Str, Cha") —
   * the pick is made per use at the table. `attr`/`value` mirror the best
   * variant (highest total), which is what the sheet prints. */
  variants: { attr: Attribute; value: Breakdown }[];
}

/** A conditional modifier the sheet can show but not sum — it fires only
 * under its condition (at night, vs Ferals, while carried…). */
export interface SituationalMod {
  source: string; // e.g. "Quirk · Gutter Auld"
  text: string;   // e.g. "−1 social checks (speaking Auld Imperial)"
}

/** An always-on modifier already folded into the sums. The math lines print
 * its `group`; these entries say which Quirk, Feat, or Ability it was. */
export interface SteadyMod extends SituationalMod {
  group: EffectGroup;
}

export interface DerivedSheet {
  level: number;
  attributes: DerivedAttribute[];
  hitPoints: Breakdown;
  speed: Breakdown;
  /** Steady DR from any source; 0 parts until something grants it. */
  damageReduction: Breakdown;
  /** Initiative bonuses beyond the attribute; 0 parts until something grants one. */
  initiative: Breakdown;
  /** Trained skills, plus any skill a modifier touches. */
  skills: DerivedSkill[];
  /** One summary line per Skill Generalist Feat: its Attribute and the roll
   * bonus every covered Skill uses. */
  skillGeneralists: { attr: Attribute; total: number }[];
  languages: string[];
  /** Proficiency group → advancement bonus (granted and bought). */
  proficiencies: { group: string; rank: number; advanceable: boolean }[];
  /** Conditional modifiers from the Quirk & Gear package (later: Feats). */
  situational: SituationalMod[];
  /** Always-on modifiers already summed above, named so the sheet can print
   * a collective word in the math and spell the sources out beneath. */
  steadyMods: SteadyMod[];
  /** Starting coin in sp, set by the Gear roll's category — bad 200,
   * neutral 150, good 100. Absent until the package is rolled (or on a
   * pre-gear log). Becomes the Wealth ledger's opening balance later. */
  startingCoin?: Breakdown;
  load: DerivedLoad;
  /** The Equipped Limit and what is spent against it. The sheet warns past
   * the cap; the table adjudicates (mechanics/encumbrance.md). */
  equipped: DerivedEquipped;
  /** The action to draw an Equipped item — a Move, or better with Quick Draw. */
  drawCost: AccessRung;
}

export interface DerivedEquipped {
  /** Items in the Equipped state, quantities counted. */
  count: number;
  /** 5 + Str + Dex + Con, minimum 5 — showing its work. */
  cap: Breakdown;
  /** The cap written as an equation, to read as arithmetic beside Load's. */
  formula: string;
  over: boolean;
}

// ── Load (mechanics/encumbrance.md) ─────────────────────────────────────────

export type LoadBand = 'None' | 'Light' | 'Heavy';

export interface DerivedLoad {
  /** Carried weight, rounded to the nearest pound. */
  totalLb: number;
  /** The top of the no-effect Band: 40 + 10 × Str, plus the Strongback
   * Ladder — showing its work. */
  base: Breakdown;
  /** The base written as an equation. A contributor list cannot say that the
   * Strength term is a product without garbling it ("Strength ×10 +20"), so
   * the carrying numbers print proper arithmetic instead. */
  formula: string;
  band: LoadBand;
  /** The Band's penalty, null when unburdened. */
  effect: string | null;
  /** The whole track, so the sheet can show where the character stands
   * rather than only what they have landed on. */
  rungs: LoadRung[];
  /** Rank 3 of the Strongback Ladder is holding a Heavy Load at Light —
   * why the standing Band can sit below the weight carried. */
  tamed: boolean;
}

export interface LoadRung {
  band: LoadBand;
  /** The weight this rung tops out at; null on Heavy, which has no edge. */
  upToLb: number | null;
  effect: string | null;
  here: boolean;
}

const BAND_EFFECT: Record<LoadBand, string | null> = {
  None: null,
  Light: "−5' Speed · −1 physical skill checks",
  Heavy: "−10' Speed · −2 physical skill checks",
};

/** Str as counted for Encumbrance only — the fine-grained hook the Quirks
 * plug into. Kept apart from Strength itself. */
function strForLoad(state: CharacterState): number {
  return (state.attributeRanks.Strength ?? 0) - (state.flaws.includes('Strength') ? 1 : 0);
}

/** Each Rank of the Strongback Ladder is worth this many pounds. It is
 * a flat grant rather than a Strength shift: read through the multiplier it
 * would be worth several times more to a strong character than a weak one,
 * which is backwards for a Feat bought at the same price by both. */
const LADDER_LB = 15;

/** One term of a printed equation: its sign as an operator, so the line reads
 * "40 + (Str 2 × 10) − 5" rather than a string of signed numbers. */
function term(value: number, text: string): string {
  return `${value < 0 ? '−' : '+'} ${text}`;
}

function loadFor(state: CharacterState): DerivedLoad {
  const ladderRank = state.feats.find((f) => f.featId === 'encumbrance-ladder')?.rank ?? 0;
  const str = strForLoad(state);
  const carryRanks = Math.min(2, ladderRank);
  const baseParts: Part[] = [
    { label: 'Base', value: 40 },
    ...(str ? [{ label: `Strength ×10`, value: 10 * str }] : []),
    ...(carryRanks ? [{ label: 'Strongback', value: LADDER_LB * carryRanks }] : []),
  ];
  const raw = baseParts.reduce((t, p) => t + p.value, 0);
  // A guard rather than a rule: no reachable Strength drives the base this
  // low. It prints its own part if it ever does, so the arithmetic cannot lie.
  if (raw < 5) baseParts.push({ label: 'Minimum', value: 5 - raw });
  const base = sum(baseParts);
  const baseLb = base.total;

  // Nothing but the base is not an equation — "Base 40 = 40 lb" tells the
  // reader nothing twice, so the tail only appears once there is a sum.
  const loadTerms = [
    ...(str ? [term(str, `(Str ${Math.abs(str)} × 10)`)] : []),
    ...(carryRanks ? [term(1, `Feat ${LADDER_LB * carryRanks}`)] : []),
  ];
  const formula = loadTerms.length
    ? `Base 40 ${loadTerms.join(' ')} = ${baseLb} lb${raw < 5 ? ' (minimum)' : ''}`
    : 'Base 40 lb';

  let total = 0;
  for (const item of state.inventory) {
    // The 0-Enc tag: armour's burden is already priced into its own
    // penalties, and clothing is trivial. A spare suit in a bag counts in
    // full, so the tag only spends itself on the body.
    if (item.location === 'worn' && item.itemId && carriesNoLoad(item.itemId)) continue;
    // Walk the container chain: contents multiply by each encloser's
    // coefficient; anything resting at Home (at any depth) is off the body.
    let factor = 1;
    let loc: string = item.location;
    let excluded = false;
    while (loc.startsWith('in:')) {
      const holder = state.inventory.find((i) => i.instanceId === loc.slice(3));
      if (!holder) { excluded = true; break; }
      factor *= (holder.itemId && containerCoefficient(holder.itemId)) || 1;
      loc = holder.location;
    }
    if (excluded || loc === 'home') continue;
    const lb = qualityWeightLb(item.itemId ? itemWeightLb(item.itemId) ?? 0 : 0, item.qualities);
    total += lb * item.qty * factor;
  }

  const totalLb = Math.round(total);
  const stood: LoadBand = totalLb <= baseLb ? 'None' : totalLb <= 2 * baseLb ? 'Light' : 'Heavy';
  const tamed = stood === 'Heavy' && ladderRank >= 3;
  const band: LoadBand = tamed ? 'Light' : stood;

  const rungs: LoadRung[] = [
    { band: 'None', upToLb: baseLb, effect: BAND_EFFECT.None, here: band === 'None' },
    { band: 'Light', upToLb: 2 * baseLb, effect: BAND_EFFECT.Light, here: band === 'Light' },
    { band: 'Heavy', upToLb: null, effect: BAND_EFFECT.Heavy, here: band === 'Heavy' },
  ];

  return { totalLb, base, formula, band, effect: BAND_EFFECT[band], rungs, tamed };
}

/** How much a character can keep at the ready, and how much they are keeping.
 * All three physical attributes contribute: strength, deftness, and the
 * stamina to wear it all day. The minimum of 5 is deliberate — a floor below
 * that gives a frail character an inventory chore, not an interesting
 * constraint. Past the cap the sheet warns; it is not a wall. */
function equippedFor(state: CharacterState, attr: (a: Attribute) => number): DerivedEquipped {
  const parts: Part[] = [
    { label: 'Base', value: 5 },
    ...(['Strength', 'Dexterity', 'Constitution'] as Attribute[])
      .map((a) => ({ label: a, value: attr(a) }))
      .filter((p) => p.value !== 0),
  ];
  const raw = parts.reduce((t, p) => t + p.value, 0);
  // The floor prints its own part, so a frail character can see why the
  // arithmetic stopped where it did.
  if (raw < 5) parts.push({ label: 'Minimum', value: 5 - raw });

  const SHORT: Record<string, string> = {
    Strength: 'Str', Dexterity: 'Dex', Constitution: 'Con',
  };
  const capTerms = parts
    .filter((p) => p.label !== 'Base' && p.label !== 'Minimum')
    .map((p) => term(p.value, `${SHORT[p.label] ?? p.label} ${Math.abs(p.value)}`));
  const formula = capTerms.length
    ? `Base 5 ${capTerms.join(' ')} = ${Math.max(5, raw)}${raw < 5 ? ' (minimum)' : ''}`
    : 'Base 5';

  // Only the Equipped state spends a slot. Stored items never do, whatever
  // their Container's Access — which is what a bandolier is buying.
  const count = state.inventory
    .filter((i) => i.location === 'equipped')
    .reduce((n, i) => n + i.qty, 0);
  const cap = sum(parts);
  return { count, cap, formula, over: count > cap.total };
}

/** The action to get an Equipped item in hand. A `move` by default; Quick
 * Draw buys the next rung down the ladder. */
function drawCostFor(state: CharacterState): AccessRung {
  const quickDraw = state.feats.some((f) => f.featId === 'quick-draw');
  return rungAt(rungIndex('move') + (quickDraw ? 1 : 0));
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

function describeCondition(when: Condition): string {
  const parts: string[] = [];
  if (when.targetTag) parts.push(`vs ${when.targetTag}`);
  if (when.proficiency) parts.push(`with ${when.proficiency}`);
  if (when.language) parts.push(`speaking ${when.language}`);
  if (when.place) parts.push(`in ${when.place}`);
  if (when.culture) parts.push(`with ${when.culture}`);
  if (when.note) parts.push(when.note);
  return parts.join(', ');
}

function describeEffect(effect: Effect): string {
  const cond = 'when' in effect && effect.when ? describeCondition(effect.when) : '';
  const suffix = cond ? ` (${cond})` : '';
  switch (effect.kind) {
    case 'skillMod': return `${signed(effect.value)} ${effect.skill}${suffix}`;
    case 'saveMod': return `${signed(effect.value)} ${effect.attr ?? 'all'} Saves${suffix}`;
    case 'defenceMod': return `${signed(effect.value)} ${effect.attr ?? 'all'} Defence${suffix}`;
    case 'attackMod': return `${signed(effect.value)} to hit${suffix}`;
    case 'socialPenalty': return `${signed(effect.value)} social checks${suffix}`;
    case 'grantProficiency': return `Proficiency: ${effect.group}`;
    case 'grantLanguage': return `Language: ${effect.language}`;
    case 'maxHpMod': return `${signed(effect.value)} max HP`;
    case 'drMod': return `DR ${effect.value}${suffix}`;
    case 'initiativeMod': return `${signed(effect.value)} Initiative${suffix}`;
    case 'grantTrainedByAttr': return `Trained in ${effect.attr} Skills`;
  }
}

export function derive(state: CharacterState): DerivedSheet {
  // The Quirk & Gear package: unconditional effects fold into the breakdowns
  // below (labeled with their source); conditional ones surface as
  // situational lines the sheet shows but never sums.
  const effects = packageEffects(state);
  const situational: SituationalMod[] = effects
    .filter((se) => isConditional(se.effect))
    .map((se) => ({ source: se.source, text: describeEffect(se.effect) }));
  const steady = effects.filter((se) => !isConditional(se.effect));
  const steadyMods: SteadyMod[] = steady.map((se) => ({
    source: se.source,
    group: se.group,
    text: describeEffect(se.effect),
  }));
  const steadyParts = (match: (e: Effect) => boolean): Part[] =>
    steady
      .filter((se) => match(se.effect))
      .map((se) => ({
        label: se.source,
        value: (se.effect as { value: number }).value,
        group: se.group,
      }));

  const attrValue = (attr: Attribute): Breakdown => {
    const parts: Part[] = [];
    const bought = state.attributeRanks[attr] ?? 0;
    if (bought) parts.push({ label: 'Advances', value: bought });
    if (state.flaws.includes(attr)) parts.push({ label: 'Flaw', value: -1 });
    return sum(parts);
  };

  // Gear on the body: the first Worn armour and the first Equipped shield
  // feed the sheet. Armour is passive (AC, DR, Speed, Stealth); a shield
  // rides on the arm and gives its AC and DR only while raised, so it lands
  // in the situational list, not the sums.
  const wornArmourItem = state.inventory
    .filter((i) => i.location === 'worn')
    .find((i) => ARMOURS.some((a) => a.id === i.itemId));
  const wornArmour = wornArmourItem
    ? ARMOURS.find((a) => a.id === wornArmourItem.itemId)
    : undefined;
  const borneShieldItem = state.inventory
    .filter((i) => i.location === 'equipped')
    .find((i) => SHIELDS.some((s) => s.id === i.itemId));
  const borneShield = borneShieldItem
    ? SHIELDS.find((s) => s.id === borneShieldItem.itemId)
    : undefined;

  // Masterwork Qualities (mechanics/masterwork.md): the worn armour's, and
  // those of Equipped ("ready") weapons. Flat ones join the sums below;
  // conditional ones print as situational lines with the rest.
  const armourHas = (qid: string): boolean =>
    wornArmourItem?.qualities?.includes(qid) ?? false;
  const readyWeaponsWith = (qid: string): OwnedItem[] =>
    state.inventory.filter((i) => i.location === 'equipped' && i.qualities?.includes(qid));

  const attributes: DerivedAttribute[] = ATTRIBUTES.map((attr) => {
    const value = attrValue(attr);
    const off = state.offenceRanks[attr] ?? 0;
    const def = state.defenceRanks[attr] ?? 0;
    const base = (label: string): Part[] => [{ label, value: value.total }];
    // An absent attr on the effect means all six (a Vow's blanket bonus).
    const saveMods = steadyParts((e) => e.kind === 'saveMod' && (e.attr ?? attr) === attr);
    const defenceMods = steadyParts((e) => e.kind === 'defenceMod' && (e.attr ?? attr) === attr);

    return {
      attr,
      value,
      offence: sum([
        ...base(attr),
        ...(off ? [{ label: 'Ranks', value: off }] : []),
      ]),
      // Save = Attribute + Defence Ranks (one track lifts both; ruled Aug 2026).
      save: sum([
        ...base(attr),
        ...(def ? [{ label: 'Ranks', value: def }] : []),
        ...saveMods,
        ...(attr === 'Dexterity' && armourHas('layered')
          ? [{ label: 'Layered', value: 1 }]
          : []),
      ]),
      unarmouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Ranks', value: def }] : []),
        ...defenceMods,
      ]),
      armouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Ranks', value: def }] : []),
        ...defenceMods,
        ...(wornArmour
          ? [{ label: wornArmour.name, value: ARMOUR_TIER_AC[wornArmour.tier] }]
          : []),
        ...(wornArmour?.acBonus
          ? [{ label: 'Masterwork', value: wornArmour.acBonus }]
          : []),
        ...(attr === 'Dexterity' && armourHas('layered')
          ? [{ label: 'Layered', value: 1 }]
          : []),
      ]),
    };
  });

  const cls = state.classId ? classById(state.classId) : undefined;
  const hitPoints = sum([
    { label: 'Base', value: 5 },
    ...(state.hpPurchases && cls
      ? [{ label: `HP Advances ×${state.hpPurchases} (Class HP ${cls.classHP})`, value: state.hpPurchases * cls.classHP }]
      : []),
    ...steadyParts((e) => e.kind === 'maxHpMod'),
  ]);

  // An easing Quality gives back what the armour took, and no more: it can
  // never carry a drawback past zero into a bonus.
  const speedEase = Math.min(
    qualityEase(wornArmourItem?.qualities, 'speedEaseFt'),
    wornArmour?.speedPenaltyFt ?? 0,
  );
  const stealthEase = Math.min(
    qualityEase(wornArmourItem?.qualities, 'stealthEase'),
    wornArmour?.stealthPenalty ?? 0,
  );

  const speed = sum([
    { label: 'Base', value: 30 },
    ...(wornArmour?.speedPenaltyFt
      ? [{ label: wornArmour.name, value: -wornArmour.speedPenaltyFt }]
      : []),
    ...(speedEase ? [{ label: 'Tailored and Articulated', value: speedEase }] : []),
    ...(borneShield?.speedPenaltyFt
      ? [{ label: borneShield.name, value: -borneShield.speedPenaltyFt }]
      : []),
  ]);

  const damageReduction = sum([
    ...steadyParts((e) => e.kind === 'drMod'),
    ...(wornArmour?.dr ? [{ label: wornArmour.name, value: wornArmour.dr }] : []),
    ...(armourHas('case-hardened') ? [{ label: 'Case Hardened', value: 1 }] : []),
  ]);
  if (borneShield) {
    // A Masterwork shield's +1 DR is carried apart from the base so the
    // item can name its source; the raised line prints the total.
    const shieldDr = borneShield.dr + (borneShield.drBonus ?? 0);
    situational.push({
      source: borneShield.name,
      text: `+${borneShield.ac} AC${shieldDr ? ` · DR ${shieldDr}` : ''} while raised`,
    });
  }

  // Enarmed cannot be summed: how far one step falls depends on where the
  // character's own Raise Shield sits on the ladder, so the sheet states the
  // rule and the player counts the step.
  if (borneShieldItem?.qualities?.includes('enarmed')) {
    situational.push({
      source: 'Enarmed',
      text: 'Raise a Shield costs one step less: Standard → Move → Minor → Free',
    });
  }

  // Conditional Qualities print beside the other situational lines.
  if (armourHas('deflective-design')) situational.push({
    source: 'Deflective Design',
    text: 'The first Critical Hit against you each encounter is a normal hit instead',
  });
  if (armourHas('besagews')) situational.push({
    source: 'Besagews, Gorgets & Goussets',
    text: 'An attack whose maximum damage cannot beat your DR deals no damage at all, not 1',
  });
  if (armourHas('fur-lined')) situational.push({ source: 'Fur Lined', text: 'Resist Cold 1' });
  if (armourHas('boiled-leather')) situational.push({ source: 'Boiled Leather', text: '+1 DR vs. Slashing and Piercing' });
  if (armourHas('layered')) situational.push({ source: 'Layered', text: '+1 DR vs. Area Effects' });
  const weaponLine = (qid: string, text: string) => {
    for (const inst of readyWeaponsWith(qid)) {
      situational.push({ source: inst.customName ?? inst.name, text });
    }
  };
  weaponLine('needle-point', 'Ignores 1 DR');
  weaponLine('patterned-steel', 'Critical on 19, 20 — a natural 19 crits only if the attack hits');
  // A range Quality states the bands it buys, not the percentage: the sheet
  // prints what you shoot.
  for (const inst of state.inventory.filter((i) => i.location === 'equipped' && i.qualities?.length)) {
    const w = [...MELEE_WEAPONS, ...RANGED_WEAPONS].find((x) => x.id === inst.itemId);
    const worked = qualityRange(w?.range ?? null, inst.qualities);
    if (w?.range && worked && worked !== w.range) {
      situational.push({ source: inst.customName ?? inst.name, text: `Range ${worked}` });
    }
  }

  // Initiative = Dex or Wis, whichever is bigger, + modifiers (ruled Aug 2026).
  // A readiness Quality (Silken Bowstring, Fuller / Balanced) counts while
  // its weapon is Equipped.
  const dex = attributes.find((a) => a.attr === 'Dexterity')!.value.total;
  const wis = attributes.find((a) => a.attr === 'Wisdom')!.value.total;
  const initiative = sum([
    wis > dex ? { label: 'Wisdom', value: wis } : { label: 'Dexterity', value: dex },
    ...steadyParts((e) => e.kind === 'initiativeMod'),
    ...(readyWeaponsWith('silken-bowstring').length
      ? [{ label: 'Silken Bowstring', value: 1 }]
      : []),
    ...(readyWeaponsWith('fuller-balanced').length
      ? [{ label: 'Fuller / Balanced', value: 1 }]
      : []),
  ]);

  // Trained Skills: every Class Skill (Trained free, +0 until advanced) plus
  // any off-list Skill made Trained with a Minor. Untrained use is −1. A
  // skill an unconditional modifier touches is listed even Untrained — the
  // modifier exists either way, and the sheet must show where it lands.
  const ownClassSkills = classSkills(state);
  const moddedSkills = steady
    .filter((se) => se.effect.kind === 'skillMod')
    .map((se) => (se.effect as Extract<Effect, { kind: 'skillMod' }>).skill);
  // A Skill Generalist counts as Trained in every Skill rolled with its
  // Attribute — those Skills list at +0 without the Untrained penalty.
  const generalistAttrs = new Set(
    steady
      .filter((se) => se.effect.kind === 'grantTrainedByAttr')
      .map((se) => (se.effect as Extract<Effect, { kind: 'grantTrainedByAttr' }>).attr),
  );
  const usesGeneralistAttr = (name: string): boolean => {
    const def = SKILLS.find((s) => s.name === skillBase(name));
    return (def?.attrs.split(',') ?? []).some((a) => {
      const short = parseAttr(a.trim());
      return short !== undefined && generalistAttrs.has(ATTR_FULL[short]);
    });
  };
  // Generalist-covered Skills are NOT listed one by one — the sheet carries
  // one summary line per Generalist instead (Les, Aug 2026). A covered Skill
  // still lists when something else puts it there (Ranks, a modifier), just
  // without the Untrained penalty.
  const skillGeneralists = [...generalistAttrs].map((attr) => ({
    attr,
    total: attrValue(attr).total,
  }));
  const trainedNames = [
    ...new Set([
      ...ownClassSkills,
      ...state.trainedSkills,
      ...Object.keys(state.skillRanks),
      ...moddedSkills,
      // Armour's Stealth penalty lands on the sheet even Untrained.
      ...(wornArmour?.stealthPenalty ? ['Stealth'] : []),
      // A worn Quality's skill bonus lands the same way.
      ...(armourHas('blackened') ? ['Stealth'] : []),
      ...(armourHas('grim-trophy') ? ['Intimidate'] : []),
    ]),
  ];
  const skills: DerivedSkill[] = trainedNames.map((skill) => {
    // The base name serves only to find the Skill's definition; the full
    // name — speciality and all — is what the sheet shows and compares.
    const rank = state.skillRanks[skill] ?? 0;
    const def = SKILLS.find((s) => s.name === skillBase(skill));
    // Every listed attribute derives its own bonus ("Str, Cha" → both) —
    // which one rolls is chosen per use at the table.
    const attrs: Attribute[] = (def?.attrs.split(',') ?? [])
      .map((a) => parseAttr(a.trim()))
      .flatMap((short) => (short ? [ATTR_FULL[short]] : []));
    if (attrs.length === 0) attrs.push('Wisdom');
    const isClassSkill = ownClassSkills.includes(skill);
    const untrained =
      !isClassSkill && !state.trainedSkills.includes(skill) && !usesGeneralistAttr(skill);
    // Everything but the attribute is shared across the variants.
    const sharedParts: Part[] = [
      ...(untrained ? [{ label: 'Untrained', value: UNTRAINED_PENALTY }] : []),
      ...(rank ? [{ label: 'Ranks', value: rank }] : []),
      ...steadyParts((e) => e.kind === 'skillMod' && e.skill === skill),
      ...(skill === 'Stealth' && wornArmour?.stealthPenalty
        ? [{ label: wornArmour.name, value: -wornArmour.stealthPenalty }]
        : []),
      ...(skill === 'Stealth' && stealthEase
        ? [{ label: 'Tailored and Articulated', value: stealthEase }]
        : []),
      ...(skill === 'Stealth' && armourHas('blackened')
        ? [{ label: 'Blackened', value: 1 }]
        : []),
      ...(skill === 'Intimidate' && armourHas('grim-trophy')
        ? [{ label: 'Grim Trophy', value: 1 }]
        : []),
    ];
    const variants = attrs.map((attr) => ({
      attr,
      value: sum([{ label: attr, value: attrValue(attr).total }, ...sharedParts]),
    }));
    const best = variants.reduce((a, b) => (b.value.total > a.value.total ? b : a));
    return {
      skill,
      attr: best.attr,
      isClassSkill,
      ...(untrained ? { untrained } : {}),
      value: best.value,
      variants,
    };
  });

  const grantedLanguages = steady
    .filter((se) => se.effect.kind === 'grantLanguage')
    .map((se) => (se.effect as Extract<Effect, { kind: 'grantLanguage' }>).language);
  const languages = [
    DEFAULT_LANGUAGE,
    ...(state.homeLanguage ? [state.homeLanguage] : []),
    ...collectGrantedLanguages(state),
    ...grantedLanguages,
    ...state.languages,
  ].filter((l, i, xs) => xs.indexOf(l) === i);

  const granted = [...new Set(grantedProficiencies(state))];
  // Package grants behave like bought proficiencies: +0 forever, a door not a
  // career — and they never duplicate a group the build already has.
  const grantedByPackage = steady
    .filter((se) => se.effect.kind === 'grantProficiency')
    .map((se) => (se.effect as Extract<Effect, { kind: 'grantProficiency' }>).group)
    .filter((g) => !granted.includes(g) && !state.boughtProficiencies.includes(g));
  const proficiencies = [
    ...granted.map((group) => ({
      group,
      rank: state.proficiencyRanks[group] ?? 0,
      advanceable: true,
    })),
    ...state.boughtProficiencies.map((group) => ({ group, rank: 0, advanceable: false })),
    ...[...new Set(grantedByPackage)].map((group) => ({ group, rank: 0, advanceable: false })),
  ];

  // Coin re-derives from the gear card's category, like everything else —
  // re-pool a card and every sheet's purse updates on the next replay. The
  // label stays mute about the category: the seesaw is not shown to players.
  const gearCard = state.gear?.id ? gearById(state.gear.id) : undefined;
  const startingCoin = gearCard
    ? sum([{ label: 'Starting coin', value: gearCard.coinSp ?? STARTING_COIN[gearCard.category] }])
    : undefined;

  return {
    level: levelFor(state.milestones, state.crystallized),
    attributes,
    hitPoints,
    speed,
    damageReduction,
    initiative,
    skills,
    skillGeneralists,
    languages,
    proficiencies,
    situational,
    steadyMods,
    ...(startingCoin ? { startingCoin } : {}),
    load: loadFor(state),
    equipped: equippedFor(state, (a) => attributes.find((x) => x.attr === a)!.value.total),
    drawCost: drawCostFor(state),
  };
}

function collectGrantedLanguages(state: CharacterState): string[] {
  const out: string[] = [];
  const pairs = [
    { classId: state.classId, subclassId: state.subclassId },
    ...state.addedClasses,
  ];
  for (const p of pairs) {
    const cls = p.classId ? classById(p.classId) : undefined;
    if (!cls) continue;
    out.push(...(cls.languages ?? []));
    const sub = cls.subclasses.find((s) => s.id === p.subclassId);
    out.push(...(sub?.languages ?? []));
  }
  return out;
}
