// The Feats data gate: ids stable and unique, every Feat carries its brief
// and full texts, requirements point at real things, and Ladders are shaped
// right. A malformed Feat fails the deploy, named.

import { describe, expect, it } from 'vitest';

import { ARMOUR_PROFICIENCIES, IMPLEMENT_GROUPS, WEAPON_GROUPS } from './classes';
import { FEATS, specializationFor } from './feats';
import { SKILLS } from './skills';

describe('feats data', () => {
  it('has unique kebab-case ids', () => {
    const ids = FEATS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every Feat carries brief and full texts, briefly', () => {
    for (const f of FEATS) {
      expect(f.brief, f.id).toBeTruthy();
      expect(f.full, f.id).toBeTruthy();
      expect(f.brief.length, `${f.id} brief runs long`).toBeLessThanOrEqual(90);
    }
  });

  it('sheet text states only what is in force — no gates', () => {
    const gates = /Requires|Opens at Level|One Rank per Level|Open to natives/;
    for (const f of FEATS) {
      if (f.ladder) {
        for (const r of f.ladder) {
          expect(r.now ?? r.value, `${f.id}: ${r.value}`).not.toMatch(gates);
        }
      } else {
        expect(f.now ?? f.full, f.id).not.toMatch(gates);
      }
    }
  });

  it('is priced: a plain cost or a Ladder, never neither or both', () => {
    for (const f of FEATS) {
      expect(Boolean(f.cost) || Boolean(f.ladder), `${f.id} has no price`).toBe(true);
      if (f.ladder) {
        expect(f.ladder.length, f.id).toBeGreaterThanOrEqual(2);
        for (const r of f.ladder) expect(['m', 'M']).toContain(r.cost);
      }
    }
  });

  it('proficiency and skill requirements name real things', () => {
    const groups = new Set<string>([...WEAPON_GROUPS, ...ARMOUR_PROFICIENCIES, ...IMPLEMENT_GROUPS]);
    const skills = new Set(SKILLS.map((s) => s.name));
    for (const f of FEATS) {
      if (f.requires?.kind === 'proficiency') {
        expect(groups, `${f.id}: ${f.requires.group}`).toContain(f.requires.group);
      }
      if (f.requires?.kind === 'skill-trained') {
        expect(skills, `${f.id}: ${f.requires.skill}`).toContain(f.requires.skill);
      }
      if (f.requires?.kind === 'skill-rank') {
        expect(skills, `${f.id}: ${f.requires.skill}`).toContain(f.requires.skill);
      }
    }
  });

  it('finds the Specialization whose Hook applies to a build choice', () => {
    const feat = FEATS.find((f) => f.requires?.kind === 'malediction')!;
    const choice = (feat.requires as { kind: 'malediction'; name: string }).name;
    expect(specializationFor([feat.id], choice)?.id).toBe(feat.id);
    // Held for a different Malediction, or not held at all.
    expect(specializationFor([feat.id], 'Some Other Malediction')).toBeUndefined();
    expect(specializationFor([], choice)).toBeUndefined();
  });

  it('matches damage-type Specializations to their type', () => {
    for (const f of FEATS.filter((x) => x.requires?.kind === 'damage-type')) {
      const type = (f.requires as { kind: 'damage-type'; type: string }).type;
      expect(specializationFor([f.id], type)?.id, type).toBe(f.id);
    }
  });

  it('covers the canonical rosters', () => {
    expect(FEATS.filter((f) => f.requires?.kind === 'proficiency').length).toBe(17 + 2);
    expect(FEATS.filter((f) => f.requires?.kind === 'damage-type')).toHaveLength(9);
    expect(FEATS.filter((f) => f.requires?.kind === 'malediction')).toHaveLength(6);
    expect(FEATS.filter((f) => f.requires?.kind === 'skill-rank')).toHaveLength(SKILLS.length);
    expect(FEATS.filter((f) => f.requires?.kind === 'attribute')).toHaveLength(12);
    expect(FEATS.filter((f) => f.requires?.kind === 'save-total')).toHaveLength(6);
    expect(FEATS.filter((f) => f.ladder)).toHaveLength(19 + SKILLS.length);
  });
});
