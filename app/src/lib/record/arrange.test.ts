// The sheet's gear arrangement (builder spec §8): Stored items nest under
// the Container that holds them, in the order the player dragged them into,
// and a row dropped beside another joins that row's Container.

import { describe, expect, it } from 'vitest';
import { contentsOf, descendantsOf, gearRows, isStored, locationBeside } from './arrange';
import type { OwnedItem } from './replay';
import type { ItemLocation } from './events';

const item = (instanceId: string, location: ItemLocation): OwnedItem => ({
  instanceId,
  itemId: instanceId,
  name: instanceId,
  qty: 1,
  location,
  origin: 'purchase',
});

// A pack holding a pouch holding chalk, a sword loose at the belt, and a
// torch packed after the pouch.
const inventory: OwnedItem[] = [
  item('pack', 'equipped'),
  item('pouch', 'in:pack'),
  item('chalk', 'in:pouch'),
  item('sword', 'held'),
  item('torch', 'in:pack'),
];

const drawn = (rows: ReturnType<typeof gearRows>) =>
  rows.map((r) => `${'-'.repeat(r.depth)}${r.item.instanceId}`);

describe('nesting', () => {
  it('draws contents under their Container, one indent per depth', () => {
    const roots = inventory.filter((i) => !isStored(i) && i.instanceId !== 'sword');
    expect(drawn(gearRows(inventory, roots))).toEqual([
      'pack', '-pouch', '--chalk', '-torch',
    ]);
  });

  it('keeps the inventory order within a Container', () => {
    const reordered = [
      inventory[0], inventory[4], inventory[1], inventory[2], inventory[3],
    ];
    expect(drawn(gearRows(reordered, [reordered[0]]))).toEqual([
      'pack', '-torch', '-pouch', '--chalk',
    ]);
  });

  it('draws each item once, and survives a record that loops', () => {
    const looped = [item('a', 'in:b'), item('b', 'in:a')];
    expect(drawn(gearRows(looped, [looped[0]]))).toEqual(['a', '-b']);
  });

  it('names a Container\'s whole subtree, so it cannot be packed into itself', () => {
    expect([...descendantsOf(inventory, 'pack')].sort()).toEqual(['chalk', 'pouch', 'torch']);
    expect(descendantsOf(inventory, 'chalk').size).toBe(0);
    expect(contentsOf(inventory, 'pack').map((i) => i.instanceId)).toEqual(['pouch', 'torch']);
  });
});

describe('setting an item down beside another', () => {
  const held = item('a', 'held');
  const packed = item('b', 'in:pack');
  const equipped = item('c', 'equipped');

  it('joins the neighbour\'s Container', () => {
    expect(locationBeside(held, packed)).toBe('in:pack');
  });

  it('unpacks an item dropped beside a loose one', () => {
    expect(locationBeside(packed, equipped)).toBe('equipped');
  });

  it('leaves the Gear State alone when neither is Stored', () => {
    expect(locationBeside(held, equipped)).toBe('held');
  });
});
