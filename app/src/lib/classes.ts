// The 11 Classes and their Subclasses as typed rules data (builder spec §9,
// Layer A). The class pages in src/content/classes/ carry the prose and cues;
// this module is the single source for the mechanical grants. Six classes are
// complete; the remaining five (Noble, Scout, Warden, Artificer, Orator) join
// as they are designed.
//
// Stable-ID rule (spec §9): `id` never changes once published — renames touch
// `name` only. Save files, event logs, and Foundry export reference ids.

import type { Attribute, Language, WeaponGroup } from './quirks';

/** The five armour proficiency tracks — see mechanics/armour.md. */
export type ArmourProficiency =
  | 'Light Armour' | 'Medium Armour' | 'Heavy Armour'
  | 'Light Shield' | 'Heavy Shield';

/**
 * Implement proficiency groups — magic-item attack forms, proficiency-gated
 * exactly like weapon groups (they attack with Int).
 */
export type ImplementGroup =
  | 'Wands' | 'Magic Staves' | 'Scrolls' | 'Spellbooks' | 'Artefacts' | 'Orbs';

/** Runtime list of the 17 Weapon Proficiency groups (mechanics/weapons.md). */
export const WEAPON_GROUPS: readonly WeaponGroup[] = [
  'Axes', 'Heavy Blades', 'Light Blades', 'Hammers/Maces', 'Picks',
  'Flails/Chains', 'Polearms', 'Spears/Lances', 'Unarmed/Natural', 'Staves',
  'Bows', 'Crossbows', 'Slings', 'Thrown', 'Pistols', 'Rifles', 'Grenades',
];

/** Runtime list of the five armour proficiencies. */
export const ARMOUR_PROFICIENCIES: readonly ArmourProficiency[] = [
  'Light Armour', 'Medium Armour', 'Heavy Armour', 'Light Shield', 'Heavy Shield',
];

/** Runtime list of the implement groups. */
export const IMPLEMENT_GROUPS: readonly ImplementGroup[] = [
  'Wands', 'Magic Staves', 'Scrolls', 'Spellbooks', 'Artefacts', 'Orbs',
];

/**
 * Display-only asides carried by a grant table row — the parentheticals on the
 * class pages ("the athame", "stays nimble"). Never mechanical.
 */
export interface GrantNotes {
  /** Aside on the Ability Category row. */
  category?: string;
  /** Aside on the Weapon Proficiencies row. */
  weapons?: string;
  /** Aside on the Armour Proficiencies row. */
  armour?: string;
  /** Aside on the Languages row. */
  languages?: string;
}

/**
 * A Subclass: the second half of a build's grants. Adds a second Class
 * Attribute, a second Ability Category, Additional Class Skills, and further
 * proficiencies on top of its Class.
 */
export interface SubclassDef {
  /** Permanent stable id (kebab-case). Never changes once published. */
  id: string;
  /** Display name — may change freely; the id may not. */
  name: string;
  /** The second Class Attribute this Subclass adds. */
  classAttribute: Attribute;
  /** The second Ability Category — must exist in CATEGORIES. */
  abilityCategory: string;
  /**
   * Additional Class Skills (usually two). A parenthetical names a speciality
   * of a listed Skill, e.g. "Religion (Black Faith)".
   */
  additionalClassSkills: string[];
  /** Weapon Proficiency groups granted beyond the Class's. */
  weaponProficiencies: WeaponGroup[];
  /** Implement proficiency groups granted (magic-item attack forms). */
  implementProficiencies?: ImplementGroup[];
  /** Armour proficiencies granted beyond the Class's. */
  armourProficiencies: ArmourProficiency[];
  /** Languages granted by the Subclass (beyond the default Imperial). */
  languages?: Language[];
  /** Display asides for the grant table. */
  notes?: GrantNotes;
}

/**
 * A Class: the first half of a build's grants — Class Attribute, Ability
 * Category, Class HP, Class Skills, and proficiencies. Every Class carries
 * exactly three Subclasses.
 */
export interface ClassDef {
  /** Permanent stable id (kebab-case). Never changes once published. */
  id: string;
  /** Display name — may change freely; the id may not. */
  name: string;
  /** The saint portfolio this Class answers to (one of the 11). */
  portfolio: string;
  /** The first Class Attribute. */
  classAttribute: Attribute;
  /** The Class Ability Category — must exist in CATEGORIES. */
  abilityCategory: string;
  /** Class HP — the amount one Minor Advance of HP buys (1, 2, or 3). */
  classHP: 1 | 2 | 3;
  /** The two Class Skills. Parentheticals name a speciality. */
  classSkills: string[];
  /** Weapon Proficiency groups granted by the Class. */
  weaponProficiencies: WeaponGroup[];
  /** Armour proficiencies granted by the Class. */
  armourProficiencies: ArmourProficiency[];
  /** Languages granted by the Class (beyond the default Imperial). */
  languages?: Language[];
  /** Display asides for the grant table. */
  notes?: GrantNotes;
  /** The three Subclasses. */
  subclasses: SubclassDef[];
}

/** Everyone speaks Imperial; class/subclass language grants come on top. */
export const DEFAULT_LANGUAGE: Language = 'Imperial';

/** Runtime list of the languages of Avilund (mirrors the Language type). */
export const LANGUAGES: readonly Language[] = [
  'Imperial', 'Auld Imperial', 'Elder', 'Elder Arcana', 'Black Tongue',
  'Kellish', 'Common Feral', 'First Tongue', 'Archipelago', 'Eldritch Tongue',
];

export const CLASSES: ClassDef[] = [
  {
    id: 'soldier',
    name: 'Soldier',
    portfolio: 'Arms',
    classAttribute: 'Strength',
    abilityCategory: 'Arms',
    classHP: 3,
    classSkills: ['Endurance', 'Intimidate'],
    weaponProficiencies: ['Heavy Blades', 'Polearms', 'Crossbows'],
    armourProficiencies: ['Light Armour', 'Medium Armour', 'Light Shield'],
    subclasses: [
      {
        id: 'vanguard',
        name: 'Vanguard',
        classAttribute: 'Constitution',
        abilityCategory: 'Protection',
        additionalClassSkills: ['Survival', 'Perception'],
        weaponProficiencies: ['Hammers/Maces', 'Spears/Lances'],
        armourProficiencies: ['Heavy Armour', 'Heavy Shield'],
      },
      {
        id: 'commander',
        name: 'Commander',
        classAttribute: 'Charisma',
        abilityCategory: 'Leadership',
        additionalClassSkills: ['Diplomacy', 'Perception'],
        weaponProficiencies: ['Light Blades', 'Pistols'],
        armourProficiencies: [],
      },
      {
        id: 'marksman',
        name: 'Marksman',
        classAttribute: 'Dexterity',
        abilityCategory: 'Marksmanship',
        additionalClassSkills: ['Acrobatics', 'Perception'],
        weaponProficiencies: ['Bows', 'Rifles'],
        armourProficiencies: [],
        notes: { armour: 'none beyond the Class — stays nimble' },
      },
    ],
  },
  {
    id: 'friar',
    name: 'Friar',
    portfolio: 'Mercy',
    classAttribute: 'Wisdom',
    abilityCategory: 'Mercy',
    classHP: 2,
    classSkills: ['Heal', 'Religion (Saintly Faith)'],
    weaponProficiencies: ['Hammers/Maces', 'Staves'],
    armourProficiencies: [],
    subclasses: [
      {
        id: 'chaplain',
        name: 'Chaplain',
        classAttribute: 'Strength',
        abilityCategory: 'Arms',
        additionalClassSkills: ['Endurance', 'Perception'],
        weaponProficiencies: [],
        armourProficiencies: ['Light Armour', 'Medium Armour', 'Light Shield'],
      },
      {
        id: 'confessor',
        name: 'Confessor',
        classAttribute: 'Charisma',
        abilityCategory: 'Spiritual',
        additionalClassSkills: ['Sense Motive', 'Religion (Black Faith)'],
        weaponProficiencies: ['Light Blades'],
        armourProficiencies: ['Light Armour'],
        notes: { weapons: 'Hammers/Maces already from the Class' },
      },
      {
        id: 'mendicant',
        name: 'Mendicant',
        classAttribute: 'Constitution',
        abilityCategory: 'Forbearance',
        additionalClassSkills: ['Endurance', 'Survival'],
        weaponProficiencies: [],
        armourProficiencies: [],
        notes: { weapons: 'none — weaponless', armour: 'none — robes only' },
      },
    ],
  },
  {
    id: 'scholar',
    name: 'Scholar',
    portfolio: 'Letters',
    classAttribute: 'Intelligence',
    abilityCategory: 'Letters',
    classHP: 1,
    classSkills: ['History', 'Decipher Script'],
    weaponProficiencies: ['Staves'],
    armourProficiencies: [],
    languages: ['Auld Imperial'],
    notes: { category: 'scholarship', languages: 'plus Imperial' },
    subclasses: [
      {
        id: 'antiquarian',
        name: 'Antiquarian',
        classAttribute: 'Charisma',
        abilityCategory: 'Elder Magic',
        additionalClassSkills: ['Arcana', 'Dungeoneering'],
        weaponProficiencies: [],
        implementProficiencies: ['Artefacts', 'Spellbooks', 'Scrolls'],
        armourProficiencies: [],
      },
      {
        id: 'arcanist',
        name: 'Arcanist',
        classAttribute: 'Dexterity',
        abilityCategory: 'New Magic',
        additionalClassSkills: ['Arcana'],
        weaponProficiencies: [],
        implementProficiencies: ['Wands', 'Magic Staves', 'Spellbooks', 'Scrolls'],
        armourProficiencies: [],
      },
      {
        id: 'physician',
        name: 'Physician',
        classAttribute: 'Wisdom',
        abilityCategory: 'Medicine',
        additionalClassSkills: ['Heal', 'Nature'],
        weaponProficiencies: ['Light Blades'],
        armourProficiencies: [],
      },
    ],
  },
  {
    id: 'scoundrel',
    name: 'Scoundrel',
    portfolio: 'The Lost',
    classAttribute: 'Dexterity',
    abilityCategory: 'The Lost',
    classHP: 2,
    classSkills: ['Stealth', 'Thievery'],
    weaponProficiencies: ['Light Blades', 'Thrown'],
    armourProficiencies: ['Light Armour'],
    subclasses: [
      {
        id: 'assassin',
        name: 'Assassin',
        classAttribute: 'Intelligence',
        abilityCategory: 'Assassination',
        additionalClassSkills: ['Heal', 'Sleight of Hand'],
        weaponProficiencies: ['Crossbows', 'Unarmed/Natural'],
        armourProficiencies: [],
      },
      {
        id: 'charlatan',
        name: 'Charlatan',
        classAttribute: 'Charisma',
        abilityCategory: 'Guile',
        additionalClassSkills: ['Bluff', 'Disguise'],
        weaponProficiencies: ['Pistols'],
        armourProficiencies: [],
      },
      {
        id: 'blackcoat',
        name: 'Blackcoat',
        classAttribute: 'Wisdom',
        abilityCategory: 'Occult',
        additionalClassSkills: ['Religion (Black Faith)', 'The Planes'],
        weaponProficiencies: [],
        implementProficiencies: ['Artefacts'],
        armourProficiencies: [],
      },
    ],
  },
  {
    id: 'occultist',
    name: 'Occultist',
    portfolio: 'Death',
    classAttribute: 'Wisdom',
    abilityCategory: 'Occult',
    classHP: 1,
    classSkills: ['The Planes', 'Religion (Black Faith)'],
    weaponProficiencies: ['Staves'],
    armourProficiencies: [],
    languages: ['Black Tongue'],
    notes: {
      category: 'the gateway — sight & literacy, no attacks',
      languages: 'plus Imperial',
    },
    subclasses: [
      {
        id: 'witch-warlock',
        name: 'Witch/Warlock',
        classAttribute: 'Charisma',
        abilityCategory: 'Witchcraft',
        additionalClassSkills: ['Intimidate', 'Nature'],
        weaponProficiencies: ['Light Blades'],
        armourProficiencies: [],
        notes: { weapons: 'the athame' },
      },
      {
        id: 'grave-robber',
        name: 'Grave Robber',
        classAttribute: 'Intelligence',
        abilityCategory: 'Elder Magic',
        additionalClassSkills: ['Dungeoneering', 'Thievery'],
        weaponProficiencies: [],
        implementProficiencies: ['Artefacts', 'Spellbooks', 'Scrolls'],
        armourProficiencies: [],
        languages: ['Elder Arcana'],
        notes: { category: 'reused from the Scholar’s Antiquarian' },
      },
      {
        id: 'cosmologist',
        name: 'Cosmologist',
        classAttribute: 'Constitution',
        abilityCategory: 'The Outside',
        additionalClassSkills: ['Arcana', 'Concentration'],
        weaponProficiencies: [],
        implementProficiencies: ['Orbs'],
        armourProficiencies: [],
        languages: ['Eldritch Tongue'],
      },
    ],
  },
  {
    id: 'naturalist',
    name: 'Naturalist',
    portfolio: 'Harvest',
    classAttribute: 'Wisdom',
    abilityCategory: 'Harvest',
    classHP: 2,
    classSkills: ['Nature', 'Handle Animal'],
    weaponProficiencies: ['Flails/Chains', 'Staves'],
    armourProficiencies: ['Light Armour'],
    notes: {
      category: 'the country craft — wholly mundane, no attacks',
      weapons: 'the threshing flail and the walking staff',
    },
    subclasses: [
      {
        id: 'botanist',
        name: 'Botanist',
        classAttribute: 'Intelligence',
        abilityCategory: 'Botany',
        additionalClassSkills: ['Heal', 'Profession (Apothecary)'],
        weaponProficiencies: [],
        armourProficiencies: [],
      },
      {
        id: 'shepherd',
        name: 'Shepherd',
        classAttribute: 'Dexterity',
        abilityCategory: 'Husbandry',
        additionalClassSkills: ['Survival', 'Perception'],
        weaponProficiencies: ['Slings', 'Spears/Lances'],
        armourProficiencies: [],
        notes: { weapons: 'the sling his main arm; the wolf-spear' },
      },
      {
        id: 'drymann',
        name: 'Drymann',
        classAttribute: 'Charisma',
        abilityCategory: 'Old Magic',
        additionalClassSkills: ['Rituals', 'Local Knowledge'],
        weaponProficiencies: ['Light Blades'],
        armourProficiencies: [],
        languages: ['First Tongue'],
        notes: { weapons: 'the sickle' },
      },
    ],
  },
];

/** Look up a Class by stable id. */
export function classById(id: string): ClassDef | undefined {
  return CLASSES.find((c) => c.id === id);
}

/** The one-line class summary shown on index cards and page metadata. */
export function classSummary(cls: ClassDef): string {
  const [a, b, c] = cls.subclasses.map((s) => s.name);
  return `${cls.classAttribute} · ${cls.abilityCategory} · HP ${cls.classHP}. Choose the ${a}, the ${b}, or the ${c}.`;
}

/** Look up a Subclass by stable id, returning its Class alongside it. */
export function subclassById(
  id: string,
): { cls: ClassDef; sub: SubclassDef } | undefined {
  for (const cls of CLASSES) {
    const sub = cls.subclasses.find((s) => s.id === id);
    if (sub) return { cls, sub };
  }
  return undefined;
}
