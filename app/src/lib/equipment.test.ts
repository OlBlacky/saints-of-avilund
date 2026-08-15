import { describe, expect, it } from 'vitest';
import {
  AMMUNITION,
  ARMOURS,
  ARMOUR_TIER_AC,
  CAMP_AND_TRAIL,
  CATALOGUE,
  CLOTHING,
  CONTAINERS,
  FAITH_AND_SUPERSTITION,
  FOOD_AND_DRINK,
  HIRE,
  KITS,
  LIGHT_AND_FIRE,
  LODGING,
  MASTERWORK,
  MELEE_WEAPONS,
  MOUNTS_AND_VEHICLES,
  PASSAGE,
  RANGED_WEAPONS,
  ROPE_IRON_CLIMBING,
  SHIELDS,
  TOOLS_AND_IMPLEMENTS,
  WEAPON_GROUPS,
  WEAPON_PROPERTIES,
  STARTING_CLOTHES,
  fmtCoins,
  fmtPrice,
  fmtWeight,
  scaleIncrements,
  startingClothesFor,
} from './equipment';
import { CLASSES } from './classes';

describe('the starting-clothes table', () => {
  it('references only real Clothing items', () => {
    const ids = CLOTHING.map((c) => c.id);
    const all = [
      ...STARTING_CLOTHES.base,
      ...Object.values(STARTING_CLOTHES.byClass).flat(),
      ...Object.values(STARTING_CLOTHES.bySubclass).flat(),
    ];
    for (const id of all) expect(ids).toContain(id);
  });

  it('keys only real Class and Subclass ids', () => {
    const classIds = CLASSES.map((c) => c.id);
    const subclassIds = CLASSES.flatMap((c) => c.subclasses.map((s) => s.id));
    for (const id of Object.keys(STARTING_CLOTHES.byClass)) expect(classIds).toContain(id);
    for (const id of Object.keys(STARTING_CLOTHES.bySubclass)) expect(subclassIds).toContain(id);
  });

  it('composes base + Class + Subclass options, without duplicates', () => {
    expect(startingClothesFor()).toEqual(['common-outfit', 'travellers-outfit']);
    expect(startingClothesFor('scholar', 'antiquarian')).toContain('scholars-robes');
    expect(startingClothesFor('scoundrel', 'charlatan')).toContain('courtiers-outfit');
    const soldier = startingClothesFor('soldier', 'commander');
    expect(soldier).toEqual([...new Set(soldier)]);
  });
});

describe('the catalogue lift preserves the page counts', () => {
  it('45 arms across 17 groups', () => {
    expect(MELEE_WEAPONS.length + RANGED_WEAPONS.length).toBe(45);
    expect(WEAPON_GROUPS.length).toBe(17);
  });

  it('section counts match the hand-written tables', () => {
    expect(MELEE_WEAPONS).toHaveLength(30);
    expect(RANGED_WEAPONS).toHaveLength(15);
    expect(AMMUNITION).toHaveLength(4);
    expect(ARMOURS).toHaveLength(9);
    expect(SHIELDS).toHaveLength(4);
    expect(MASTERWORK).toHaveLength(4);
    expect(CONTAINERS).toHaveLength(18);
    expect(LIGHT_AND_FIRE).toHaveLength(7);
    expect(CAMP_AND_TRAIL).toHaveLength(10);
    expect(ROPE_IRON_CLIMBING).toHaveLength(13);
    expect(TOOLS_AND_IMPLEMENTS).toHaveLength(22);
    expect(CLOTHING).toHaveLength(11);
    expect(FAITH_AND_SUPERSTITION).toHaveLength(8);
    expect(FOOD_AND_DRINK).toHaveLength(11);
    expect(LODGING).toHaveLength(8);
    expect(MOUNTS_AND_VEHICLES).toHaveLength(15);
    expect(PASSAGE).toHaveLength(3);
    expect(HIRE).toHaveLength(10);
    expect(KITS).toHaveLength(5);
    expect(WEAPON_PROPERTIES).toHaveLength(7);
  });
});

describe('shields carry an attack profile', () => {
  it('the Buckler bashes for 1d3, every other shield for 1d4', () => {
    expect(SHIELDS.find((s) => s.id === 'buckler')?.damage).toBe('1d3');
    for (const s of SHIELDS.filter((s) => s.id !== 'buckler')) {
      expect(s.damage, s.name).toBe('1d4');
    }
    expect(SHIELDS.every((s) => s.type === 'Blunt')).toBe(true);
  });
});

describe('catalogue integrity', () => {
  it('every id is unique', () => {
    const ids = CATALOGUE.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every weapon group is a real group, and every group is represented', () => {
    const used = new Set([...MELEE_WEAPONS, ...RANGED_WEAPONS].map((w) => w.group));
    for (const g of used) expect(WEAPON_GROUPS).toContain(g);
    for (const g of WEAPON_GROUPS) expect(used.has(g)).toBe(true);
  });

  it('prices are positive integers of copper where present', () => {
    for (const e of CATALOGUE) {
      if (e.priceCp !== null) {
        expect(Number.isInteger(e.priceCp), e.id).toBe(true);
        expect(e.priceCp, e.id).toBeGreaterThan(0);
      }
    }
  });

  it('weights are positive where present', () => {
    for (const e of CATALOGUE) {
      if (e.weightLb !== null) expect(e.weightLb, e.id).toBeGreaterThan(0);
    }
  });

  it('only the Club and the Unarmed Strike are priceless weapons', () => {
    const free = [...MELEE_WEAPONS, ...RANGED_WEAPONS].filter((w) => w.priceCp === null);
    expect(free.map((w) => w.id).sort()).toEqual(['club', 'unarmed-strike']);
  });

  it('armour tiers map to their flat AC bonus', () => {
    expect(ARMOUR_TIER_AC.Light).toBe(1);
    expect(ARMOUR_TIER_AC.Medium).toBe(2);
    expect(ARMOUR_TIER_AC.Heavy).toBe(3);
    for (const a of ARMOURS) expect(['Light', 'Medium', 'Heavy']).toContain(a.tier);
  });

  it('light armour carries no penalties', () => {
    for (const a of ARMOURS.filter((x) => x.tier === 'Light')) {
      expect(a.speedPenaltyFt).toBe(0);
      expect(a.stealthPenalty).toBe(0);
      expect(a.strReq).toBeNull();
    }
  });

  it('spot-checks against the old page', () => {
    const longsword = MELEE_WEAPONS.find((w) => w.id === 'longsword')!;
    expect(fmtPrice(longsword.priceCp)).toBe('15 sp');
    expect(longsword.properties).toContain('Versatile (1d10)');
    const plate = ARMOURS.find((a) => a.id === 'full-plate')!;
    expect(fmtPrice(plate.priceCp)).toBe('1,500 sp');
    const musket = RANGED_WEAPONS.find((w) => w.id === 'musket')!;
    expect(fmtPrice(musket.priceCp)).toBe('200 sp');
    expect(musket.range).toBe('80/160/240');
  });
});

describe('range increments', () => {
  it('scales a weapon’s bands by the Ability’s WRI multiplier', () => {
    const sling = RANGED_WEAPONS.find((w) => w.id === 'sling')!;
    expect(scaleIncrements(sling.range)).toBe("50'/100'/150'");
    expect(scaleIncrements(sling.range, 2)).toBe("100'/200'/300'");
    const spear = MELEE_WEAPONS.find((w) => w.id === 'spear')!;
    expect(scaleIncrements(spear.range, 3)).toBe("60'/120'/180'");
  });

  it('gives no bands to a weapon that has none', () => {
    const greatsword = MELEE_WEAPONS.find((w) => w.id === 'greatsword')!;
    expect(greatsword.range).toBeNull();
    expect(scaleIncrements(greatsword.range, 2)).toBeNull();
  });
});

describe('money formatting', () => {
  it('list prices render single-denomination, as the book writes them', () => {
    expect(fmtPrice(20)).toBe('2 sp');
    expect(fmtPrice(5)).toBe('5 cp');
    expect(fmtPrice(1)).toBe('1 cp');
    expect(fmtPrice(15000)).toBe('1,500 sp');
    expect(fmtPrice(null)).toBe('—');
  });

  it('wealth renders reduced to the fewest coins', () => {
    expect(fmtCoins(11)).toBe('1 sp 1 cp');
    expect(fmtCoins(10)).toBe('1 sp');
    expect(fmtCoins(7)).toBe('7 cp');
    expect(fmtCoins(0)).toBe('0 cp');
    expect(fmtCoins(2005)).toBe('200 sp 5 cp');
  });

  it('weights render as the page wrote them', () => {
    expect(fmtWeight(0.5)).toBe('½ lb');
    expect(fmtWeight(10)).toBe('10 lb');
    expect(fmtWeight(null)).toBe('—');
  });
});
