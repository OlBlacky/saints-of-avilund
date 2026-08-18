// The Character Sheet, Page 3 · Gear (builder spec §8) — the first sheet
// page built. Shown by the builder once a character is Complete. Sections:
// Weapons and Armour with their full stat blocks from rules data, Equipment
// grouped by location (containers with subtotals), the Load line, Wealth,
// and The Markets for downtime trips — where selling finally lives.
//
// Sell prices appear only where an accessible Market buys the item, source
// named; nothing shows a price before the first Session is logged (the New
// state), silently. Moves and trips are logged events through the engine gate.

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { VAR_ORDER, actionBadge, chosenLadder, freqBadge, resolveRung, resolveValue } from '../../lib/abilities';
import type { Ability } from '../../lib/abilities';
import { CATEGORIES } from '../../lib/category-abilities';
import { classById } from '../../lib/classes';
import {
  ARMOURS,
  ARMOUR_TIER_AC,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  SHIELDS,
  ACCESS_LABEL,
  carriesNoLoad,
  itemNote,
  containerAccess,
  containerAccessNote,
  containerCapacityLb,
  containerCoefficient,
  containerNote,
  fmtCoins,
  fmtWeight,
  isWearable,
  scaleIncrements,
} from '../../lib/equipment';
import type { Weapon } from '../../lib/equipment';
import type { UnlockedHook } from '../../lib/feats';
import { featById, hookMatchesGroup, specializationFor, unlockedHooks } from '../../lib/feats';
import { LANGUAGES } from '../../lib/languages';
import type { Language } from '../../lib/languages';
import { bestSell, itemName, itemWeightLb, marketById, marketOpen } from '../../lib/markets';
import { MAX_QUALITIES, isMasterworkWeapon, isMasterworkItem, qualitiesFor, qualityById, qualityDamage, qualityRange, qualityWeightLb, type Quality } from '../../lib/masterwork';
import { addToDamage, DAMAGE_TYPES, parseAttr } from '../../lib/notation';
import { keywordsFor } from '../../lib/traditions';
import { PLACES, homeLanguageFor } from '../../lib/places';
import { fill, QUIRKS } from '../../lib/quirks';
import type { EventSource, RecordEvent } from '../../lib/record/events';
import type { ItemLocation } from '../../lib/record/events';
import { accessFor, contentsOf, descendantsOf, gearRows, isStored, locationBeside } from '../../lib/record/arrange';
import type { Breakdown, DerivedSheet, Part } from '../../lib/record/derive';
import { COMPANION_TYPES, hasOwnLevel } from '../../lib/companions';
import { abilityKey, companionBank, companionLevel, languageAllowance } from '../../lib/record/replay';
import type { CharacterState, OwnedItem } from '../../lib/record/replay';
import type { PlayState, VersionPayload } from '../../lib/store';
import MarketShop, { QualityMenu, basketTotalsCp, commerceRankOf } from './MarketShop';
import type { BasketLine } from './MarketShop';

/** Where a dragged item lands on the row under the pointer: beside it, or —
 * over a Container's middle — inside it. */
type DropZone = 'before' | 'after' | 'into';

let counter = 0;
function mk<T extends RecordEvent['type']>(
  type: T,
  data: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
  source: EventSource = 'player',
): RecordEvent {
  counter += 1;
  return {
    id: `${Date.now().toString(36)}-s${counter}`,
    at: new Date().toISOString(),
    source,
    type,
    ...data,
  } as RecordEvent;
}

const PAGES: { n: number; label: string; built: boolean }[] = [
  { n: 1, label: 'Basics', built: true },
  { n: 2, label: 'Attacks & Abilities', built: true },
  { n: 3, label: 'Inventory', built: true },
  { n: 4, label: 'Log', built: true },
  { n: 5, label: 'Full Detail', built: false },
];

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

/** An event's date, for the log. */
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Shrink an uploaded portrait to a small JPEG data URL — browser storage
 * is modest, and the sheet never shows it larger than a card. */
function resizePortrait(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

/** Math-line labels use the 3-letter attribute short (Str, Dex, …) — the
 * same abbreviation the notation grammar and play-mode annotations use
 * elsewhere on the sheet. Non-attribute labels (Vow names, "Base",
 * "Ranks") pass through untouched. */
const partText = (p: { label: string; value: number }) => {
  const label = parseAttr(p.label) ?? p.label;
  return p.label === 'Base' ? `${label} ${p.value}` : `${label} ${signed(p.value)}`;
};

/** Quirk, Gear, Ability, and Feat titles are long enough to stretch a table
 * out of its box, so the math line prints the collective word instead —
 * "Quirks +1" — and the sources are named beneath the table. Two parts from
 * the same family fold into one entry. */
function condense(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const p of parts) {
    if (!p.group) {
      out.push(p);
      continue;
    }
    const held = out.find((q) => q.group === p.group);
    if (held) held.value += p.value;
    else out.push({ ...p, label: p.group });
  }
  return out;
}

/** Parts that appear, same label and value, in every breakdown of a set —
 * e.g. a flat Vow bonus that lands on all six Attribute rows alike. Pulling
 * these out of the per-row text keeps a table-wide constant from being
 * printed once per row. */
function commonParts(breakdowns: Breakdown[]): Part[] {
  const [first, ...rest] = breakdowns;
  if (!first) return [];
  return first.parts.filter((p) =>
    rest.every((b) => b.parts.some((q) => q.label === p.label && q.value === p.value)),
  );
}

/** A derived number that shows its work in plain sight — the sheet prints,
 * so the parts sit under the total, never behind a hover. `omit` drops parts
 * already stated once for the whole table (see commonParts). */
function Bd({ b, plain, omit }: { b: Breakdown; plain?: boolean; omit?: Part[] }) {
  const parts = condense(
    omit
      ? b.parts.filter((p) => !omit.some((o) => o.label === p.label && o.value === p.value))
      : b.parts,
  );
  return (
    <span class="sheet-bd">
      <span class="sheet-bd-total">{plain ? b.total : signed(b.total)}</span>
      {parts.length > 0 && (
        <span class="sheet-bd-parts">{parts.map(partText).join(' · ')}</span>
      )}
    </span>
  );
}

/** One log line per event — the record read back as prose. */
function describeEvent(e: RecordEvent): string {
  switch (e.type) {
    case 'class-chosen': return `Chose the ${classById(e.classId)?.name ?? e.classId}`;
    case 'subclass-chosen': return `Chose the ${e.subclassId} Subclass`;
    case 'origin-chosen': return `Raised in ${e.place}${homeLanguageFor(e.place) ? ` — speaks ${homeLanguageFor(e.place)}` : ''}`;
    case 'home-language-chosen': return `Home language: ${e.language}`;
    case 'clothes-chosen': return `Starting clothes: ${itemName(e.itemId) ?? e.itemId}`;
    case 'flaw-taken': return `Took a Flaw: −1 ${e.attr}`;
    case 'quirk-rolled': return `Rolled the Quirk & Starting Gear package: ${e.quirkName}${e.gearName ? ` · ${e.gearName}` : ''}${e.rerollsUsed ? ` (reroll ${e.rerollsUsed})` : ''}`;
    case 'crystallized': return 'Finished — creation complete, play begins at Level 0';
    case 'milestone-granted': return `Milestone granted${e.note ? ` — ${e.note}` : ''}`;
    case 'session-logged': return `Session logged${e.note ? ` — ${e.note}` : ''}`;
    case 'attribute-bought': return `+1 ${e.attr}`;
    case 'ability-bought': return `Bought ${e.instanceName ?? e.ref.ability} (${e.ref.category})`;
    case 'ability-renamed': return `Renamed an instance to ${e.name}`;
    case 'ability-advanced': return `Advanced ${e.ref.ability}: ${e.variable} to Rank ${e.toRank}`;
    case 'class-added': return `Added the ${classById(e.classId)?.name ?? e.classId}`;
    case 'offence-bought': return `+1 ${e.attr} Offence`;
    case 'defence-bought': return `+1 ${e.attr} Defence`;
    case 'hp-bought': return 'Bought HP';
    case 'skill-trained': return `Trained ${e.skill}`;
    case 'skill-advanced': return `+1 Rank in ${e.skill}`;
    case 'proficiency-bought': return `Bought proficiency: ${e.group}`;
    case 'proficiency-advanced': return `Advanced proficiency: ${e.group}`;
    case 'language-bought': return `Learned ${e.language}`;
    case 'feat-bought': return `Took the Feat: ${featById(e.featId)?.name ?? e.featId}${e.choices ? ` (${Object.values(e.choices).join(', ')})` : ''}`;
    case 'feat-advanced': return `Climbed ${featById(e.featId)?.name ?? e.featId} to Rank ${e.toRank}`;
    case 'companion-named': return `Named the Companion: ${e.name}`;
    case 'companion-advanced': return `Advanced the Companion's ${e.ladder} to Rank ${e.toRank}`;
    case 'transaction': {
      const n = e.lines.length;
      const markets = [...new Set(e.lines.map((l) => marketById(l.marketId)?.name ?? l.marketId))];
      return `${e.note === 'creation shopping' ? 'Creation shopping' : 'A market trip'} — ${n} line${n === 1 ? '' : 's'} at ${markets.join(', ')}`;
    }
    case 'item-granted': return `Received ${e.name ?? e.itemId}${e.qty && e.qty > 1 ? ` ×${e.qty}` : ''}${e.note ? ` — ${e.note}` : ''}`;
    case 'coin-granted': return `${e.amountSp >= 0 ? 'Reward' : 'Coin taken'}: ${fmtCoins(Math.abs(e.amountSp) * 10)}${e.note ? ` — ${e.note}` : ''}`;
    case 'item-moved': return `Moved an item`;
  }
}

type Identity = VersionPayload['identity'];

interface Props {
  identity: Identity;
  setIdentity: (k: keyof Identity, v: string) => void;
  status: PlayState;
  setStatus: (s: PlayState) => void;
  state: CharacterState;
  sheet: DerivedSheet;
  events: RecordEvent[];
  basket: BasketLine[];
  setBasket: (basket: BasketLine[]) => void;
  append: (e: RecordEvent) => void;
  why: (e: RecordEvent) => string | null;
  /** Saved box order per page — the player drags the sheet's boxes into
   * their own arrangement, and it persists with the character. */
  boxOrder?: Record<string, string[]>;
  setBoxOrder: (pageKey: string, ids: string[]) => void;
  /** Open the Advancement door — spending banked Advances between Sessions. */
  onAdvance: () => void;
  /** True in the visitors' sandbox — the scratch space, where Milestones
   * grant freely. */
  sandbox: boolean;
  /** Copy this character into the sandbox (roster characters only). */
  onSandboxCopy?: () => void;
}

/** The boxes each page owns, in their default order. */
const PAGE_BOXES: Record<string, string[]> = {
  p1: ['vitals', 'details', 'attributes', 'skills', 'profs', 'feats', 'situational', 'quirks'],
  p2: ['attacks', 'abilities', 'companions'],
  p3: ['weapons', 'wearables', 'equipment', 'nearby', 'home', 'wealth', 'markets'],
};

export default function CharacterSheet({ identity, setIdentity, status, setStatus, state, sheet, events, basket, setBasket, append, why, boxOrder, setBoxOrder, onAdvance, sandbox, onSandboxCopy }: Props) {
  const [page, setPage] = useState(1);
  // Commerce is a deliberate act: the Markets show only once opened. An
  // unfinished trip (a Basket with lines) re-opens itself — you are still
  // at market. Nothing is logged until the trip commits.
  const [commerceOpen, setCommerceOpen] = useState(basket.length > 0);
  // The Character State gates access: a New character (no Sessions yet)
  // trades nothing, and the Markets open only in Downtime.
  const atMarket = status === 'downtime';
  // Page 2 state: curated attack lines (hidden, never deleted) and the
  // table-scratch Conditions (never logged, reset freely).
  const [hiddenAttacks, setHiddenAttacks] = useState<string[]>([]);
  const [showHiddenAttacks, setShowHiddenAttacks] = useState(false);
  // Weapon lines on Ability cards curate the same way: hidden, never deleted.
  const [hiddenCardWeapons, setHiddenCardWeapons] = useState<string[]>([]);
  const [revealedCards, setRevealedCards] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionEntry, setConditionEntry] = useState('');
  // Temp HP is table scratch, like Conditions — never logged.
  const [tempHp, setTempHp] = useState('');
  // Manage Mode: the sheet is read-only at the table; the Manage Character
  // button opens the editing surfaces (Details, Sessions, Milestones).
  const [manage, setManage] = useState(false);
  // Pending Quality ticks per owned instance (the Commission button spends them).
  const [mwTicks, setMwTicks] = useState<Record<string, string[]>>({});
  // The Reward field — silver granted (or taken) outside commerce.
  const [rewardSp, setRewardSp] = useState('');
  // Drag state: a box being reordered, or an item in flight. An item in
  // flight also tracks where it would land — beside a row, or inside it.
  const [dragBox, setDragBox] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  // An Ability card in flight, and the card it would land beside.
  const [dragCard, setDragCard] = useState<string | null>(null);
  const [cardDropAt, setCardDropAt] = useState<{ key: string; side: 'before' | 'after' } | null>(null);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ id: string; zone: DropZone } | null>(null);
  const [portraitOpen, setPortraitOpen] = useState(false);

  /** The page's effective box order: the saved order first, then any boxes
   * it doesn't know about (new boxes join at their default place). */
  const orderOf = (pageKey: string): string[] => {
    const def = PAGE_BOXES[pageKey];
    const saved = (boxOrder?.[pageKey] ?? []).filter((id) => def.includes(id));
    return [...saved, ...def.filter((id) => !saved.includes(id))];
  };
  const boxStyle = (pageKey: string, id: string) => `order:${orderOf(pageKey).indexOf(id)};`;
  const dropBox = (pageKey: string, targetId: string) => {
    if (!dragBox || dragBox === targetId) return;
    const ids = orderOf(pageKey);
    const from = ids.indexOf(dragBox);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragBox);
    setBoxOrder(pageKey, ids);
    setDragBox(null);
  };
  const grip = (pageKey: string, id: string) => (
    <span
      class="sheet-box-grip"
      draggable
      title="drag to reorder"
      onDragStart={() => setDragBox(id)}
      onDragEnd={() => setDragBox(null)}
    >
      ⠿
    </span>
  );
  const boxDragOver = (e: DragEvent) => {
    if (dragBox || dragItem) e.preventDefault();
  };
  const endDrag = () => { setDragItem(null); setDragFrom(null); setDropAt(null); };
  /** Drop an in-flight item at a location (a section, a container). */
  const dropItemTo = (location: ItemLocation) => {
    if (!dragItem) return;
    if (location === `in:${dragItem}`) { endDrag(); return; }
    append(mk('item-moved', { instanceId: dragItem, location }));
    endDrag();
  };

  const onPortrait = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    resizePortrait(file)
      .then((dataUrl) => setIdentity('portrait', dataUrl))
      .catch(() => {})
      .finally(() => { input.value = ''; });
  };
  const [langPick, setLangPick] = useState('');
  const ownedFeatIds = state.feats.map((f) => f.featId);
  const ownedAbilities = state.abilities.map((a) => a.ref);
  const commerce = commerceRankOf(state);

  const cls = state.classId ? classById(state.classId) : undefined;
  const sub = cls?.subclasses.find((s) => s.id === state.subclassId);
  // The banner counts Milestones within the Level: total 4 reads Level 2 ·
  // Milestone 1, never Milestone 4.
  const withinMilestone =
    state.milestones === 0 ? 0 : state.milestones - 3 * (Math.ceil(state.milestones / 3) - 1);

  const weaponFor = (i: OwnedItem) =>
    [...MELEE_WEAPONS, ...RANGED_WEAPONS].find((w) => w.id === i.itemId);
  const armourFor = (i: OwnedItem) => ARMOURS.find((a) => a.id === i.itemId);
  const shieldFor = (i: OwnedItem) => SHIELDS.find((s) => s.id === i.itemId);

  const isContainer = (i: OwnedItem) => !!i.itemId && containerCoefficient(i.itemId) !== undefined;

  // Quick Draw advances every Container's Access by one rung, the same rung
  // it gives the draw itself.
  const accessBonus = state.feats.some((f) => f.featId === 'quick-draw') ? 1 : 0;

  // A Stored item shows once, nested under the Container that holds it — so
  // the type tables list only what is on the body. A packed sword lives
  // under the pack, not in the Weapons block. Page 2's weapon lines want
  // every weapon owned, wherever it rests, so they read the whole list.
  const allWeapons = state.inventory.filter((i) => weaponFor(i));
  const weapons = allWeapons.filter((i) => !isStored(i));
  const wearables = state.inventory.filter((i) => (armourFor(i) || shieldFor(i)) && !isStored(i));
  const equipment = state.inventory.filter(
    (i) => !weaponFor(i) && !armourFor(i) && !shieldFor(i) && !isStored(i),
  );

  const containers = state.inventory.filter((i) => isContainer(i));

  const subtotalLb = (instanceId: string) =>
    contentsOf(state.inventory, instanceId).reduce(
      (t, i) => t + qualityWeightLb(i.itemId ? (itemWeightLb(i.itemId) ?? 0) : 0, i.qualities) * i.qty,
      0,
    );

  const equipmentCarried = equipment.filter(
    (i) => i.location !== 'home' && i.location !== 'nearby',
  );
  const equipmentNearby = equipment.filter((i) => i.location === 'nearby');
  const equipmentHome = equipment.filter((i) => i.location === 'home');

  /** Walk the container chain to the ground an item finally rests on —
   * a pouch in a chest at home is at home. */
  const rootLocation = (item: OwnedItem): 'worn' | 'equipped' | 'nearby' | 'home' => {
    let loc: string = item.location;
    const seen = new Set<string>();
    while (loc.startsWith('in:')) {
      const id = loc.slice(3);
      if (seen.has(id)) return 'equipped';
      seen.add(id);
      const holder = state.inventory.find((i) => i.instanceId === id);
      if (!holder) return 'equipped';
      loc = holder.location;
    }
    return loc as 'worn' | 'equipped' | 'nearby' | 'home';
  };

  // The in-flight item's own contents refuse its drop — nothing goes inside
  // itself, at any depth.
  const forbidden = dragItem ? descendantsOf(state.inventory, dragItem) : new Set<string>();

  /** The zone under the pointer, or null where the row takes no drop.
   * Ordering runs within one block — a row dragged into another block would
   * take its new place out of sight — but a Container accepts packing from
   * anywhere on the page. A Container's middle band packs; the bands above
   * and below it set the order. */
  const zoneAt = (e: DragEvent, item: OwnedItem, block: string): DropZone | null => {
    if (!dragItem || dragItem === item.instanceId || forbidden.has(item.instanceId)) return null;
    const container = isContainer(item);
    if (dragFrom !== block) return container ? 'into' : null;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = rect.height ? (e.clientY - rect.top) / rect.height : 0.5;
    if (!container) return y < 0.5 ? 'before' : 'after';
    return y < 0.3 ? 'before' : y > 0.7 ? 'after' : 'into';
  };

  /** Set the in-flight item down beside a neighbour. */
  const dropBeside = (anchor: OwnedItem, side: 'before' | 'after') => {
    if (!dragItem) return;
    const item = state.inventory.find((i) => i.instanceId === dragItem);
    if (!item || item.instanceId === anchor.instanceId) { endDrag(); return; }
    append(mk('item-moved', {
      instanceId: item.instanceId,
      location: locationBeside(item, anchor),
      position: { anchor: anchor.instanceId, side },
    }));
    endDrag();
  };

  /** The drag handlers every gear row carries: it is a drop target for
   * whatever is in flight, and its name cell is the grip. A row that takes
   * no drop swallows it rather than letting the block beneath act on it. */
  const rowProps = (item: OwnedItem, block: string) => ({
    class: dropAt?.id === item.instanceId ? `sheet-row is-drop-${dropAt.zone}` : 'sheet-row',
    onDragOver: (e: DragEvent) => {
      const zone = zoneAt(e, item, block);
      if (!zone) return;
      e.preventDefault();
      e.stopPropagation();
      setDropAt((prev) =>
        prev && prev.id === item.instanceId && prev.zone === zone
          ? prev
          : { id: item.instanceId, zone },
      );
    },
    // Crossing between the row's own cells is not leaving the row.
    onDragLeave: (e: DragEvent) => {
      const row = e.currentTarget as HTMLElement;
      const to = e.relatedTarget as Node | null;
      if (to && row.contains(to)) return;
      setDropAt((prev) => (prev?.id === item.instanceId ? null : prev));
    },
    onDrop: (e: DragEvent) => {
      if (!dragItem) return;
      e.preventDefault();
      e.stopPropagation();
      const zone = zoneAt(e, item, block);
      if (!zone) { endDrag(); return; }
      if (zone === 'into') dropItemTo(`in:${item.instanceId}`);
      else dropBeside(item, zone);
    },
  });

  /** The name cell: the row's drag grip, indented by how deep it is packed.
   * The grip records which block the item leaves, so ordering stays inside
   * the block the player can see. */
  /** The one-time origin backfill (records from before origin joined the
   * spine). Shown wherever the origin would print, so an unset origin never
   * masquerades as a set one — the Identity text rides in the hint only. */
  const originPicker = () => (
    <select
      class="sheet-originpick"
      value=""
      onChange={(e) => {
        const place = (e.target as HTMLSelectElement).value;
        if (place) append(mk('origin-chosen', { place }));
      }}
    >
      <option value="">{identity.origin ? `${identity.origin}?` : 'Set the Place of Origin…'}</option>
      {PLACES.map((p) => (
        <option value={p.value}>{p.value}</option>
      ))}
    </select>
  );

  const nameCell = (item: OwnedItem, block: string, depth = 0, aside: JSX.Element | null = null) => (
    <td
      draggable
      class={depth > 0 ? 'sheet-nested' : undefined}
      style={depth > 0 ? `--depth:${depth}` : undefined}
      onDragStart={() => { setDragItem(item.instanceId); setDragFrom(block); }}
      onDragEnd={endDrag}
    >
      {item.customName ? (
        <>
          {item.customName} <span class="sheet-canon">({item.name})</span>
        </>
      ) : (
        item.name
      )}
      {item.qty > 1 ? ` ×${item.qty}` : ''}
      {item.itemId && item.qty === 1 && isMasterworkWeapon(item.itemId) && (
        <button
          type="button"
          class="undo sheet-namebtn"
          title={item.customName ? 'rename this weapon' : 'name this weapon'}
          onClick={() => {
            const name = window.prompt('Name this weapon', item.customName ?? '');
            if (name !== null) append(mk('item-renamed', { instanceId: item.instanceId, name }));
          }}
        >
          ✎
        </button>
      )}
      {aside}
    </td>
  );

  /** The location dropdown + the logged move behind it. The list offers only
   * what is legal for the item (mechanics/encumbrance.md): Worn wants the
   * wearable tag, and neither armour nor a Container is ever Equipped — there
   * is no drawing a cuirass, and a backpack is opened rather than drawn. A
   * shield rides on the arm, so it takes Equipped and not Worn. */
  const moveControl = (item: OwnedItem) => (
    <select
      class="sheet-move"
      value={item.location}
      onChange={(e) => {
        const location = (e.target as HTMLSelectElement).value as ItemLocation;
        if (location !== item.location) append(mk('item-moved', { instanceId: item.instanceId, location }));
      }}
    >
      {item.itemId && isWearable(item.itemId) && <option value="worn">Worn</option>}
      {!armourFor(item) && !isContainer(item) && <option value="equipped">Equipped</option>}
      <option value="nearby">Nearby</option>
      <option value="home">At Home</option>
      {containers.filter((c) => c.instanceId !== item.instanceId).length > 0 && (
        <optgroup label="Stored">
          {containers
            .filter((c) => c.instanceId !== item.instanceId)
            .map((c) => (
              <option key={c.instanceId} value={`in:${c.instanceId}`}>In {c.name}</option>
            ))}
        </optgroup>
      )}
    </select>
  );

  /** The sell control: best reachable buyer, source named — or nothing.
   * Selling is Downtime commerce, and nothing sells before the first
   * Session (the engine holds the same line). A buyer paying zero is no
   * buyer at all. */
  const sellControl = (item: OwnedItem) => {
    if (!commerceOpen || !atMarket) return null;
    if (!item.itemId) return null;
    if (state.sessions < 1) return null;
    const best = bestSell(item.itemId, ownedFeatIds, commerce, ownedAbilities, state.origin ?? null);
    if (!best || best.priceCp < 1) return null;
    const inBasket = basket
      .filter((l): l is Extract<BasketLine, { direction: 'sell' }> => l.direction === 'sell')
      .filter((l) => l.instanceId === item.instanceId)
      .reduce((t, l) => t + l.qty, 0);
    const soldOut = inBasket >= item.qty;
    return (
      <button
        type="button"
        class="cf-shop-hint"
        disabled={soldOut}
        title={`${best.market.name} — ${best.market.location} — ${best.market.marketType}`}
        onClick={() => {
          const key = `s/${best.market.id}/${item.instanceId}`;
          const rest = basket.filter(
            (l) => !(l.direction === 'sell' && `s/${l.marketId}/${l.instanceId}` === key),
          );
          setBasket([
            ...rest,
            { direction: 'sell', marketId: best.market.id, instanceId: item.instanceId, qty: inBasket + 1 },
          ]);
        }}
      >
        Sell {fmtCoins(best.priceCp)} — {best.market.name}
      </button>
    );
  };

  /** Split a stack: carve some off into a new stack in the same place —
   * it then moves (or sells) with its own controls. */
  const splitControl = (item: OwnedItem) => {
    if (item.qty < 2) return null;
    return (
      <button
        type="button"
        class="undo"
        title="split this stack"
        onClick={() => {
          const n = Number(prompt(`Split how many of the ${item.qty} × ${item.name} into their own stack?`));
          if (!Number.isInteger(n) || n < 1 || n >= item.qty) return;
          append(mk('item-split', { instanceId: item.instanceId, qty: n, location: item.location }));
        }}
      >
        split
      </button>
    );
  };

  /** The weight cell: the 0-Enc tag where the weight is not counting, then
   * the figure. The tag tracks the state rather than the item — pack a suit
   * of armour and the tag goes, because a spare suit counts in full. */
  const rowWeight = (item: OwnedItem) => {
    const weight = item.itemId
      ? fmtWeight(qualityWeightLb(itemWeightLb(item.itemId) ?? 0, item.qualities) * item.qty || null)
      : '—';
    const free = item.location === 'worn' && item.itemId && carriesNoLoad(item.itemId);
    return (
      <>
        {free && (
          <span class="sheet-enc0" title="Worn — does not count toward your Load">0-Enc</span>
        )}
        {weight}
      </>
    );
  };

  /** A Container's box: its three dials, and whatever is unusual about it
   * stated at the point of use rather than learned from a table elsewhere.
   *
   * Two weights, because they answer different questions — the raw weight
   * against Capacity (a good bag carries easier, not more), and what the
   * contents actually cost in Load after the Coefficient. */
  const containerBox = (i: OwnedItem) => {
    if (!i.itemId) return null;
    const coeff = containerCoefficient(i.itemId);
    if (coeff === undefined) return null;
    const cap = containerCapacityLb(i.itemId);
    // The rung it actually answers to: a bandolier packed in a backpack has
    // given up its speed, and Quick Draw gives a rung back.
    const access = accessFor(state.inventory, i, accessBonus) ?? 'standard';
    const raw = subtotalLb(i.instanceId);
    const note = containerNote(i.itemId);
    // The qualifier belongs to the Container's own rung. Packed inside
    // something slower, the rung it actually answers to is not the one the
    // qualifier describes, so it drops away.
    const accessNote =
      access === containerAccess(i.itemId) ? containerAccessNote(i.itemId) : undefined;
    return (
      <div class="sheet-cbox is-inline">
        <p class="sheet-cbox-dials">
          <span class={cap !== undefined && raw > cap ? 'is-over' : undefined}>
            <strong>Holds</strong> {raw ? fmtWeight(raw) : '0 lb'}
            {cap !== undefined ? ` of ${cap} lb` : ''}
          </span>
          <span>
            <strong>Load</strong> {raw ? fmtWeight(Math.round(raw * coeff * 10) / 10) : '0 lb'}
            {coeff < 1 ? ` (×${coeff})` : ''}
          </span>
          <span>
            <strong>Access</strong> {ACCESS_LABEL[access]}
            {accessNote ? ` — ${accessNote}` : ''}
          </span>
        </p>
        {note && <p class="sheet-cbox-note">{note}</p>}
      </div>
    );
  };

  /** A Masterwork item's box: the Qualities worked into it — and, standing
   * at its home market with a slot free, the whole menu printed with tick
   * boxes and a Commission button (Les, Aug 16 2026). */
  const masterworkBox = (i: OwnedItem) => {
    if (!i.itemId || !isMasterworkItem(i.itemId)) return null;
    const owned = i.qualities ?? [];
    const ownedQs = owned.map((q) => qualityById(q)).filter(Boolean) as Quality[];
    const menu = qualitiesFor(i.itemId);
    const home = menu.length ? marketById(menu[0].marketId) : undefined;
    const homeOpen =
      home !== undefined &&
      atMarket &&
      marketOpen(home, ownedFeatIds, state.origin ?? null);
    const canCommission = homeOpen && i.qty === 1 && owned.length < MAX_QUALITIES;
    if (owned.length === 0 && !canCommission) return null;
    const ticks = mwTicks[i.instanceId] ?? [];
    const cost = ticks.reduce((t, id) => t + (qualityById(id)?.priceCp ?? 0), 0);
    return (
      <div class="sheet-cbox">
        {!canCommission &&
          ownedQs.map((q) => (
            <p class="sheet-cbox-note" key={q.id}>
              <strong>{q.name}</strong> — {q.effect}
            </p>
          ))}
        {canCommission && (
          <>
            <QualityMenu
              itemId={i.itemId}
              owned={owned}
              picked={ticks}
              title={`Commission at ${home.name} — ${home.location}`}
              onToggle={(q, on) =>
                setMwTicks((m) => ({
                  ...m,
                  [i.instanceId]: on
                    ? [...(m[i.instanceId] ?? []), q.id]
                    : (m[i.instanceId] ?? []).filter((id) => id !== q.id),
                }))
              }
            />
            {ticks.length > 0 && (
              <button
                type="button"
                class="buy"
                disabled={cost > state.wealthCp}
                title={cost > state.wealthCp ? 'not enough coin' : undefined}
                onClick={() => {
                  for (const id of ticks) append(mk('quality-added', { instanceId: i.instanceId, qualityId: id }));
                  setMwTicks((m) => ({ ...m, [i.instanceId]: [] }));
                }}
              >
                Commission ({fmtCoins(cost)})
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  /** The box an item states beside its name: a Container's dials, or a
   * plain item's rules note. Short enough to ride on the name row, which
   * is where it saves a line the sheet would rather spend on gear. The
   * Masterwork box carries a menu and a button, so it stays beneath. */
  const itemAside = (i: OwnedItem) => {
    const box = containerBox(i);
    if (box) return box;
    const note = i.itemId ? itemNote(i.itemId) : undefined;
    return note ? (
      <div class="sheet-cbox is-inline"><p class="sheet-cbox-note">{note}</p></div>
    ) : null;
  };

  /** The rows that trail an item's main row in any table: its Masterwork
   * box (Qualities + the commission control). The Weapons and Armour
   * tables use these too — a Temper Quenched blade is commissioned where
   * it is listed. */
  const trailingRows = (i: OwnedItem, colSpan: number) => {
    const mwBox = masterworkBox(i);
    return mwBox
      ? [
          <tr key={`${i.instanceId}-mw`} class="sheet-boxrow">
            <td colSpan={colSpan}>{mwBox}</td>
          </tr>,
        ]
      : [];
  };

  /** A block's rows: each item, then whatever it holds, indented. Contents
   * of every kind draw here — the Container's block is where a Stored item
   * lives. A Container states its dials beside its own name. */
  const gearBlock = (roots: OwnedItem[], block: string) =>
    gearRows(state.inventory, roots).flatMap(({ item, depth }) => {
      const mwBox = masterworkBox(item);
      return [
        <tr key={item.instanceId} {...rowProps(item, block)}>
          {nameCell(item, block, depth, itemAside(item))}
          <td class="num">{rowWeight(item)}</td>
          <td>{moveControl(item)}</td>
          <td class="act">{splitControl(item)}{sellControl(item)}</td>
        </tr>,
        ...(mwBox
          ? [
              <tr key={`${item.instanceId}-mw`} class="sheet-boxrow">
                <td colSpan={4} class={depth > 0 ? 'sheet-nested' : undefined} style={depth > 0 ? `--depth:${depth}` : undefined}>
                  {mwBox}
                </td>
              </tr>,
            ]
          : []),
      ];
    });

  const totals = basketTotalsCp(basket, commerce, state);
  const tripLines = basket.filter((l) => l.qty > 0);
  const tripEvent = mk('transaction', { lines: tripLines, note: 'a market trip' });
  const tripBlocked = tripLines.length === 0 ? 'The Basket is empty' : why(tripEvent);

  const doTrip = () => {
    if (tripBlocked) return;
    append(mk('transaction', { lines: tripLines, note: 'a market trip' }));
    setBasket([]);
  };

  return (
    <div class="sheet">
      {/* The portrait rides beside the name and banner: always present,
          never in the way. Click it for the full picture. */}
      <div class="sheet-top">
        {identity.portrait && (
          <button
            type="button"
            class="sheet-topportrait"
            title="see the portrait"
            onClick={() => setPortraitOpen(true)}
          >
            <img src={identity.portrait} alt={`${identity.name || 'Character'} portrait`} />
          </button>
        )}
        <div class="sheet-topmain">
      <header class="sheet-head">
        <h1>{identity.name || 'Unnamed'}</h1>
        <div class="cf-viewtoggle sheet-pages" role="group">
          {PAGES.map((p) => (
            <button
              key={p.n}
              type="button"
              class={page === p.n ? 'on' : ''}
              disabled={!p.built}
              title={p.built ? undefined : 'This page is still being built'}
              onClick={() => setPage(p.n)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <section class="cf-step">
        <div class="sheet-strip">
          <span><strong>{cls?.name ?? '—'}</strong>{sub ? ` · ${sub.name}` : ''}</span>
          <span>Level {sheet.level} · Milestone {withinMilestone}</span>
          <span>
            <a href={`${import.meta.env.BASE_URL}campaigns/`}>Campaign</a>{' '}
            <span class="cf-shop-src">none yet</span>
          </span>
          <button
            type="button"
            class={`sheet-managebtn${manage ? ' on' : ''}`}
            onClick={() => setManage(!manage)}
          >
            Manage Character · {state.bank.major} Major / {state.bank.minor} Minor
          </button>
          <label class="sheet-statelabel">
            Character State
            <select
              class="sheet-move"
              value={status}
              disabled={state.sessions === 0}
              title={state.sessions === 0 ? 'A character is New until their first Session is logged.' : undefined}
              onChange={(e) => setStatus((e.target as HTMLSelectElement).value as PlayState)}
            >
              {state.sessions === 0 ? (
                <option value="new">New</option>
              ) : (
                <>
                  <option value="in-play">In Play</option>
                  <option value="downtime">Downtime</option>
                </>
              )}
            </select>
          </label>
        </div>
        {manage && (
          <div class="sheet-manage-panel">
            <span class="sheet-record">Sessions {state.sessions} · Milestones {state.milestones}</span>
            <button type="button" class="buy" onClick={() => append(mk('session-logged', {}))}>Log a Session</button>
            {/* Milestones are the DM's to grant. The sandbox grants freely —
                it is the play-around space; a roster character records the
                DM's word, sourced 'gm'. */}
            {sandbox ? (
              <button type="button" class="buy" onClick={() => append(mk('milestone-granted', {}))}>Grant a Milestone</button>
            ) : (
              <button
                type="button"
                class="buy"
                title="Milestones are the DM's to grant."
                onClick={() => {
                  if (confirm('Record a Milestone granted by the DM?')) append(mk('milestone-granted', {}, 'gm'));
                }}
              >
                Grant a Milestone
              </button>
            )}
            {/* Rewards: coin arriving outside the Markets. The full version
                is the DM's reward table; this is the light one — an amount
                in silver, negative for a fine. Same sourcing rule as the
                Milestone: free in the sandbox, the DM's word on a roster. */}
            <label class="sheet-statelabel">
              Reward (sp)
              <input
                class="sheet-move"
                type="number"
                step="1"
                style="width: 7ch"
                value={rewardSp}
                placeholder="0"
                disabled={!state.gear}
                title={!state.gear ? 'No purse until the Starting Gear is rolled.' : undefined}
                onInput={(ev) => setRewardSp((ev.target as HTMLInputElement).value)}
              />
            </label>
            <button
              type="button"
              class="buy"
              disabled={!state.gear || !Number.isInteger(Number(rewardSp)) || Number(rewardSp) === 0}
              onClick={() => {
                const amountSp = Number(rewardSp);
                if (!Number.isInteger(amountSp) || amountSp === 0) return;
                const words = `${amountSp > 0 ? 'Grant' : 'Take'} ${fmtCoins(Math.abs(amountSp) * 10)}?`;
                if (sandbox) append(mk('coin-granted', { amountSp }));
                else if (confirm(words)) append(mk('coin-granted', { amountSp }, 'gm'));
                setRewardSp('');
              }}
            >
              {Number(rewardSp) < 0 ? 'Take Coin' : 'Grant Coin'}
            </button>
            <button
              type="button"
              class="cf-roll"
              disabled={state.bank.major + state.bank.minor === 0}
              title={
                state.bank.major + state.bank.minor === 0
                  ? 'Nothing banked to spend'
                  : undefined
              }
              onClick={onAdvance}
            >
              Spend Advances
            </button>
            {onSandboxCopy && (
              <button
                type="button"
                class="undo"
                title="Open a scratch copy in the sandbox. Nothing there touches this character."
                onClick={onSandboxCopy}
              >
                Copy to the Sandbox
              </button>
            )}
          </div>
        )}
      </section>
        </div>
      </div>

      {portraitOpen && identity.portrait && (
        <div class="sheet-lightbox" onClick={() => setPortraitOpen(false)}>
          <img src={identity.portrait} alt={`${identity.name || 'Character'} portrait`} />
        </div>
      )}

      {page === 1 && (() => {
        const quirk = state.quirk?.id ? QUIRKS.find((q) => q.id === state.quirk!.id) : undefined;
        const ac = sheet.attributes.find((a) => a.attr === 'Constitution')!.armouredDefence.total;
        const unarmouredCommon = commonParts(sheet.attributes.map((a) => a.unarmouredDefence));
        // Worn armour lands on all six rows alike, so the common-parts pass
        // would hoist it into the footnote. Keep it in the rows instead: the
        // armour is the whole point of the Armoured column, and each row
        // should read as its own sum.
        const wornArmour = state.inventory
          .filter((i) => i.location === 'worn')
          .map(armourFor)
          .find(Boolean);
        const armouredCommon = commonParts(sheet.attributes.map((a) => a.armouredDefence))
          .filter((p) => p.label !== wornArmour?.name);
        // A shield gives its AC and DR only while raised, so the tiles print
        // the standing numbers and name the raised ones beneath.
        const borneShield = state.inventory
          .filter((i) => i.location === 'equipped')
          .map(shieldFor)
          .find(Boolean);
        // The rows print "Quirks +1"; these lines say which Quirk, and what
        // it did. One line per source, its effects on this table joined.
        const attrSources = new Set(
          sheet.attributes.flatMap((a) =>
            [...a.save.parts, ...a.unarmouredDefence.parts, ...a.armouredDefence.parts]
              .filter((p) => p.group)
              .map((p) => p.label),
          ),
        );
        const attrMods = sheet.steadyMods
          .filter((m) => attrSources.has(m.source))
          .reduce<{ group: string; name: string; texts: string[] }[]>((out, m) => {
            const name = m.source.replace(/^(Quirk|Gear) · /, '');
            const held = out.find((x) => x.name === name);
            if (held) held.texts.push(m.text);
            else out.push({ group: m.group, name, texts: [m.text] });
            return out;
          }, []);
        return (
          <div class="sheet-boxcol">
            <section class="cf-step sheet-box" style={boxStyle('p1', 'vitals')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'vitals')}>
              {grip('p1', 'vitals')}
              <h3>Vitals</h3>
              <div class="sheet-vitals">
                <div class="sheet-vital">
                  <span class="sheet-vital-num">{ac}</span>
                  <span class="sheet-vital-label">AC</span>
                  {borneShield && (
                    <span class="sheet-vital-alt">{ac + borneShield.ac} with shield</span>
                  )}
                </div>
                <div class="sheet-vital"><span class="sheet-vital-num">{sheet.hitPoints.total}</span><span class="sheet-vital-label">HP</span></div>
                <div class="sheet-vital">
                  <input
                    class="sheet-vital-entry"
                    value={tempHp}
                    onInput={(e) => setTempHp((e.target as HTMLInputElement).value)}
                  />
                  <span class="sheet-vital-label">Temp HP</span>
                </div>
                <div class="sheet-vital"><span class="sheet-vital-num">{sheet.speed.total}'</span><span class="sheet-vital-label">Speed</span></div>
                <div class="sheet-vital"><span class="sheet-vital-num">{signed(sheet.initiative.total)}</span><span class="sheet-vital-label">Initiative</span></div>
                <div class="sheet-vital">
                  <span class="sheet-vital-num">{sheet.damageReduction.total}</span>
                  <span class="sheet-vital-label">DR</span>
                  {borneShield && borneShield.dr + (borneShield.drBonus ?? 0) > 0 && (
                    <span class="sheet-vital-alt">
                      {sheet.damageReduction.total + borneShield.dr + (borneShield.drBonus ?? 0)} with shield
                    </span>
                  )}
                </div>
              </div>
              <div class="sheet-vitline">
                <strong>Conditions</strong>
                <span class="sheet-conditions">
                  {conditions.map((c) => (
                    <button key={c} type="button" class="cf-chip" title="clear" onClick={() => setConditions(conditions.filter((x) => x !== c))}>
                      {c} ×
                    </button>
                  ))}
                  <input
                    placeholder="Add a condition…"
                    value={conditionEntry}
                    onInput={(e) => setConditionEntry((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && conditionEntry.trim()) {
                        setConditions([...conditions, conditionEntry.trim()]);
                        setConditionEntry('');
                      }
                    }}
                  />
                </span>
              </div>
              <div class="sheet-writein">
                <div class="sheet-writein-line" />
                <div class="sheet-writein-line" />
              </div>
              <p class="sheet-vitline">
                <strong>Load</strong>
                <span title={sheet.load.formula}>
                  {sheet.load.totalLb} lb of {sheet.load.base.total} lb · {sheet.load.band}
                  {sheet.load.effect && ` — ${sheet.load.effect}`}
                </span>
              </p>
              <p class="sheet-vitline">
                <strong>Equipped</strong>
                <span class={sheet.equipped.over ? 'is-over' : undefined}>
                  {sheet.equipped.count} of {sheet.equipped.cap.total} · {ACCESS_LABEL[sheet.drawCost]} to draw
                </span>
              </p>
            </section>

            <section class="cf-step sheet-box" style={boxStyle('p1', 'details')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'details')}>
              {grip('p1', 'details')}
              <h3>Details</h3>
              {manage && (
                <div class="sheet-portraitbtns">
                  <span class="sheet-portraitlabel">Portrait</span>
                  <label class="buy sheet-uploadbtn">
                    {identity.portrait ? 'Replace' : 'Add a portrait'}
                    <input type="file" accept="image/*" onChange={onPortrait} />
                  </label>
                  {identity.portrait && (
                    <button type="button" class="undo" onClick={() => setIdentity('portrait', '')}>
                      remove
                    </button>
                  )}
                </div>
              )}
              {manage ? (
                <div class="cf-identity">
                  <label>Name <input value={identity.name} onInput={(e) => setIdentity('name', (e.target as HTMLInputElement).value)} placeholder="Unnamed" /></label>
                  {/* Where you were raised is a creation choice, locked with
                      the rest of the spine — it carries the home tongue. A
                      record from before origin joined the spine backfills it
                      here, once. */}
                  <label>Place of origin
                    {state.origin ? (
                      <span class="sheet-fixed">{state.origin}</span>
                    ) : (
                      originPicker()
                    )}
                  </label>
                  <label>Age
                    <input type="number" min="14" max="99" class="num" value={identity.age} onInput={(e) => setIdentity('age', (e.target as HTMLInputElement).value)} />
                  </label>
                  <label>Height
                    <span class="cf-units">
                      <input type="number" min="4" max="7" class="num" value={identity.heightFt} onInput={(e) => setIdentity('heightFt', (e.target as HTMLInputElement).value)} />
                      <span class="cf-unit">ft</span>
                      <input type="number" min="0" max={identity.heightFt === '7' ? 0 : 11} class="num" value={identity.heightIn} onInput={(e) => setIdentity('heightIn', (e.target as HTMLInputElement).value)} />
                      <span class="cf-unit">in</span>
                    </span>
                  </label>
                  <label>Weight
                    <span class="cf-units">
                      <input type="number" min="65" max="400" step="5" class="num" value={identity.weight} onInput={(e) => setIdentity('weight', (e.target as HTMLInputElement).value)} />
                      <span class="cf-unit">lb</span>
                    </span>
                  </label>
                  <label class="wide">Notes <input value={identity.notes} onInput={(e) => setIdentity('notes', (e.target as HTMLInputElement).value)} /></label>
                </div>
              ) : (
                <div class="sheet-details">
                  <span><strong>Place of origin</strong> {state.origin ?? originPicker()}</span>
                  <span><strong>Age</strong> {identity.age || '—'}</span>
                  <span>
                    <strong>Height</strong>{' '}
                    {identity.heightFt ? `${identity.heightFt}' ${identity.heightIn || 0}"` : '—'}
                  </span>
                  <span><strong>Weight</strong> {identity.weight ? `${identity.weight} lb` : '—'}</span>
                  {identity.notes && <span class="sheet-details-wide"><strong>Notes</strong> {identity.notes}</span>}
                </div>
              )}
            </section>

            <section class="cf-step sheet-box" style={boxStyle('p1', 'attributes')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'attributes')}>
              {grip('p1', 'attributes')}
              <h3>Attributes</h3>
              <div class="scroll">
                <table class="cf-shop-table sheet-table sheet-table--packed">
                  <thead>
                    <tr>
                      <th>Attribute</th><th>Value</th><th>Offence</th>
                      <th>Save</th><th>Unarmoured Defence</th>
                      <th>Armoured Defence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.attributes.map((a) => {
                      // The Attribute is already printed in the Value column
                      // of this very row, so it comes out of the five math
                      // lines beside it — each one states what sits on top of
                      // the Attribute, as the caption says.
                      const own = [{ label: a.attr, value: a.value.total }];
                      return (
                        <tr key={a.attr}>
                          <td>{a.attr}</td>
                          <td><Bd b={a.value} /></td>
                          <td><Bd b={a.offence} omit={own} /></td>
                          <td><Bd b={a.save} omit={own} /></td>
                          <td><Bd b={a.unarmouredDefence} plain omit={[...own, ...unarmouredCommon]} /></td>
                          <td><Bd b={a.armouredDefence} plain omit={[...own, ...armouredCommon]} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {unarmouredCommon.length > 0 && (
                <p class="cf-railline">Unarmoured Defence — {condense(unarmouredCommon).map(partText).join(' · ')}</p>
              )}
              {armouredCommon.length > 0 && (
                <p class="cf-railline">Armoured Defence — {condense(armouredCommon).map(partText).join(' · ')}</p>
              )}
              {attrMods.map((m) => (
                <p class="cf-railline" key={m.name}>
                  {m.group} — {m.name} · {m.texts.join(' · ')}
                </p>
              ))}
            </section>

            <section class="cf-step sheet-box" style={boxStyle('p1', 'skills')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'skills')}>
              {grip('p1', 'skills')}
              <h3>Skills</h3>
              <table class="cf-shop-table sheet-table sheet-table--packed">
                <tbody>
                  {sheet.skills.map((s) => (
                    <tr key={s.skill}>
                      <td>{s.skill}{s.isClassSkill ? ' ·' : ''}{s.untrained ? <span class="cf-shop-src"> untrained</span> : ''}</td>
                      <td><Bd b={s.value} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.skillGeneralists.map((g) => (
                <p key={g.attr} class="cf-railline">Trained in every {g.attr} Skill at {signed(g.total)}</p>
              ))}
            </section>

            <section class="cf-step sheet-box" style={boxStyle('p1', 'profs')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'profs')}>
              {grip('p1', 'profs')}
              <h3>Proficiencies &amp; Languages</h3>
              <p>
                {sheet.proficiencies.map((p, i) => (
                  <span key={p.group}>
                    {i > 0 && ' · '}
                    {p.group} {signed(p.rank)}{!p.advanceable && <span class="cf-shop-src"> (fixed)</span>}
                  </span>
                ))}
              </p>
              <p class="cf-railline">{sheet.languages.join(' · ')}</p>
              {languageAllowance(state) > state.freeLanguagesUsed && (
                <p class="cf-line">
                  <span class="cf-shop-hint" style="cursor:default">
                    {languageAllowance(state) - state.freeLanguagesUsed} free language
                    {languageAllowance(state) - state.freeLanguagesUsed === 1 ? '' : 's'} still untaken
                  </span>{' '}
                  <select class="sheet-move" value={langPick} onChange={(e) => setLangPick((e.target as HTMLSelectElement).value)}>
                    <option value="">Take a language…</option>
                    {LANGUAGES.filter((l) => !sheet.languages.includes(l)).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    class="buy"
                    disabled={!langPick}
                    onClick={() => {
                      append(mk('language-bought', { language: langPick as Language }));
                      setLangPick('');
                    }}
                  >
                    Take
                  </button>
                </p>
              )}
            </section>

            {state.feats.length > 0 && (
              <section class="cf-step sheet-box" style={boxStyle('p1', 'feats')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'feats')}>
                {grip('p1', 'feats')}
                <h3>Feats</h3>
                {state.feats.map((f) => {
                  const feat = featById(f.featId);
                  // The sheet states only what is in force; the full rules
                  // ride on hover, as in the shop.
                  const rung = feat?.ladder && f.rank > 0
                    ? feat.ladder[Math.min(f.rank, feat.ladder.length) - 1]
                    : undefined;
                  const inForce = rung ? rung.now ?? rung.value : feat?.now ?? feat?.full;
                  return (
                    <div key={f.featId} class="sheet-feat" title={feat?.full}>
                      <p class="sheet-feat-name">
                        {feat?.name ?? f.featId}
                        {f.choices && <span class="cf-shop-src"> · {Object.values(f.choices).join(', ')}</span>}
                        {feat?.ladder && <span class="cf-shop-src"> · Rank {f.rank}</span>}
                      </p>
                      {inForce && <p class="sheet-feat-now">{inForce}</p>}
                    </div>
                  );
                })}
              </section>
            )}

            {sheet.situational.length > 0 && (
              <section class="cf-step sheet-box" style={boxStyle('p1', 'situational')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'situational')}>
                {grip('p1', 'situational')}
                <h3>Situational</h3>
                <ul>
                  {sheet.situational.map((s) => (
                    <li key={`${s.source}/${s.text}`}>{s.text} <span class="cf-shop-src">— {s.source}</span></li>
                  ))}
                </ul>
              </section>
            )}

            {state.quirk && (
              <section class="cf-step sheet-box" style={boxStyle('p1', 'quirks')} onDragOver={boxDragOver} onDrop={() => dropBox('p1', 'quirks')}>
                {grip('p1', 'quirks')}
                <h3>Quirks &amp; Marks</h3>
                <div class="cf-quirk">
                  <p class="cf-quirk-eyebrow">Quirk</p>
                  <h4>{fill(state.quirk.name, state.quirk.slots)}</h4>
                  {quirk && <p class="cf-quirk-mech">{fill(quirk.mechanic, state.quirk.slots)}</p>}
                  {quirk && <p class="cf-quirk-eso">{fill(quirk.esoteric, state.quirk.slots)}</p>}
                </div>
              </section>
            )}
          </div>
        );
      })()}

      {page === 2 && (() => {
        const shortTotals: Record<string, number> = Object.fromEntries(
          sheet.attributes.map((a) => [a.attr.slice(0, 3), a.value.total]),
        );
        // Attack lines name the attribute in full ("Dexterity vs AC"), but
        // accept the short form too so a card written "Dex vs AC" still
        // finds its Offence.
        const attrRow = (attr: string) =>
          sheet.attributes.find((a) => a.attr === attr || a.attr.slice(0, 3) === attr);
        const offenceOf = (attr: string) => attrRow(attr)?.offence.total ?? 0;
        const profOf = (group: string) =>
          sheet.proficiencies.find((p) => p.group === group)?.rank;
        const findCard = (category: string, ability: string): Ability | undefined =>
          CATEGORIES.find((c) => c.name === category)?.abilities.find((a) => a.name === ability);

        // The cards that bond a Companion with a Level of its own. The
        // Companions box owns their stat Ladders — a card whose Companion
        // stands empty is here too, waiting to bond a new one.
        const companionCards = state.abilities.flatMap((owned) => {
          const card = findCard(owned.ref.category, owned.ref.ability);
          return card && hasOwnLevel(card.companionType) ? [{ owned, card }] : [];
        });

        // Until the player arranges the box themselves, the sheet sinks
        // Passives to the bottom — they are never read on your turn, so they
        // give up the top to the Abilities that are. The first card dragged
        // into place pins the order, and the record's order stands from then on.
        const isPassive = (o: (typeof state.abilities)[number]) =>
          findCard(o.ref.category, o.ref.ability)?.vars.frequency?.freq === 'passive';
        // A bonded Companion is not an Ability you use — it is a creature,
        // and the Companions box below prints it whole. Left here it would
        // render as a card with nothing on it.
        const abilityCards = state.abilities.filter(
          (o) => !companionCards.some(({ owned }) => owned === o),
        );
        const sortedAbilities = state.abilitiesArranged
          ? abilityCards
          : [...abilityCards].sort((a, b) => Number(isPassive(a)) - Number(isPassive(b)));

        /** The grip that lifts an Ability card — the same handle the sheet's
         * boxes carry, so the card's own buttons and text stay usable. */
        const cardGrip = (key: string) => (
          <span
            class="sheet-card-grip"
            draggable
            title="drag to reorder"
            onDragStart={() => setDragCard(key)}
            onDragEnd={() => { setDragCard(null); setCardDropAt(null); }}
          >
            ⠿
          </span>
        );

        /** Every Ability card is a drop target for whichever card is in
         * flight. The cards flow in a grid, so the pointer's side of the card
         * sets where the dragged one lands. */
        const cardDropProps = (key: string) => ({
          onDragOver: (e: DragEvent) => {
            if (!dragCard || dragCard === key) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const side = e.clientX - rect.left < rect.width / 2 ? 'before' : 'after';
            setCardDropAt((prev) =>
              prev && prev.key === key && prev.side === side ? prev : { key, side },
            );
          },
          onDragLeave: (e: DragEvent) => {
            const el = e.currentTarget as HTMLElement;
            const to = e.relatedTarget as Node | null;
            if (to && el.contains(to)) return;
            setCardDropAt((prev) => (prev?.key === key ? null : prev));
          },
          onDrop: (e: DragEvent) => {
            if (!dragCard) return;
            e.preventDefault();
            e.stopPropagation();
            const side = cardDropAt?.key === key ? cardDropAt.side : 'after';
            if (dragCard !== key) {
              append(mk('ability-moved', { key: dragCard, position: { anchor: key, side } }));
            }
            setDragCard(null);
            setCardDropAt(null);
          },
        });

        // Play-mode text: attribute tokens annotated with this build's math.
        const noteAttrs = (text: string): string =>
          text.replace(/\b(Str|Dex|Con|Int|Wis|Cha)\b(\s*([+×x])\s*(\d+))?/g, (whole, attr: string, _e, op?: string, num?: string) => {
            const a = shortTotals[attr];
            if (a === undefined) return whole;
            if (op && num) {
              const b = Number(num);
              return `${whole} (${op === '+' ? a + b : a * b})`;
            }
            return `${whole} (${a})`;
          });

        // Full math for the Attacks table: [W] becomes the weapon's die and
        // [S] the shield's, attribute tokens become their totals. Bare W is
        // one weapon die, as in the notation grammar (parseDamage).
        const hasWeaponDie = (text: string) => /\[W\]|\bW\b/.test(text);
        const hasShieldDie = (text: string) => /\[S\]/.test(text);
        const dmgFor = (text: string, die: string): string =>
          text
            .replace(/(\d+)\[[WS]\]/g, (_, n: string) => (n === '1' ? die : `${n}×${die}`))
            .replace(/\[W\]|\bW\b|\[S\]/g, die)
            .replace(/\b(Str|Dex|Con|Int|Wis|Cha)\b/g, (m) => String(shortTotals[m] ?? m));

        // A Hook's arithmetic belongs in the numbers, not in a note under
        // them: the weapon's line already says what to roll, so the bonus is
        // added there. What the unlocked Hooks add to one weapon group's line:
        const hookSum = (hooks: UnlockedHook[], group: string) => {
          const live = hooks.filter((h) => h.math && hookMatchesGroup(h.group, group));
          let toHit = 0;
          let damage = 0;
          let reach = 0;
          const hitParts: string[] = [];
          const dmgParts: string[] = [];
          for (const h of live) {
            const m = h.math!;
            if (m.toHit) {
              toHit += m.toHit;
              hitParts.push(`${h.group} Hook +${m.toHit}`);
            }
            if (m.damage) {
              damage += m.damage;
              dmgParts.push(`${h.group} Hook +${m.damage}`);
            }
            if (m.damageAttr) {
              const v = shortTotals[m.damageAttr] ?? 0;
              damage += v;
              dmgParts.push(`${h.group} Hook +${m.damageAttr} (${v})`);
            }
            reach += m.reach ?? 0;
          }
          return { toHit, damage, reach, hitParts, dmgParts, live };
        };

        // An Ability's Range says which arms can carry it. A card measured in
        // Weapon Range Increments needs a weapon that has increments to
        // measure — a Greatsword has none — and a melee card cannot be worked
        // with a bow or a sling. A card that states neither takes any weapon.
        const wriTimes = (range?: string): number | undefined => {
          const m = range?.match(/(\d+)×WRI/i);
          return m ? Number(m[1]) : undefined;
        };
        const rangeFits = (range?: string): ((w: Weapon) => boolean) => {
          if (wriTimes(range)) return (w) => w.range !== null;
          if (range && /^(melee|reach)\b/i.test(range))
            return (w) => !RANGED_WEAPONS.some((r) => r.id === w.id);
          return () => true;
        };

        // Attacks list what you can bring to bear this round: weapons at the
        // ready. Stored weapons stay off the table.
        const tableWeapons = weapons.filter((i) => i.location === 'equipped');
        // A shield can only be bashed with while it is borne on the arm.
        const tableShields = state.inventory.filter(
          (i) => shieldFor(i) && i.location === 'equipped',
        );

        interface AttackRow { key: string; name: string; toHit: number; toHitParts: string[]; vs: string; damage: string; dmgParts: string[] }
        const rows: AttackRow[] = [];

        // The To Hit parts: the Offence breakdown, then the proficiency
        // (or the Untrained −1) — the total's whole arithmetic, printed.
        const toHitPartsFor = (attrFull: string, group?: string): string[] => {
          const bd = attrRow(attrFull)?.offence;
          const parts = bd ? condense(bd.parts).map(partText) : [];
          if (group !== undefined) {
            const p = profOf(group);
            if (p === undefined) parts.push('Untrained −1');
            else if (p) parts.push(`${group} +${p}`);
          }
          return parts;
        };
        // Damage parts: each attribute token in the damage text, valued.
        const dmgPartsFor = (text: string): string[] =>
          (text.match(/\b(Str|Dex|Con|Int|Wis|Cha)\b/g) ?? []).map(
            (t) => `${t} ${signed(shortTotals[t] ?? 0)}`,
          );

        const meleeAttr = (w: (typeof MELEE_WEAPONS)[number]) => {
          const finesse = w.properties.some((p) => p.startsWith('Finesse'));
          const str = shortTotals.Str;
          const dex = shortTotals.Dex;
          return finesse && dex > str ? 'Dexterity' : 'Strength';
        };

        // A basic attack deals the weapon's damage and nothing more — the
        // attribute bonus goes to the attack roll, never the damage roll
        // (mechanics/core-mechanics.md, Damage).
        // A Masterwork weapon's +1 lands in the line the player rolls from,
        // and a damage Quality (Crucible Steel, Laminated Warbow) in the
        // damage beside it. A named weapon leads with its name.
        const mwBonus = (w: { attackBonus?: number }): number => w.attackBonus ?? 0;
        const mwParts = (w: { attackBonus?: number }): string[] =>
          w.attackBonus ? [`Masterwork +${w.attackBonus}`] : [];
        const damageQualityBonus = (i: OwnedItem): { bonus: number; parts: string[] } => {
          const parts: string[] = [];
          if (i.qualities?.includes('crucible-steel')) parts.push('Crucible Steel +1');
          if (i.qualities?.includes('laminated-warbow')) parts.push('Laminated Warbow +1');
          return { bonus: parts.length, parts };
        };
        const gearName = (i: OwnedItem): string => i.customName ?? i.name;

        for (const item of tableWeapons) {
          const w = weaponFor(item)!;
          const ranged = RANGED_WEAPONS.some((r) => r.id === w.id);
          const attrFull = ranged ? 'Dexterity' : meleeAttr(w);
          const p = profOf(w.group);
          const qd = damageQualityBonus(item);
          rows.push({
            key: `basic/${item.instanceId}`,
            name: `Basic Attack — ${gearName(item)}`,
            toHit: offenceOf(attrFull) + (p ?? -1) + mwBonus(w),
            toHitParts: [...toHitPartsFor(attrFull, w.group), ...mwParts(w)],
            vs: 'vs AC',
            damage: qd.bonus ? `${w.damage} + ${qd.bonus}` : w.damage,
            dmgParts: qd.parts,
          });
        }
        // A shield bashes as a weapon: a Standard Action like any Basic
        // Attack, with the Shield Proficiency standing in for a weapon
        // group's — Untrained −1, Trained +0, each Rank +1.
        for (const item of tableShields) {
          const sh = shieldFor(item)!;
          const p = profOf(sh.proficiency);
          const die = qualityDamage(sh.damage, item.qualities);
          const qd = damageQualityBonus(item);
          rows.push({
            key: `basic/${item.instanceId}`,
            name: `Basic Attack — ${item.name}`,
            toHit: offenceOf('Strength') + (p ?? -1),
            toHitParts: toHitPartsFor('Strength', sh.proficiency),
            vs: 'vs AC',
            damage: addToDamage(die, qd.bonus),
            dmgParts: qd.parts,
          });
        }
        rows.push({
          key: 'basic/unarmed',
          name: 'Basic Unarmed',
          toHit: offenceOf('Strength') + (profOf('Unarmed/Natural') ?? -1),
          toHitParts: toHitPartsFor('Strength', 'Unarmed/Natural'),
          vs: 'vs AC',
          damage: '1d3',
          dmgParts: [],
        });

        for (const owned of state.abilities) {
          const card = findCard(owned.ref.category, owned.ref.ability);
          if (!card || card.mode !== 'Attack') continue;
          const atkText = resolveValue(card.vars.attack, owned.ranks.attack) ?? '';
          const [attrFull, vsDef] = atkText.split(' vs ');
          const dmgText = resolveValue(card.vars.damage, owned.ranks.damage) ?? '—';
          const label = owned.name ?? owned.ref.ability;
          if (hasShieldDie(dmgText)) {
            // An Ability that strikes with the shield brings its own attack
            // line: the Shield Proficiency does not touch it, trained or not.
            // All the shield lends is its die.
            for (const item of tableShields) {
              const sh = shieldFor(item)!;
              rows.push({
                key: `${label}/${item.instanceId}`,
                name: `${label} — ${item.name}`,
                toHit: offenceOf(attrFull),
                toHitParts: toHitPartsFor(attrFull),
                vs: vsDef ? `vs ${vsDef}` : '',
                damage: dmgFor(dmgText, qualityDamage(sh.damage, item.qualities)),
                dmgParts: dmgPartsFor(dmgText),
              });
            }
          } else if (hasWeaponDie(dmgText)) {
            const fits = rangeFits(resolveValue(card.vars.range, owned.ranks.range));
            const hooks = unlockedHooks(card.options, ownedFeatIds);
            for (const item of tableWeapons) {
              const w = weaponFor(item)!;
              if (!fits(w)) continue;
              const p = profOf(w.group);
              const hook = hookSum(hooks, w.group);
              const qd = damageQualityBonus(item);
              rows.push({
                key: `${label}/${item.instanceId}`,
                name: `${label} — ${gearName(item)}`,
                toHit: offenceOf(attrFull) + (p ?? -1) + hook.toHit + mwBonus(w),
                toHitParts: [...toHitPartsFor(attrFull, w.group), ...hook.hitParts, ...mwParts(w)],
                vs: vsDef ? `vs ${vsDef}` : '',
                damage: addToDamage(dmgFor(dmgText, w.damage), hook.damage + qd.bonus),
                dmgParts: [...dmgPartsFor(dmgText), ...hook.dmgParts, ...qd.parts],
              });
            }
          } else {
            rows.push({
              key: label,
              name: label,
              toHit: offenceOf(attrFull),
              toHitParts: toHitPartsFor(attrFull),
              vs: vsDef ? `vs ${vsDef}` : '',
              damage: dmgFor(dmgText, ''),
              dmgParts: dmgPartsFor(dmgText),
            });
          }
        }

        const shown = rows.filter((r) => !hiddenAttacks.includes(r.key));
        const toggleHide = (key: string) =>
          setHiddenAttacks((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));

        return (
          <div class="sheet-boxcol">
            <section class="cf-step sheet-box" style={boxStyle('p2', 'attacks')} onDragOver={boxDragOver} onDrop={() => dropBox('p2', 'attacks')}>
              {grip('p2', 'attacks')}
              <h3>Attacks</h3>
              <div class="scroll">
                <table class="cf-shop-table sheet-table">
                  <thead>
                    <tr><th>Attack</th><th>To Hit</th><th></th><th>Damage</th><th></th></tr>
                  </thead>
                  <tbody>
                    {(showHiddenAttacks ? rows : shown).map((r) => (
                      <tr key={r.key} class={hiddenAttacks.includes(r.key) ? 'sheet-hiddenrow' : undefined}>
                        <td>{r.name}</td>
                        <td>
                          <span class="sheet-bd">
                            <span class="sheet-bd-total">{signed(r.toHit)}</span>
                            {r.toHitParts.length > 0 && (
                              <span class="sheet-bd-parts">{r.toHitParts.join(' · ')}</span>
                            )}
                          </span>
                        </td>
                        <td>{r.vs}</td>
                        <td>
                          <span class="sheet-bd">
                            <span class="sheet-bd-total">{r.damage}</span>
                            {r.dmgParts.length > 0 && (
                              <span class="sheet-bd-parts">{r.dmgParts.join(' · ')}</span>
                            )}
                          </span>
                        </td>
                        <td class="act">
                          <button type="button" class="undo" title={hiddenAttacks.includes(r.key) ? 'show this line' : 'hide this line'} onClick={() => toggleHide(r.key)}>
                            {hiddenAttacks.includes(r.key) ? 'show' : 'hide'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hiddenAttacks.length > 0 && (
                <p class="cf-railline">
                  <button type="button" class="undo" onClick={() => setShowHiddenAttacks(!showHiddenAttacks)}>
                    {showHiddenAttacks ? 'Tuck the hidden lines away' : `Show ${hiddenAttacks.length} hidden line${hiddenAttacks.length === 1 ? '' : 's'}`}
                  </button>
                </p>
              )}
            </section>

            <section class="cf-step sheet-box" style={boxStyle('p2', 'abilities')} onDragOver={boxDragOver} onDrop={() => dropBox('p2', 'abilities')}>
              {grip('p2', 'abilities')}
              <h3>Abilities</h3>
              <div class="sheet-cards">
                {sortedAbilities.map((owned) => {
                  const card = findCard(owned.ref.category, owned.ref.ability);
                  if (!card) return null;
                  const cardKey = abilityKey(owned);
                  const val = (k: (typeof VAR_ORDER)[number]) => resolveValue(card.vars[k], owned.ranks[k]);
                  // Frequency and Action are read off the card as badges, not
                  // as prose in the strip: one says whether you still have this,
                  // the other whether it fits in what's left of your turn.
                  const freqSpec = resolveRung(card.vars.frequency, owned.ranks.frequency);
                  const fBadge = freqBadge(freqSpec);
                  const aBadge = actionBadge(resolveRung(card.vars.action, owned.ranks.action));
                  const passive = freqSpec?.freq === 'passive';
                  // The attack line carries this build's math: the attacking
                  // attribute is annotated with its Offence total. Only the
                  // attacker's side — the defense after "vs" is the target's.
                  const atk = val('attack');
                  const atkNoted = (() => {
                    if (!atk) return atk;
                    const [attacker, ...defense] = atk.split(' vs ');
                    const noted = attacker.replace(
                      /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/g,
                      (m) => `${m} (${signed(offenceOf(m))})`,
                    );
                    return [noted, ...defense].join(' vs ');
                  })();
                  // A weapon-attack card resolves per weapon: every weapon the
                  // character owns gets its own attack & damage line, curated
                  // by hiding — the same treatment as the Attacks table.
                  // A copy built around an element deals that element's
                  // damage, so the type rides on the damage line rather than
                  // sitting alone in the header.
                  const chosen = card.builderChoice && owned.choices?.[card.builderChoice.key];
                  const rawDmg = val('damage');
                  const dmgText =
                    rawDmg && chosen && DAMAGE_TYPES.includes(chosen) &&
                    !DAMAGE_TYPES.some((t) => rawDmg.endsWith(t))
                      ? `${rawDmg} ${chosen}`
                      : rawDmg;
                  const [atkAttr, atkVs] = atk && atk !== '—' ? atk.split(' vs ') : [];
                  // Range resolves per weapon the way damage does: a card
                  // measured in Weapon Range Increments prints each weapon's
                  // own bands, and only weapons the Range admits are listed.
                  const rangeText = val('range');
                  const times = wriTimes(rangeText);
                  const fits = rangeFits(rangeText);
                  // The Weapon and Armour Specialization Hooks this build has
                  // actually unlocked. The card's full roster of Hooks is
                  // build-time reference; only the ones a held Specialization
                  // opens are rules in play, so only those reach the sheet.
                  const hooks = unlockedHooks(card.options, ownedFeatIds);
                  const weaponRows =
                    card.mode === 'Attack' && atkAttr && dmgText && hasWeaponDie(dmgText)
                      ? allWeapons.filter((item) => fits(weaponFor(item)!)).map((item) => {
                          const w = weaponFor(item)!;
                          const p = profOf(w.group);
                          const hook = hookSum(hooks, w.group);
                          const qd = damageQualityBonus(item);
                          return {
                            key: `${cardKey}/${item.instanceId}`,
                            name: gearName(item),
                            group: w.group,
                            where: rootLocation(item),
                            toHit: offenceOf(atkAttr) + (p ?? -1) + hook.toHit + mwBonus(w),
                            toHitParts: [
                              ...toHitPartsFor(atkAttr, w.group),
                              ...hook.hitParts,
                              ...mwParts(w),
                            ],
                            damage: addToDamage(dmgFor(dmgText, w.damage), hook.damage + qd.bonus),
                            // The damage line breaks down the way the attack
                            // does: the weapon's die, then everything added to
                            // it — the Hook's bonus named among them.
                            dmgParts: [
                              `${gearName(item)} ${w.damage}`,
                              ...dmgPartsFor(dmgText),
                              ...hook.dmgParts,
                              ...qd.parts,
                            ],
                            hooked: hook.live.length > 0,
                            // A reach Hook lengthens this weapon's line alone,
                            // so it is stated there rather than on the card's
                            // Range, which speaks for every weapon listed.
                            range: times
                              ? scaleIncrements(w.range, times)
                              : hook.reach
                                ? `${rangeText} +${hook.reach}′`
                                : null,
                          };
                        })
                      : [];
                  // The weapon lines carry the resolved bands, so the abstract
                  // multiplier leaves the strip once they can say it in feet.
                  const stripRange = times && weaponRows.length > 0 ? undefined : rangeText;
                  const strip = [
                    stripRange && stripRange !== '—' && `Range: ${stripRange}`,
                    val('targets') && val('targets') !== '—' && `Targets: ${val('targets')}`,
                    atkNoted && atkNoted !== '—' && `Attack: ${atkNoted}`,
                  ].filter(Boolean);
                  // A builder copy built around a Ladder — a Malediction — is
                  // that Ladder's effect, so it resolves on the card at the
                  // Rank this copy holds. The other options (the unchosen
                  // Maledictions, the hook sets) are build-time reference and
                  // stay off the sheet.
                  const ladder = chosenLadder(card, owned.choices);
                  // A Specialization Feat the character actually holds for
                  // this copy's choice — the standing Hook, stated on the card
                  // where it is read rather than only in the Feats box.
                  const specFeat = chosen ? specializationFor(ownedFeatIds, chosen) : undefined;
                  // Every rules-bearing field the card resolves at its current
                  // Ranks, the named ladders included — complete on the sheet.
                  // The weapon lines carry the resolved damage, so the raw
                  // [W] formula stays off the card whenever they can.
                  const body = [
                    ...(weaponRows.length > 0 ? [] : [['Damage', dmgText] as const]),
                    ['Effect', val('effects')],
                    ...(ladder
                      ? [[ladder.name, resolveValue(ladder, owned.ranks[ladder.name])] as const]
                      : []),
                    ['Duration', val('duration')],
                    ...(card.extraVars ?? []).map(
                      (l) => [l.name, resolveValue(l, owned.ranks[l.name])] as const,
                    ),
                    ...(specFeat ? [['Specialization', specFeat.now ?? specFeat.full] as const] : []),
                  ].filter(([, v]) => v && v !== '—') as [string, string][];
                  const keywords = keywordsFor(owned.ref.category);
                  const hiddenHere = weaponRows.filter((r) => hiddenCardWeapons.includes(r.key));
                  const revealed = revealedCards.includes(cardKey);
                  const listedRows = revealed
                    ? weaponRows
                    : weaponRows.filter((r) => !hiddenCardWeapons.includes(r.key));
                  return (
                    <div
                      key={cardKey}
                      class={[
                        'sheet-card',
                        passive ? 'sheet-card--passive' : '',
                        dragCard === cardKey ? 'sheet-card--lifted' : '',
                        cardDropAt?.key === cardKey ? `is-drop-${cardDropAt.side}` : '',
                      ].filter(Boolean).join(' ')}
                      {...cardDropProps(cardKey)}
                    >
                      <p class="cf-quirk-eyebrow">
                        {cardGrip(cardKey)}
                        {owned.ref.category}
                        {card.role && <span class="sheet-card-freq"> · {card.role}</span>}
                      </p>
                      <h4>
                        {owned.name ?? owned.ref.ability}
                        {owned.choices && <span class="cf-shop-src"> · {Object.values(owned.choices).join(', ')}</span>}
                      </h4>
                      {(aBadge || fBadge) && (
                        <p class="sheet-card-badges">
                          {aBadge && (
                            <span class={`sheet-badge sheet-badge--act sheet-badge--${aBadge.glyph ? 'turn' : 'span'}`}>
                              {aBadge.glyph && <span class="sheet-badge-glyph">{aBadge.glyph}</span>}
                              {aBadge.label}
                              {aBadge.note && <span class="sheet-badge-note"> · {aBadge.note}</span>}
                            </span>
                          )}
                          {fBadge && (
                            <span class="sheet-badge sheet-badge--freq">
                              {fBadge.label}
                              {fBadge.infinite && <span class="sheet-badge-glyph"> ∞</span>}
                              {fBadge.boxes !== undefined && (
                                <span class="sheet-badge-boxes">{'☐'.repeat(fBadge.boxes)}</span>
                              )}
                            </span>
                          )}
                          {aBadge?.rider && <span class="sheet-badge-rider">{aBadge.rider}</span>}
                        </p>
                      )}
                      {strip.length > 0 && <p class="sheet-card-strip">{strip.join(' · ')}</p>}
                      {weaponRows.length > 0 && (
                        <div class="sheet-card-weapons">
                          {listedRows.map((r) => (
                            <p
                              key={r.key}
                              class={`sheet-card-weapon${hiddenCardWeapons.includes(r.key) ? ' sheet-hiddenrow' : ''}`}
                            >
                              <span class="sheet-card-weapon-name">
                                {r.name}
                                {r.where !== 'equipped' && (
                                  <span class="cf-shop-src"> · {r.where === 'home' ? 'at home' : r.where}</span>
                                )}
                              </span>
                              <span class="sheet-card-weapon-math">
                                <span title={r.toHitParts.join(' · ')}>
                                  {signed(r.toHit)}{atkVs ? ` vs ${atkVs}` : ''}
                                </span>
                                {' · '}
                                <span title={r.dmgParts.join(' · ')}>{r.damage}</span>
                                {r.range && ` · ${r.range}`}
                                {r.hooked && <span class="sheet-card-hooked" title="a Specialization Hook is in this line">✦</span>}
                              </span>
                              <button
                                type="button"
                                class="undo"
                                title={hiddenCardWeapons.includes(r.key) ? 'show this weapon' : 'hide this weapon'}
                                onClick={() =>
                                  setHiddenCardWeapons((h) =>
                                    h.includes(r.key) ? h.filter((k) => k !== r.key) : [...h, r.key],
                                  )
                                }
                              >
                                {hiddenCardWeapons.includes(r.key) ? 'show' : 'hide'}
                              </button>
                            </p>
                          ))}
                          {hiddenHere.length > 0 && (
                            <button
                              type="button"
                              class="undo"
                              onClick={() =>
                                setRevealedCards((c) =>
                                  revealed ? c.filter((k) => k !== cardKey) : [...c, cardKey],
                                )
                              }
                            >
                              {revealed
                                ? 'Tuck the hidden weapons away'
                                : `Show ${hiddenHere.length} hidden weapon${hiddenHere.length === 1 ? '' : 's'}`}
                            </button>
                          )}
                        </div>
                      )}
                      {body.map(([label, v]) => (
                        <p key={label} class="cf-quirk-mech"><strong>{label}.</strong> {noteAttrs(v)}</p>
                      ))}
                      {/* The Hooks this build has unlocked, marked with the ✦
                          the weapon lines carrying them wear. */}
                      {hooks.map((h) => (
                        <p key={h.group} class="cf-quirk-mech sheet-card-hook">
                          <span class="sheet-card-hooked">✦</span>{' '}
                          <strong>Specialization — {h.group}.</strong> {h.effect}
                        </p>
                      ))}
                      {keywords && (
                        <p class="sheet-card-keywords">{keywords.join(' · ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Companions — the bonded ones, each a little character of its
                own: the stat block at its bought Ranks, its Level and DC, and
                the two events that only happen at the table. Its Ladders are
                spent through the Advancement door, like every other purchase.
                A summoned thing has no box: its numbers are its card's, and
                the card prints them above. */}
            {companionCards.length > 0 && (
              <section class="cf-step sheet-box" style={boxStyle('p2', 'companions')} onDragOver={boxDragOver} onDrop={() => dropBox('p2', 'companions')}>
                {grip('p2', 'companions')}
                <h3>Companions</h3>
                <div class="sheet-cards">
                  {companionCards.map(({ owned, card }) => {
                    const ref = { category: owned.ref.category, ability: owned.ref.ability };
                    const comp = owned.companion;
                    const level = comp ? companionLevel(state, owned) : 0;
                    const bank = comp ? companionBank(state, owned) : { minor: 0, major: 0 };
                    const dials = COMPANION_TYPES[card.companionType!];
                    return (
                      <div key={abilityKey(owned)} class="sheet-card">
                        <p class="cf-quirk-eyebrow">
                          {owned.ref.ability}
                          <span class="sheet-card-freq" title={`${dials.command} ${dials.upkeep}`}>
                            {' '}· {card.companionType}
                          </span>
                        </p>
                        {comp ? (
                          <>
                            <h4>
                              {/* Named on the sheet as well as in the builder:
                                  a Companion bonded at the table is nameless
                                  until someone names it. The event is logged
                                  on commit, not per keystroke. */}
                              <input
                                class="cf-instname"
                                value={comp.name ?? ''}
                                placeholder="Name it"
                                title="name this Companion"
                                onChange={(ev2) =>
                                  append(mk('companion-named', {
                                    ref,
                                    name: (ev2.target as HTMLInputElement).value,
                                    description: comp.description ?? '',
                                  }))}
                              />
                              <span class="cf-shop-src"> · Level {level} · DC {10 + level}</span>
                            </h4>
                            <input
                              class="cf-compdesc"
                              value={comp.description ?? ''}
                              placeholder="Describe it"
                              title="describe this Companion"
                              onChange={(ev2) =>
                                append(mk('companion-named', {
                                  ref,
                                  name: comp.name ?? '',
                                  description: (ev2.target as HTMLInputElement).value,
                                }))}
                            />
                            <table class="cf-shop-table sheet-table">
                              <tbody>
                                {(card.extraVars ?? []).map((l) => (
                                  <tr key={l.name}>
                                    <td>{l.name}</td>
                                    <td>{resolveValue(l, comp.ranks[l.name])}</td>
                                  </tr>
                                ))}
                                {(card.options ?? [])
                                  .filter((o) => o.placement !== 'top' && o.note)
                                  .map((o) => (
                                    <tr key={o.label}>
                                      <td>{o.label}</td>
                                      <td>{o.note}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                            <p class="sheet-record">
                              Its own bank: {bank.minor}m · {bank.major}M
                              <span class="cf-shop-src"> · upkeep {dials.upkeep.toLowerCase()}</span>
                            </p>
                            <button
                              type="button"
                              class="undo"
                              title="Record its death. Your invested Advances return; its own die with it."
                              onClick={() => {
                                if (confirm(`Record the death of ${comp.name ?? owned.ref.ability}?`)) {
                                  append(mk('companion-died', { ref }));
                                }
                              }}
                            >
                              It died
                            </button>
                          </>
                        ) : (
                          <>
                            <h4>No Companion</h4>
                            <p class="cf-how">A new one costs no Major and starts at Level 0.</p>
                            <button type="button" class="buy" onClick={() => append(mk('companion-bonded', { ref }))}>
                              Bond a new one
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        );
      })()}

      {page === 4 && (
        <section class="cf-step">
          <h3>Log</h3>
          <p class="cf-how">Every event on the record, in order — the build back-trackable to legal.</p>
          <table class="cf-shop-table sheet-table">
            <tbody>
              {(() => {
                // The log reads as a history: each Session logged becomes a
                // heading, and what follows is what was done after it.
                let session = 0;
                return events.map((e, i) => {
                  if (e.type === 'session-logged') {
                    session += 1;
                    return (
                      <tr key={e.id} class="sheet-logsession">
                        <td class="num">{i + 1}</td>
                        <td colspan={2}>
                          <strong>Session {session}</strong>
                          {e.note ? ` — ${e.note}` : ''}
                          <span class="cf-shop-src"> · {fmtDate(e.at)}</span>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={e.id}>
                      <td class="num">{i + 1}</td>
                      <td>{describeEvent(e)}</td>
                      <td class="cf-shop-src">
                        {e.source !== 'player' ? `${e.source} · ` : ''}{fmtDate(e.at)}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </section>
      )}

      {page === 3 && (
      <div class="sheet-boxcol">
      {/* The Gear page is where the carrying decisions are actually made, so
          Load and the Equipped Limit lead the page rather than hiding in
          Vitals. Load draws its whole track, all three Bands with what each
          costs, so a player can see the next threshold coming instead of only
          the one they have crossed. Past a limit the figure turns amber; it is
          not a wall. */}
      <section class="cf-step sheet-box sheet-carry">
        <div class="sheet-carry-cols">
          <div class="sheet-carry-col">
            <p class="sheet-carry-label">Load</p>
            <span class={sheet.load.band !== 'None' ? 'is-over' : 'sheet-carry-val'}>
              {sheet.load.totalLb} lb
            </span>
            <span class="sheet-carry-math">{sheet.load.formula}</span>
            <ol class="sheet-track">
              {sheet.load.rungs.map((r) => (
                <li key={r.band} class={r.here ? 'is-here' : undefined}>
                  <span class="sheet-track-band">{r.band}</span>
                  <span class="sheet-track-at">
                    {r.upToLb === null
                      ? `past ${sheet.load.rungs[1].upToLb} lb`
                      : `up to ${r.upToLb} lb`}
                  </span>
                  <span class="sheet-track-eff">{r.effect ?? 'no effect'}</span>
                </li>
              ))}
            </ol>
            {sheet.load.tamed && (
              <span class="sheet-carry-effect">Heavy Loads count as Light.</span>
            )}
          </div>

          <div class="sheet-carry-col">
            <p class="sheet-carry-label">Equipped</p>
            <span class={sheet.equipped.over ? 'is-over' : 'sheet-carry-val'}>
              {sheet.equipped.count} of {sheet.equipped.cap.total}
            </span>
            <span class="sheet-carry-math">{sheet.equipped.formula}</span>
          </div>
        </div>
        <p class="cf-how">Drawing an Equipped item takes a Move action. Retrieving a Stored item takes a Standard action.</p>
        <p class="cf-how">Drag a row onto a Container to pack it, or between rows to set the order.</p>
      </section>
      {weapons.length > 0 && (
        <section
          class="cf-step sheet-box"
          style={boxStyle('p3', 'weapons')}
          onDragOver={boxDragOver}
          onDrop={() => (dragBox ? dropBox('p3', 'weapons') : dropItemTo('equipped'))}
        >
          {grip('p3', 'weapons')}
          <h3>Weapons</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <thead>
                <tr><th>Weapon</th><th>Group</th><th>Damage</th><th>Range</th><th>Properties</th><th>Wt</th><th>Location</th><th></th></tr>
              </thead>
              <tbody>
                {weapons.flatMap((i) => {
                  const w = weaponFor(i)!;
                  return [
                    <tr key={i.instanceId} {...rowProps(i, 'weapons')}>
                      {nameCell(i, 'weapons', 0, itemAside(i))}
                      <td>{w.group}</td>
                      <td>{w.damage} {w.type}{w.hands === '2H' ? ' · 2H' : ''}</td>
                      <td>{qualityRange(w.range, i.qualities) ?? '—'}</td>
                      <td>{w.properties.length ? w.properties.join(', ') : '—'}</td>
                      <td class="num">{rowWeight(i)}</td>
                      <td>{moveControl(i)}</td>
                      <td class="act">{splitControl(i)}{sellControl(i)}</td>
                    </tr>,
                    ...trailingRows(i, 8),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {wearables.length > 0 && (
        <section
          class="cf-step sheet-box"
          style={boxStyle('p3', 'wearables')}
          onDragOver={boxDragOver}
          onDrop={() => (dragBox ? dropBox('p3', 'wearables') : dropItemTo('worn'))}
        >
          {grip('p3', 'wearables')}
          <h3>Armour &amp; Shields</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <thead>
                <tr><th>Piece</th><th>AC</th><th>DR</th><th>Drawbacks</th><th>Wt</th><th>Location</th><th></th></tr>
              </thead>
              <tbody>
                {wearables.flatMap((i) => {
                  const a = armourFor(i);
                  const s = shieldFor(i);
                  const drawbacks = a
                    ? [
                        a.speedPenaltyFt ? `−${a.speedPenaltyFt}' Speed` : null,
                        a.stealthPenalty ? `−${a.stealthPenalty} Stealth` : null,
                        a.strReq !== null ? `Str +${a.strReq}` : null,
                      ].filter(Boolean).join(' · ') || '—'
                    : s!.speedPenaltyFt ? `−${s!.speedPenaltyFt}' Speed` : '—';
                  return [
                    <tr key={i.instanceId} {...rowProps(i, 'wearables')}>
                      {nameCell(i, 'wearables', 0, itemAside(i))}
                      <td>+{(a ? ARMOUR_TIER_AC[a.tier] : s!.ac) + (a?.acBonus ?? 0)}</td>
                      <td>{a ? (a.drNote ? `${a.dr} (${a.drNote})` : a.dr) : (s!.dr + (s!.drBonus ?? 0)) || '—'}</td>
                      <td>{drawbacks}</td>
                      <td class="num">{rowWeight(i)}</td>
                      <td>{moveControl(i)}</td>
                      <td class="act">{splitControl(i)}{sellControl(i)}</td>
                    </tr>,
                    ...trailingRows(i, 7),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sheet.equipped.over && (
        <div class="cf-flags" style="order:-1">
          {sheet.equipped.count} items Equipped — your limit is {sheet.equipped.cap.total}.
        </div>
      )}

      <section
        class="cf-step sheet-box"
        style={boxStyle('p3', 'equipment')}
        onDragOver={boxDragOver}
        onDrop={() => (dragBox ? dropBox('p3', 'equipment') : dropItemTo('equipped'))}
      >
        {grip('p3', 'equipment')}
        <h3>Equipment</h3>
        {equipmentCarried.length === 0 ? (
          <p class="cf-how">Nothing but the clothes on your back.</p>
        ) : (
          <div class="scroll">
          <table class="cf-shop-table sheet-table">
            <tbody>
              {gearBlock(equipmentCarried, 'equipment')}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {equipmentNearby.length > 0 && (
        <section
          class="cf-step sheet-box"
          style={boxStyle('p3', 'nearby')}
          onDragOver={boxDragOver}
          onDrop={() => (dragBox ? dropBox('p3', 'nearby') : dropItemTo('nearby'))}
        >
          {grip('p3', 'nearby')}
          <h3>Nearby</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <tbody>
                {gearBlock(equipmentNearby, 'nearby')}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {equipmentHome.length > 0 && (
        <section
          class="cf-step sheet-box"
          style={boxStyle('p3', 'home')}
          onDragOver={boxDragOver}
          onDrop={() => (dragBox ? dropBox('p3', 'home') : dropItemTo('home'))}
        >
          {grip('p3', 'home')}
          <h3>At Home</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <tbody>
                {gearBlock(equipmentHome, 'home')}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section class="cf-step sheet-box" style={boxStyle('p3', 'wealth')} onDragOver={boxDragOver} onDrop={() => dropBox('p3', 'wealth')}>
        {grip('p3', 'wealth')}
        <h3>Wealth</h3>
        <p class="sheet-vitline"><strong>Coin</strong> <span>{fmtCoins(state.wealthCp)}</span></p>
      </section>

      {!atMarket && (
        <section class="cf-step sheet-box" style={boxStyle('p3', 'markets')} onDragOver={boxDragOver} onDrop={() => dropBox('p3', 'markets')}>
          {grip('p3', 'markets')}
          <h3>Commerce</h3>
          <p class="cf-how">
            {status === 'new'
              ? 'The Markets open after your first Session.'
              : 'The Markets open in Downtime.'}
          </p>
        </section>
      )}

      {atMarket && !commerceOpen && (
        <section class="cf-step sheet-box" style={boxStyle('p3', 'markets')} onDragOver={boxDragOver} onDrop={() => dropBox('p3', 'markets')}>
          {grip('p3', 'markets')}
          <h3>Commerce</h3>
          <div class="cf-line">
            <button type="button" class="cf-roll" onClick={() => setCommerceOpen(true)}>
              Open Commerce
            </button>
          </div>
        </section>
      )}

      {atMarket && commerceOpen && (
      <section class="cf-step sheet-box" style={boxStyle('p3', 'markets')} onDragOver={boxDragOver} onDrop={() => dropBox('p3', 'markets')}>
        {grip('p3', 'markets')}
        <h3>The Markets</h3>
        <p class="cf-how">
          A trip to market: buy and sell in one Basket; the trip commits as one event.
        </p>
        <MarketShop state={state} basket={basket} setBasket={setBasket} />
        <div class="cf-line">
          <button
            type="button"
            class="cf-crystallize"
            disabled={tripBlocked !== null}
            title={tripBlocked ?? undefined}
            onClick={() => { doTrip(); setCommerceOpen(false); }}
          >
            Finish the trip{totals.net !== 0 && ` (${totals.net > 0 ? '+' : '−'}${fmtCoins(Math.abs(totals.net))})`}
          </button>
          <button
            type="button"
            class="cf-roll"
            title="Close the Markets; an emptied Basket leaves nothing behind"
            onClick={() => { setBasket([]); setCommerceOpen(false); }}
          >
            Leave the market
          </button>
        </div>
      </section>
      )}
      </div>
      )}
    </div>
  );
}
