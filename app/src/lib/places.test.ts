// The place registry — the twelve polities, the tongues they raise, and the
// two other tables that key off them (Quirk {place} slots, Regional Market
// origin access). These tests exist to catch drift between the three.

import { describe, expect, it } from 'vitest';
import { HOME_LANGUAGES } from './languages';
import { MARKETS } from './markets';
import { PLACES, homeLanguageFor, placeByName } from './places';

describe('the places of Avilund', () => {
  it('names each place once', () => {
    const names = PLACES.map((p) => p.value);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every place a tongue that is a real home language', () => {
    for (const place of PLACES) {
      expect(HOME_LANGUAGES).toContain(place.language);
    }
  });

  it('sorts every place into one of the three blocs', () => {
    for (const place of PLACES) {
      const blocs = place.tags.filter((t) => ['south', 'centre', 'north'].includes(t));
      expect(blocs).toHaveLength(1);
    }
  });

  it('reads a home language off a place, and nothing off a place we do not have', () => {
    expect(homeLanguageFor('Havilah')).toBe('Republic - Moortongue');
    expect(homeLanguageFor('Waldheim')).toBe('Republic - Waldisch');
    expect(homeLanguageFor('Atlantis')).toBeUndefined();
    expect(placeByName('Atlantis')).toBeUndefined();
  });

  it('opens every Regional Market on places that exist', () => {
    const regional = MARKETS.filter((m) => m.access.kind === 'origin');
    expect(regional.length).toBeGreaterThan(0);
    for (const market of regional) {
      const places = (market.access as { places: string[] }).places;
      for (const name of places) {
        expect(placeByName(name), `${market.name} opens for "${name}"`).toBeDefined();
      }
    }
  });
});
