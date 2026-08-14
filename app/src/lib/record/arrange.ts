// The sheet's gear arrangement: how a flat inventory draws as a nested list,
// and where a dragged row lands. Pure functions over the record's OwnedItem
// list — the Character Sheet only wires them to the drag events.
//
// The inventory array's order is the player's own arrangement (item-moved
// carries a position); these helpers preserve it everywhere.

import { containerAccess, rungAt, rungIndex } from '../equipment';
import type { AccessRung } from '../equipment';
import type { ItemLocation } from './events';
import type { OwnedItem } from './replay';

/** One drawn row: the item, and how deep it is packed (0 = loose). */
export interface GearRow {
  item: OwnedItem;
  depth: number;
}

/** Is this item Stored inside a Container? */
export function isStored(item: OwnedItem): boolean {
  return item.location.startsWith('in:');
}

/** The direct contents of a Container, in the sheet's order. */
export function contentsOf(inventory: OwnedItem[], instanceId: string): OwnedItem[] {
  return inventory.filter((i) => i.location === `in:${instanceId}`);
}

/** Everything an item holds, at any depth. A Container cannot be packed
 * into its own contents, so these rows refuse its drop. */
export function descendantsOf(inventory: OwnedItem[], instanceId: string): Set<string> {
  const held = new Set<string>();
  const walk = (id: string) => {
    for (const child of contentsOf(inventory, id)) {
      if (held.has(child.instanceId)) continue;
      held.add(child.instanceId);
      walk(child.instanceId);
    }
  };
  walk(instanceId);
  return held;
}

/** The rows a block draws: each root, then whatever it holds, one indent
 * deeper. A Stored item draws here and nowhere else. The seen set is
 * belt-and-braces — replay refuses containment loops, and a record that
 * carried one anyway would still draw rather than hang. */
export function gearRows(inventory: OwnedItem[], roots: OwnedItem[]): GearRow[] {
  const rows: GearRow[] = [];
  const seen = new Set<string>();
  const walk = (items: OwnedItem[], depth: number) => {
    for (const item of items) {
      if (seen.has(item.instanceId)) continue;
      seen.add(item.instanceId);
      rows.push({ item, depth });
      walk(contentsOf(inventory, item.instanceId), depth + 1);
    }
  };
  walk(roots, 0);
  return rows;
}

/** The Access a Container actually answers to: its own rung, or the slowest
 * link in the chain of Containers it is packed inside — a bandolier stuffed
 * in a backpack gives up its speed, because the pack has to be opened first.
 * `bonus` is the Feat shift (Deft Hands), applied once at the end.
 *
 * Undefined for anything that is not a Container. Rungs are indices, so the
 * slowest link is a min() and the Feat is arithmetic
 * (mechanics/encumbrance.md). */
export function accessFor(
  inventory: OwnedItem[],
  item: OwnedItem,
  bonus = 0,
): AccessRung | undefined {
  const own = item.itemId ? containerAccess(item.itemId) : undefined;
  if (own === undefined) return undefined;

  let slowest = rungIndex(own);
  let loc: string = item.location;
  const seen = new Set<string>([item.instanceId]);
  while (loc.startsWith('in:')) {
    const id = loc.slice(3);
    if (seen.has(id)) break;
    seen.add(id);
    const holder = inventory.find((i) => i.instanceId === id);
    if (!holder) break;
    const rung = holder.itemId ? containerAccess(holder.itemId) : undefined;
    if (rung !== undefined) slowest = Math.min(slowest, rungIndex(rung));
    loc = holder.location;
  }
  return rungAt(slowest + bonus);
}

/** Where an item lands when it is set down beside a neighbour: it joins
 * whatever Container the neighbour sits in. Where neither is Stored the
 * Gear State is the player's own, and a reorder leaves it alone. */
export function locationBeside(item: OwnedItem, anchor: OwnedItem): ItemLocation {
  return isStored(anchor) || isStored(item) ? anchor.location : item.location;
}
