// Traditions — the tie between a magic Ability Category, its knowledge Skill,
// and its Language. "Skills know, Languages read" (design-principles §10): the
// Skill knows the tradition, the Language reads its texts, and neither is ever
// the other. A Category listed here is a casting Category; every card in it
// inherits the tradition's Keywords at render — Keywords are never authored on
// a card by hand. Categories absent from this table are not magic and carry no
// Keywords.
//
// Reused cards (a Letters literacy card hosted in Occult, say) take the
// Keywords of the HOSTING Category, so the same card wears different Keywords
// on different sheets. The class-grant consistency (every casting Class or
// Subclass grants its tradition's Skill and Language) is enforced by
// traditions.test.ts.

import type { Language } from './quirks';

export interface Tradition {
  /** The tradition's knowledge Skill — a name from lib/skills.ts. */
  skill: string;
  /** The tongue the tradition's texts are written in. */
  language: Language;
}

export const TRADITIONS: Record<string, Tradition> = {
  'Mercy': { skill: 'Religion (Saintly Faith)', language: 'Auld Imperial' },
  'Spiritual': { skill: 'Religion (Saintly Faith)', language: 'Auld Imperial' },
  'New Magic': { skill: 'Arcana', language: 'Arcane Tongue' },
  'Elder Magic': { skill: 'Elder Arcana', language: 'Elder Arcana Tongue' },
  'Occult': { skill: 'Knowledge: Occult', language: 'Black Tongue' },
  'Witchcraft': { skill: 'Religion (Black Faith)', language: 'Black Tongue' },
  'The Outside': { skill: 'Knowledge: Planes', language: 'Eldritch Tongue' },
  'Old Magic': { skill: 'Nature', language: 'First Tongue' },
};

/** The Keywords a Category confers on its cards — null for non-magic Categories. */
export function keywordsFor(category: string): string[] | null {
  const t = TRADITIONS[category];
  return t ? [t.skill, t.language] : null;
}
