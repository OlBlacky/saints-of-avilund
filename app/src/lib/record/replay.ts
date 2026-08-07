// replay(events) → { state, flags } — the heart of the record engine
// (builder spec §9). One pure walk over the log: it accumulates the
// character's state, prices every purchase from the rules data at replay
// time, and collects keep-and-flag validation flags instead of throwing.
//
// The same function serves three masters:
//   - the builder's hard-block: candidate event appended → replay → any flag
//     on it means the purchase is refused;
//   - the drift review: rules changed → replay → flags name what broke;
//   - the sheet: state is what derive() renders.

import { CATEGORIES } from '../category-abilities';
import { classById, subclassById } from '../classes';
import type { ClassDef, SubclassDef } from '../classes';
import { featById } from '../feats';
import type { FeatRequirement } from '../feats';
import type { Attribute } from '../quirks';
import type { AbilityRef, RecordEvent } from './events';

// ── State ───────────────────────────────────────────────────────────────────

export interface OwnedAbility {
  ref: AbilityRef;
  /** Builder cards: which copy this is, its player name, its build choice. */
  instanceId?: string;
  name?: string;
  choices?: Record<string, string>;
  /** Bought advancement rank per variable (absent = base). */
  ranks: Record<string, number>;
}

export interface CharacterState {
  classId?: string;
  subclassId?: string;
  /** Additional Class+Subclass pairs bought with Majors. */
  addedClasses: { classId: string; subclassId: string }[];
  /** Bought attribute steps (0–5) per attribute. */
  attributeRanks: Partial<Record<Attribute, number>>;
  /** Creation Flaws: −1 each. */
  flaws: Attribute[];
  offenceRanks: Partial<Record<Attribute, number>>;
  defenceRanks: Partial<Record<Attribute, number>>;
  /** Times HP was bought (each adds Class HP). */
  hpPurchases: number;
  /** Off-list Skills made Trained with a Minor (Class Skills arrive Trained). */
  trainedSkills: string[];
  /** Skill name → bought Ranks (0 = Trained only). */
  skillRanks: Record<string, number>;
  /** Proficiencies bought with Minors (fixed at base). */
  boughtProficiencies: string[];
  /** Class/Subclass proficiency group → advancement rank (1–2). */
  proficiencyRanks: Record<string, number>;
  languages: string[];
  abilities: OwnedAbility[];
  /** Owned Feats: rank 1 for plain Feats, the climbed Rank for Ladders. */
  feats: { featId: string; choices?: Record<string, string>; rank: number }[];
  quirk?: { id?: string; name: string; slots: Record<string, string>; rerollsUsed: number };
  /** The other half of the finale package (absent on pre-gear logs). */
  gear?: { id?: string; name: string; slots: Record<string, string> };
  crystallized: boolean;
  milestones: number;
  /** Advances granted minus spent. */
  bank: { major: number; minor: number };
}

/** A validation flag attached to the event that caused it. */
export interface Flag {
  eventId: string;
  code:
    | 'unknown-ref'
    | 'wrong-order'
    | 'no-access'
    | 'over-cap'
    | 'insufficient-advances'
    | 'once-per-level'
    | 'ladder-pace'
    | 'creation-only'
    | 'duplicate';
  message: string;
}

export interface ReplayResult {
  state: CharacterState;
  flags: Flag[];
}

// ── Rules helpers ───────────────────────────────────────────────────────────

/** Level, derived from milestones: creation is Level 0; play begins at 1;
 * each triad completes the level it builds toward (spec §7). */
export function levelFor(milestones: number, crystallized: boolean): number {
  if (!crystallized) return 0;
  return Math.min(11, 1 + Math.floor(milestones / 3));
}

/** Once-per-Level windows: creation is window 0; a new window opens at the
 * first Milestone of each triad (1, 4, 7, …). */
export function windowFor(milestones: number): number {
  return milestones === 0 ? 0 : 1 + Math.floor((milestones - 1) / 3);
}

/** The Nth step of the triangular curve costs N (so +3 costs 1+2+3 = 6). */
export function stepCost(toRank: number): number {
  return toRank;
}

function isClassAttribute(state: CharacterState, attr: Attribute): boolean {
  return activePairs(state).some(
    ({ cls, sub }) => cls.classAttribute === attr || sub?.classAttribute === attr,
  );
}

interface Pair {
  cls: ClassDef;
  sub?: SubclassDef;
}

/** All Class+Subclass pairs the character owns (first + added). */
function activePairs(state: CharacterState): Pair[] {
  const pairs: Pair[] = [];
  const first = state.classId ? classById(state.classId) : undefined;
  if (first) {
    pairs.push({
      cls: first,
      sub: first.subclasses.find((s) => s.id === state.subclassId),
    });
  }
  for (const added of state.addedClasses) {
    const cls = classById(added.classId);
    if (cls) pairs.push({ cls, sub: cls.subclasses.find((s) => s.id === added.subclassId) });
  }
  return pairs;
}

/** The Ability Categories this character may buy from. */
export function accessibleCategories(state: CharacterState): string[] {
  const cats: string[] = [];
  for (const { cls, sub } of activePairs(state)) {
    cats.push(cls.abilityCategory);
    if (sub) cats.push(sub.abilityCategory);
  }
  return cats;
}

/** A Skill's base name — the parenthetical speciality stripped. Used only to
 * look up the base Skill's definition; a speciality Skill keeps its full name
 * everywhere else ("Religion (Saintly Faith)" and "Religion (Black Faith)"
 * are different Skills). */
export function skillBase(name: string): string {
  return name.replace(/\s*\(.*\)$/, '');
}

/** All Class Skills across pairs, full names — specialities intact. */
export function classSkills(state: CharacterState): string[] {
  const skills: string[] = [];
  for (const { cls, sub } of activePairs(state)) {
    skills.push(...cls.classSkills);
    if (sub) skills.push(...sub.additionalClassSkills);
  }
  return skills;
}

/** Proficiency groups granted by Class/Subclass (the advanceable ones). */
export function grantedProficiencies(state: CharacterState): string[] {
  const groups: string[] = [];
  for (const { cls, sub } of activePairs(state)) {
    groups.push(...cls.weaponProficiencies, ...cls.armourProficiencies);
    if (sub) {
      groups.push(
        ...sub.weaponProficiencies,
        ...sub.armourProficiencies,
        ...(sub.implementProficiencies ?? []),
      );
    }
  }
  return groups;
}

function findCard(ref: AbilityRef) {
  const cat = CATEGORIES.find((c) => c.name === ref.category);
  return cat?.abilities.find((a) => a.name === ref.ability);
}

/** Every proficiency the build holds, granted or bought — the can-use rule
 * counts both: a door you paid a Minor for is still a door. */
export function allProficiencies(state: CharacterState): string[] {
  return [...grantedProficiencies(state), ...state.boughtProficiencies];
}

/** Can an owned Ability deal this damage type? Builder copies answer by
 * their element choice; plain cards by the type appearing on their damage
 * Ladder. */
export function canDealType(state: CharacterState, type: string): boolean {
  for (const owned of state.abilities) {
    if (Object.values(owned.choices ?? {}).includes(type)) return true;
    const card = findCard(owned.ref);
    const dmg = card?.vars.damage;
    if (!dmg) continue;
    const values = [dmg.base, ...(dmg.advances ?? []).map((a) => a.value)];
    if (values.some((v) => v && new RegExp(`\\b${type}\\b`).test(v))) return true;
  }
  return false;
}

/** The can-use rule: what a Feat requirement checks against the build. */
function meetsRequirement(state: CharacterState, req: FeatRequirement): string | null {
  switch (req.kind) {
    case 'proficiency':
      return allProficiencies(state).includes(req.group)
        ? null
        : `requires proficiency with ${req.group}`;
    case 'damage-type':
      return canDealType(state, req.type)
        ? null
        : `requires an Ability that deals ${req.type} damage`;
    case 'malediction':
      return state.abilities.some((a) => Object.values(a.choices ?? {}).includes(req.name))
        ? null
        : `requires a curse built with ${req.name}`;
    case 'skill-trained': {
      const trained =
        state.trainedSkills.includes(req.skill) ||
        classSkills(state).some((s) => skillBase(s) === req.skill);
      return trained ? null : `requires being Trained in ${req.skill}`;
    }
  }
}

/** Attribute cap for this character at its current level. */
function attributeCap(state: CharacterState, attr: Attribute): number {
  if (!isClassAttribute(state, attr)) return 2;
  const level = levelFor(state.milestones, state.crystallized);
  if (level >= 10) return 5;
  if (level >= 5) return 4;
  return 3;
}

// ── Replay ──────────────────────────────────────────────────────────────────

const CREATION_MAJORS = 11;
const CREATION_MINORS = 11;

/**
 * Trial a candidate event against an existing log: the flags (if any) that
 * the candidate itself would raise. The UI's single source of "can I buy
 * this, and if not, why?" — no rule lives outside replay().
 */
export function tryEvent(events: RecordEvent[], candidate: RecordEvent): Flag[] {
  return replay([...events, candidate]).flags.filter((f) => f.eventId === candidate.id);
}

export function replay(events: RecordEvent[]): ReplayResult {
  const state: CharacterState = {
    addedClasses: [],
    attributeRanks: {},
    flaws: [],
    offenceRanks: {},
    defenceRanks: {},
    hpPurchases: 0,
    trainedSkills: [],
    skillRanks: {},
    boughtProficiencies: [],
    proficiencyRanks: {},
    languages: [],
    abilities: [],
    feats: [],
    crystallized: false,
    milestones: 0,
    bank: { major: CREATION_MAJORS, minor: CREATION_MINORS },
  };
  const flags: Flag[] = [];

  // Per-window bookkeeping for pacing rules. Ability advancement paces per
  // ABILITY: one Minor-cost and one Major-cost advance per Level (creation
  // counts as its own window — the 0-level allotment).
  let hpWindow = -1;
  const advanceSlots = new Set<string>(); // "cat/ability/m|M/window"
  const featLadderWindow = new Map<string, number>(); // featId → window

  const flag = (e: RecordEvent, code: Flag['code'], message: string) =>
    flags.push({ eventId: e.id, code, message });

  const spend = (e: RecordEvent, kind: 'major' | 'minor', cost: number): boolean => {
    if (state.bank[kind] < cost) {
      flag(e, 'insufficient-advances', `costs ${cost} ${kind === 'major' ? 'Major' : 'Minor'}, bank has ${state.bank[kind]}`);
      return false;
    }
    state.bank[kind] -= cost;
    return true;
  };

  for (const e of events) {
    switch (e.type) {
      case 'class-chosen': {
        const cls = classById(e.classId);
        if (!cls) { flag(e, 'unknown-ref', `unknown class "${e.classId}"`); break; }
        state.classId = e.classId;
        break;
      }

      case 'subclass-chosen': {
        const found = subclassById(e.subclassId);
        if (!found) { flag(e, 'unknown-ref', `unknown subclass "${e.subclassId}"`); break; }
        if (!state.classId) { flag(e, 'wrong-order', 'subclass chosen before class'); break; }
        if (found.cls.id !== state.classId) {
          flag(e, 'no-access', `${found.sub.name} belongs to the ${found.cls.name}, not the chosen class`);
          break;
        }
        state.subclassId = e.subclassId;
        break;
      }

      case 'flaw-taken': {
        if (state.crystallized) { flag(e, 'creation-only', 'Flaws are taken at creation'); break; }
        if (state.flaws.length >= 2) { flag(e, 'over-cap', 'at most two Flaws'); break; }
        if (state.flaws.includes(e.attr)) { flag(e, 'duplicate', `already flawed in ${e.attr}`); break; }
        state.flaws.push(e.attr);
        state.bank.major += 1;
        break;
      }

      case 'quirk-rolled': {
        if (state.quirk && state.crystallized) { flag(e, 'duplicate', 'the Quirk is already rolled and locked'); break; }
        state.quirk = { id: e.quirkId, name: e.quirkName, slots: e.slots, rerollsUsed: e.rerollsUsed };
        // Quirk and Gear travel as one package: a reroll replaces both.
        state.gear = e.gearName
          ? { id: e.gearId, name: e.gearName, slots: e.gearSlots ?? {} }
          : undefined;
        break;
      }

      case 'crystallized': {
        if (!state.classId || !state.subclassId) { flag(e, 'wrong-order', 'cannot crystallize without a Class and Subclass'); break; }
        if (!state.quirk || !state.gear) { flag(e, 'wrong-order', 'the Quirk & Starting Gear package is rolled before crystallization'); break; }
        state.crystallized = true;
        break;
      }

      case 'milestone-granted': {
        state.milestones += 1;
        state.bank.major += 1;
        state.bank.minor += 1;
        break;
      }

      case 'attribute-bought': {
        const current = state.attributeRanks[e.attr] ?? 0;
        const cap = attributeCap(state, e.attr);
        if (current >= cap) {
          flag(e, 'over-cap', `${e.attr} is capped at +${cap} ${isClassAttribute(state, e.attr) ? 'at this Level' : '(not a Class Attribute)'}`);
          break;
        }
        if (!spend(e, 'major', stepCost(current + 1))) break;
        state.attributeRanks[e.attr] = current + 1;
        break;
      }

      case 'ability-bought': {
        const card = findCard(e.ref);
        if (!card) { flag(e, 'unknown-ref', `unknown ability "${e.ref.category} · ${e.ref.ability}"`); break; }
        if (!accessibleCategories(state).includes(e.ref.category)) {
          flag(e, 'no-access', `no access to the ${e.ref.category} Category`);
          break;
        }
        if (card.builder) {
          // A builder card mints a fresh copy per purchase — each needs a
          // unique instanceId and the card's one build choice.
          if (!e.instanceId) {
            flag(e, 'wrong-order', `${e.ref.ability} is a builder — each copy needs an instance id`);
            break;
          }
          if (state.abilities.some((a) => a.instanceId === e.instanceId)) {
            flag(e, 'duplicate', `instance "${e.instanceId}" already exists`);
            break;
          }
          const choice = card.builderChoice;
          if (choice) {
            const picked = e.choices?.[choice.key];
            if (!picked) {
              flag(e, 'wrong-order', `choose ${choice.label === 'Element' ? 'an' : 'a'} ${choice.label} when building ${e.ref.ability}`);
              break;
            }
            if (!choice.options.includes(picked)) {
              flag(e, 'unknown-ref', `"${picked}" is not a ${choice.label} of ${e.ref.ability}`);
              break;
            }
          }
          if (!spend(e, 'major', 1)) break;
          state.abilities.push({
            ref: e.ref,
            instanceId: e.instanceId,
            name: e.instanceName ?? e.ref.ability,
            choices: e.choices,
            ranks: {},
          });
          break;
        }
        if (state.abilities.some((a) => a.ref.category === e.ref.category && a.ref.ability === e.ref.ability)) {
          flag(e, 'duplicate', `${e.ref.ability} is already owned`);
          break;
        }
        if (!spend(e, 'major', 1)) break;
        state.abilities.push({ ref: e.ref, ranks: {} });
        break;
      }

      case 'ability-renamed': {
        const inst = state.abilities.find((a) => a.instanceId === e.instanceId);
        if (!inst) { flag(e, 'unknown-ref', `no instance "${e.instanceId}" to rename`); break; }
        inst.name = e.name;
        break;
      }

      case 'ability-advanced': {
        const owned = e.instanceId
          ? state.abilities.find((a) => a.instanceId === e.instanceId)
          : state.abilities.find(
              (a) => a.ref.category === e.ref.category && a.ref.ability === e.ref.ability,
            );
        if (!owned) { flag(e, 'wrong-order', `${e.ref.ability} is not owned`); break; }
        const card = findCard(e.ref);
        const variable = card?.vars[e.variable as keyof typeof card.vars];
        const advance = variable?.advances?.[e.toRank - 1];
        if (!advance) {
          flag(e, 'unknown-ref', `${e.ref.ability} has no ${e.variable} Rank ${e.toRank}`);
          break;
        }
        const current = owned.ranks[e.variable] ?? 0;
        if (e.toRank !== current + 1) {
          flag(e, 'wrong-order', `${e.variable} is at Rank ${current}; next is ${current + 1}, not ${e.toRank}`);
          break;
        }
        // A Rank noted "L5" (etc.) opens later than the natural pace.
        const gate = advance.note?.match(/^L(\d+)$/);
        if (gate && levelFor(state.milestones, state.crystallized) < Number(gate[1])) {
          flag(e, 'over-cap', `that ${e.variable} Rank opens at Level ${gate[1]}`);
          break;
        }
        // Pacing: each Ability may take one Minor-cost and one Major-cost
        // advance per Level (the 0-level allotment included). Each builder
        // copy is its own Ability for pacing.
        const slot = `${e.ref.category}/${e.ref.ability}/${owned.instanceId ?? ''}/${advance.cost}/${windowFor(state.milestones)}`;
        if (advanceSlots.has(slot)) {
          flag(
            e,
            'ladder-pace',
            `${e.ref.ability} already took its ${advance.cost === 'M' ? 'Major' : 'Minor'} advance this Level`,
          );
          break;
        }
        if (!spend(e, advance.cost === 'M' ? 'major' : 'minor', 1)) break;
        owned.ranks[e.variable] = e.toRank;
        advanceSlots.add(slot);
        break;
      }

      case 'class-added': {
        const found = subclassById(e.subclassId);
        const cls = classById(e.classId);
        if (!cls || !found || found.cls.id !== e.classId) {
          flag(e, 'unknown-ref', `unknown class/subclass pair "${e.classId}/${e.subclassId}"`);
          break;
        }
        if (state.classId === e.classId || state.addedClasses.some((a) => a.classId === e.classId)) {
          flag(e, 'duplicate', `the ${cls.name} is already owned`);
          break;
        }
        if (state.addedClasses.length >= 2) { flag(e, 'over-cap', 'at most three Classes'); break; }
        const cost = state.addedClasses.length === 0 ? 3 : 6;
        if (!spend(e, 'major', cost)) break;
        state.addedClasses.push({ classId: e.classId, subclassId: e.subclassId });
        break;
      }

      case 'offence-bought':
      case 'defence-bought': {
        const ranks = e.type === 'offence-bought' ? state.offenceRanks : state.defenceRanks;
        const current = ranks[e.attr] ?? 0;
        const cap = isClassAttribute(state, e.attr) ? 2 : 1;
        if (current >= cap) { flag(e, 'over-cap', `${e.attr} ${e.type === 'offence-bought' ? 'Offence' : 'Defence'} is capped at +${cap}`); break; }
        if (!spend(e, 'minor', stepCost(current + 1))) break;
        ranks[e.attr] = current + 1;
        break;
      }

      case 'hp-bought': {
        const window = windowFor(state.milestones);
        if (hpWindow === window) { flag(e, 'once-per-level', 'HP may be bought once per Level'); break; }
        if (!spend(e, 'minor', 1)) break;
        state.hpPurchases += 1;
        hpWindow = window;
        break;
      }

      case 'skill-trained': {
        // Full-name comparison: "Religion (Black Faith)" is trainable even
        // when "Religion (Saintly Faith)" is a Class Skill.
        if (classSkills(state).includes(e.skill)) {
          flag(e, 'duplicate', `${e.skill} is a Class Skill — Trained already, free`);
          break;
        }
        if (state.trainedSkills.includes(e.skill)) { flag(e, 'duplicate', `already Trained in ${e.skill}`); break; }
        if (!spend(e, 'minor', 1)) break;
        state.trainedSkills.push(e.skill);
        break;
      }

      case 'skill-advanced': {
        const isClass = classSkills(state).includes(e.skill);
        if (!isClass && !state.trainedSkills.includes(e.skill)) {
          flag(e, 'wrong-order', `not Trained in ${e.skill} — training comes first`);
          break;
        }
        const current = state.skillRanks[e.skill] ?? 0;
        const next = current + 1;
        if (!isClass && next > 1) { flag(e, 'over-cap', `${e.skill} is not a Class Skill — it never passes +1`); break; }
        if (isClass && next > 3) { flag(e, 'over-cap', `${e.skill} is capped at +3`); break; }
        const level = levelFor(state.milestones, state.crystallized);
        if (isClass && next === 2 && level < 3) { flag(e, 'over-cap', `the +2 Skill Rank opens at Level 3`); break; }
        if (isClass && next === 3 && level < 5) { flag(e, 'over-cap', `the +3 Skill Rank opens at Level 5`); break; }
        if (!spend(e, 'minor', 1)) break;
        state.skillRanks[e.skill] = next;
        break;
      }

      case 'proficiency-bought': {
        if (grantedProficiencies(state).includes(e.group) || state.boughtProficiencies.includes(e.group)) {
          flag(e, 'duplicate', `already proficient with ${e.group}`);
          break;
        }
        if (!spend(e, 'minor', 1)) break;
        state.boughtProficiencies.push(e.group);
        break;
      }

      case 'proficiency-advanced': {
        if (!grantedProficiencies(state).includes(e.group)) {
          flag(e, 'no-access', `only Class/Subclass proficiencies advance — ${e.group} is not one`);
          break;
        }
        const current = state.proficiencyRanks[e.group] ?? 0;
        if (current >= 2) { flag(e, 'over-cap', `${e.group} is capped at +2`); break; }
        if (current === 1 && levelFor(state.milestones, state.crystallized) < 5) {
          flag(e, 'over-cap', `the second +1 in ${e.group} opens at Level 5`);
          break;
        }
        if (!spend(e, 'minor', 1)) break;
        state.proficiencyRanks[e.group] = current + 1;
        break;
      }

      case 'language-bought': {
        if (state.languages.includes(e.language)) { flag(e, 'duplicate', `already speaks ${e.language}`); break; }
        if (!spend(e, 'minor', 1)) break;
        state.languages.push(e.language);
        break;
      }

      case 'feat-bought': {
        const feat = featById(e.featId);
        if (!feat) { flag(e, 'unknown-ref', `unknown Feat "${e.featId}"`); break; }
        if (state.feats.some((f) => f.featId === e.featId)) {
          flag(e, 'duplicate', `${feat.name} is already taken`);
          break;
        }
        if (feat.levelGate && levelFor(state.milestones, state.crystallized) < feat.levelGate) {
          flag(e, 'over-cap', `${feat.name} opens at Level ${feat.levelGate}`);
          break;
        }
        if (feat.requires) {
          const unmet = meetsRequirement(state, feat.requires);
          if (unmet) { flag(e, 'no-access', `${feat.name} ${unmet}`); break; }
        }
        if (feat.choice) {
          const picked = e.choices?.[feat.choice.key];
          if (!picked) { flag(e, 'wrong-order', `choose a ${feat.choice.label} when taking ${feat.name}`); break; }
          if (!feat.choice.options.includes(picked)) {
            flag(e, 'unknown-ref', `"${picked}" is not a ${feat.choice.label} of ${feat.name}`);
            break;
          }
        }
        // A Ladder Feat's purchase is its first Rank; plain Feats have one cost.
        const cost = feat.ladder ? feat.ladder[0].cost : feat.cost ?? 'm';
        if (!spend(e, cost === 'M' ? 'major' : 'minor', 1)) break;
        state.feats.push({ featId: e.featId, choices: e.choices, rank: 1 });
        if (feat.ladder) featLadderWindow.set(e.featId, windowFor(state.milestones));
        break;
      }

      case 'feat-advanced': {
        const feat = featById(e.featId);
        const owned = state.feats.find((f) => f.featId === e.featId);
        if (!feat || !feat.ladder) { flag(e, 'unknown-ref', `no Feat Ladder "${e.featId}"`); break; }
        if (!owned) { flag(e, 'wrong-order', `${feat.name} is not owned`); break; }
        if (e.toRank !== owned.rank + 1) {
          flag(e, 'wrong-order', `${feat.name} is at Rank ${owned.rank}; next is ${owned.rank + 1}`);
          break;
        }
        const rank = feat.ladder[e.toRank - 1];
        if (!rank) { flag(e, 'over-cap', `${feat.name} is capped at Rank ${feat.ladder.length}`); break; }
        const window = windowFor(state.milestones);
        if (featLadderWindow.get(e.featId) === window) {
          flag(e, 'ladder-pace', `${feat.name} already climbed this Level`);
          break;
        }
        if (!spend(e, rank.cost === 'M' ? 'major' : 'minor', 1)) break;
        owned.rank = e.toRank;
        featLadderWindow.set(e.featId, window);
        break;
      }
    }
  }

  return { state, flags };
}
