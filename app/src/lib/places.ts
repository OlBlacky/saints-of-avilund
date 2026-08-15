// The places of Avilund a character can come from — the twelve polities of
// the continent, plus the Crusader City that stands apart from its bishopric.
//
// This is the registry behind three things at once: the Place of Origin a
// character is born to, the {place} slot a Quirk fills at roll time, and the
// origin access on the Regional Markets (lib/markets.ts). One list, so the
// three can never drift.
//
// Each place carries its Home Language. That is the whole rule: where you
// grew up decides the tongue you grew up speaking — a character never picks
// one against the other. Several places share a tongue (both Severic
// bishoprics; Havilah speaks Dunstanmoore's Moortongue, drifted), which is
// as it should be: a Dialect is a region's speech, not a state's.
//
// Deliberately absent: the Kells and the Feral marches. They are no polity,
// and a character born to either is a later expansion (ruled Aug 13 2026) —
// so Kellish and Common Feral are tongues you buy, not tongues you are raised
// to. This is not an oversight; don't quietly add them.
//
// See mechanics/languages.md and geography in setting-book/.

import type { Language } from './languages';

/** A place of origin: its name, its bloc tags, and the tongue raised there. */
export interface Place {
  /** The name as it reads in prose — quirk text sets it after "in" or "of". */
  value: string;
  /** Bloc and character tags: south/centre/north, ecclesiastic/republic/feudal… */
  tags: string[];
  /** The Home Language of anyone raised here. */
  language: Language;
}

/** The twelve polities and Lysander, south to north. */
export const PLACES: Place[] = [
  { value: 'the Bishopric of St. Dunstan', tags: ['south', 'ecclesiastic'], language: 'Imperial - Lysandrine' },
  { value: 'Lysander', tags: ['south', 'city'], language: 'Imperial - Lysandrine' },
  { value: 'the Bishopric of St. Severinius', tags: ['south', 'ecclesiastic'], language: 'Imperial - Severic' },
  { value: 'the Bishopric of St. Mairin', tags: ['south', 'ecclesiastic'], language: 'Imperial - Severic' },
  { value: 'Valdenwail', tags: ['south', 'ecclesiastic'], language: 'Imperial - Vailish' },
  { value: 'Waldheim', tags: ['centre', 'republic', 'city'], language: 'Republic - Waldisch' },
  { value: 'Dunstanmoore', tags: ['centre', 'republic', 'coastal'], language: 'Republic - Moortongue' },
  { value: 'Isenveld', tags: ['centre', 'republic', 'coastal'], language: 'Republic - Veldish' },
  { value: 'Havilah', tags: ['centre', 'colony', 'coastal'], language: 'Republic - Moortongue' },
  { value: 'the Bishopric of St. Ignatius', tags: ['centre', 'ecclesiastic'], language: 'Cyprian' },
  { value: 'Patrilund', tags: ['north', 'feudal'], language: 'Regnal - Patric' },
  { value: 'Mantlethorn', tags: ['north', 'feudal'], language: 'Regnal - Mantlish' },
  { value: 'Heirgallad', tags: ['north', 'feudal'], language: 'Regnal - Heirgallic' },
];

/** The place of that name, or undefined if the name is not one of ours. */
export function placeByName(name: string): Place | undefined {
  return PLACES.find((p) => p.value === name);
}

/** The tongue a character raised in `name` speaks from Level 0. */
export function homeLanguageFor(name: string): Language | undefined {
  return placeByName(name)?.language;
}
