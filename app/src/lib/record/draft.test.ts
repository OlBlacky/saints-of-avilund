import { describe, expect, it } from 'vitest';

import { renamedInstance } from './draft';
import type { AbilityRef, RecordEvent } from './events';

const ref: AbilityRef = { category: 'New Magic', ability: 'Elemental Bolt' };

let n = 0;
function ev<T extends RecordEvent['type']>(
  type: T,
  data: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
): RecordEvent {
  n += 1;
  return { id: `e${n}`, at: '2026-08-16T00:00:00.000Z', source: 'player', type, ...data } as RecordEvent;
}

const fresh = (name: string) => () => ev('ability-renamed', { ref, instanceId: 'sp1', name });

describe('naming a builder instance', () => {
  const bought = ev('ability-bought', { ref, instanceId: 'sp1', instanceName: 'Bolt' });
  const other = ev('ability-bought', { ref, instanceId: 'sp2' });

  it('rides on the buy event while the purchase is still the draft’s own', () => {
    const out = renamedInstance([bought, other], 0, 'sp1', 'Anselm’s Dart', fresh('Anselm’s Dart'));
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ type: 'ability-bought', instanceName: 'Anselm’s Dart' });
    expect(out[1]).toBe(other);
  });

  it('logs a rename once the buy is below the floor', () => {
    const crystal = ev('crystallized', {});
    const out = renamedInstance([bought, crystal], 2, 'sp1', 'Winter’s Tooth', fresh('Winter’s Tooth'));
    expect(out).toHaveLength(3);
    expect(out[0]).toBe(bought); // history stands untouched
    expect(out[2]).toMatchObject({ type: 'ability-renamed', instanceId: 'sp1', name: 'Winter’s Tooth' });
  });

  it('further keystrokes edit this Session’s rename, not one event per letter', () => {
    const crystal = ev('crystallized', {});
    let events = [bought, crystal];
    for (const name of ['W', 'Wi', 'Win']) {
      events = renamedInstance(events, 2, 'sp1', name, fresh(name));
    }
    expect(events).toHaveLength(3);
    expect(events[2]).toMatchObject({ type: 'ability-renamed', name: 'Win' });
  });

  it('leaves an earlier Session’s rename alone and logs its own', () => {
    const crystal = ev('crystallized', {});
    const old = ev('ability-renamed', { ref, instanceId: 'sp1', name: 'Old Name' });
    const out = renamedInstance([bought, crystal, old], 3, 'sp1', 'New Name', fresh('New Name'));
    expect(out).toHaveLength(4);
    expect(out[2]).toBe(old);
    expect(out[3]).toMatchObject({ type: 'ability-renamed', name: 'New Name' });
  });

  it('names an instance bought within this Session on its own buy event', () => {
    const crystal = ev('crystallized', {});
    const later = ev('ability-bought', { ref, instanceId: 'sp3' });
    const out = renamedInstance([bought, crystal, later], 2, 'sp3', 'Fresh Spell', fresh('Fresh Spell'));
    expect(out).toHaveLength(3);
    expect(out[2]).toMatchObject({ type: 'ability-bought', instanceName: 'Fresh Spell' });
  });
});
