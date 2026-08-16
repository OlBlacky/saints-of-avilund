// Draft privileges: the edits the builder is allowed to make to its own
// event list, as pure functions over that list. The floor is where the
// draft's own work begins — 0 while a character is still being created,
// and the start of this Advancement Session once the record is crystallized.
// Nothing below the floor is a draft any more; it is the record.

import type { RecordEvent } from './events';

/** Name a builder instance (a Spell, a Companion card).
 *
 * A purchase still inside the draft carries its own name, so the name rides
 * on the buy event and no rename is logged at all. Once that buy is history,
 * the name becomes its own free event — and this Session's rename event
 * absorbs every further keystroke, so typing a name logs one event, not one
 * per letter. `fresh` builds that event, and is called only when one is
 * actually needed. */
export function renamedInstance(
  events: RecordEvent[],
  floor: number,
  instanceId: string,
  name: string,
  fresh: () => RecordEvent,
): RecordEvent[] {
  const bought = events.findIndex(
    (x) => x.type === 'ability-bought' && x.instanceId === instanceId,
  );
  if (bought >= 0 && bought >= floor) {
    return events.map((x, i) =>
      i === bought && x.type === 'ability-bought' ? { ...x, instanceName: name } : x,
    );
  }
  for (let i = events.length - 1; i >= floor; i -= 1) {
    const x = events[i];
    if (x.type === 'ability-renamed' && x.instanceId === instanceId) {
      return events.map((y, j) =>
        j === i && y.type === 'ability-renamed' ? { ...y, name } : y,
      );
    }
  }
  return [...events, fresh()];
}
