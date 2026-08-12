// The languages of Avilund — the single source of truth for the tongue list,
// the three Language Families, and the Dialect kinship rule.
//
// The mundane vernaculars follow the three blocs of the map: each bloc is a
// Family, each region speaks a Dialect, and a Dialect's name carries its
// Family in front ("Imperial - Lysandrine"). Every Dialect is its own buy;
// Dialects of the same Family are close kin — a speaker of one can make
// themselves understood in another at −1 to social checks. Cyprian and
// Kellish stand alone, outside every Family.
//
// See mechanics/languages.md for the design record, and design-principles §10
// for the Skill/Language split ("Skills know, Languages read").

/** Every tongue of Avilund a character sheet can carry. */
export type Language =
  | 'Imperial'
  | 'Imperial - Lysandrine' | 'Imperial - Severic' | 'Imperial - Vailish'
  | 'Republic - Waldisch' | 'Republic - Moortongue' | 'Republic - Veldish'
  | 'Regnal - Patric' | 'Regnal - Mantlish' | 'Regnal - Heirgallic'
  | 'Cyprian' | 'Kellish' | 'Common Feral'
  | 'Auld Imperial' | 'Archipelago' | 'Elder' | 'Elder Arcana Tongue'
  | 'Arcane Tongue' | 'First Tongue' | 'Black Tongue' | 'Eldritch Tongue';

/** Everyone speaks Imperial; class/subclass language grants come on top. */
export const DEFAULT_LANGUAGE: Language = 'Imperial';

/** Runtime list of the languages of Avilund (mirrors the Language type). */
export const LANGUAGES: readonly Language[] = [
  'Imperial',
  'Imperial - Lysandrine', 'Imperial - Severic', 'Imperial - Vailish',
  'Republic - Waldisch', 'Republic - Moortongue', 'Republic - Veldish',
  'Regnal - Patric', 'Regnal - Mantlish', 'Regnal - Heirgallic',
  'Cyprian', 'Kellish', 'Common Feral',
  'Auld Imperial', 'Archipelago', 'Elder', 'Elder Arcana Tongue',
  'Arcane Tongue', 'First Tongue', 'Black Tongue', 'Eldritch Tongue',
];

/** The three Language Families, each named for the order that shaped it. */
export type LanguageFamily = 'Imperial' | 'Republic' | 'Regnal';

/**
 * Which Family each tongue belongs to. Tongues absent from this map (Cyprian,
 * Kellish, the learned and dead languages) stand alone and share kinship with
 * nothing. Imperial itself is the Imperial Family's koiné, kin to its three
 * Dialects.
 */
export const LANGUAGE_FAMILY: Partial<Record<Language, LanguageFamily>> = {
  'Imperial': 'Imperial',
  'Imperial - Lysandrine': 'Imperial',
  'Imperial - Severic': 'Imperial',
  'Imperial - Vailish': 'Imperial',
  'Republic - Waldisch': 'Republic',
  'Republic - Moortongue': 'Republic',
  'Republic - Veldish': 'Republic',
  'Regnal - Patric': 'Regnal',
  'Regnal - Mantlish': 'Regnal',
  'Regnal - Heirgallic': 'Regnal',
};

/** The social-check penalty when speaking across kindred Dialects. */
export const DIALECT_SOCIAL_PENALTY = -1;

/** A tongue's entry in the player-facing Languages reference. */
export interface LanguageNote {
  /**
   * Which section of the reference it lists under: the koine (Imperial), a
   * Family Dialect, a standalone vernacular, or a learned / dead / magic
   * tongue.
   */
  kind: 'koine' | 'dialect' | 'vernacular' | 'learned';
  /** Where it is spoken, or what is written in it. */
  note: string;
}

/** Player-facing notes for every tongue, rendered on /system/languages/. */
export const LANGUAGE_NOTES: Record<Language, LanguageNote> = {
  'Imperial': { kind: 'koine', note: 'The common tongue of the Empire and its successor states. Everyone speaks it.' },
  'Imperial - Lysandrine': { kind: 'dialect', note: 'The Bishopric of St. Dunstan and the city of Lysander. It carries Western loanwords from the crusader centuries.' },
  'Imperial - Severic': { kind: 'dialect', note: 'The Bishoprics of St. Severinius and St. Mairin.' },
  'Imperial - Vailish': { kind: 'dialect', note: 'Valdenwail. The court dialect, nearest to pure Imperial.' },
  'Republic - Waldisch': { kind: 'dialect', note: 'Waldheim.' },
  'Republic - Moortongue': { kind: 'dialect', note: 'Dunstanmoore. Havilah speaks its own drifted colonial variant.' },
  'Republic - Veldish': { kind: 'dialect', note: 'Isenveld.' },
  'Regnal - Patric': { kind: 'dialect', note: 'Patrilund.' },
  'Regnal - Mantlish': { kind: 'dialect', note: 'Mantlethorn.' },
  'Regnal - Heirgallic': { kind: 'dialect', note: 'Heirgallad.' },
  'Cyprian': { kind: 'vernacular', note: 'The Bishopric of St. Ignatius. Written in its own alphabet, devised by St. Cyprian to hide the Bishopric’s books from the burners of the Repurgo.' },
  'Kellish': { kind: 'vernacular', note: 'The Kells of the North. Deeply infused with the First Tongue.' },
  'Common Feral': { kind: 'vernacular', note: 'The Feral lingua franca. Mostly spoken; little of it is ever written.' },
  'Auld Imperial': { kind: 'learned', note: 'The working language of the Church and of scholarship.' },
  'Archipelago': { kind: 'learned', note: 'The ancestral tongue of the Holy Islands, and the faith’s first sacred speech. Nearly extinct.' },
  'Elder': { kind: 'learned', note: 'The spoken tongue of the extinct Elders. Nearly extinct.' },
  'Elder Arcana Tongue': { kind: 'learned', note: 'The Elders’ arcane notation. Elder Magic is written in it.' },
  'Arcane Tongue': { kind: 'learned', note: 'The modern arcane notation. New Magic spellbooks and scrolls are written in it.' },
  'First Tongue': { kind: 'learned', note: 'The ur-language, ancestor of all speech. It survives in rock-carvings, in scattered phrases, and in its infusion in Kellish. The tongue of Old Magic.' },
  'Black Tongue': { kind: 'learned', note: 'The secret tongue of the Black Faith, of curses, and of the Occult.' },
  'Eldritch Tongue': { kind: 'learned', note: 'The speech of the Outside.' },
};

/**
 * The tongues a character can call home: the nine Family Dialects and the
 * standalone vernaculars. Every character speaks two languages free from
 * creation — Imperial, and one of these. Derived from LANGUAGE_NOTES so the
 * list can never drift from the reference.
 */
export const HOME_LANGUAGES: readonly Language[] = LANGUAGES.filter((l) => {
  const kind = LANGUAGE_NOTES[l].kind;
  return kind === 'dialect' || kind === 'vernacular';
});

/**
 * The Family two different tongues share, if any. A speaker of one can make
 * themselves understood in the other at DIALECT_SOCIAL_PENALTY to social
 * checks. Returns null for the same tongue twice (no penalty applies) and for
 * tongues that share no Family.
 */
export function sharedFamily(a: Language, b: Language): LanguageFamily | null {
  if (a === b) return null;
  const fa = LANGUAGE_FAMILY[a];
  return fa !== undefined && fa === LANGUAGE_FAMILY[b] ? fa : null;
}
