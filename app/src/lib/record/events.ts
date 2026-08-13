// The character record's event vocabulary (builder spec §9, Layer B).
//
// The record is a log of events, and the sheet is always a replay. Events
// store DECISIONS — stable ids and choices — never resulting numbers, so a
// rules retune rewrites nobody. Costs are computed at replay time from the
// rules data.
//
// This first slice covers the build economy: the creation spine, Advances,
// and Milestones. Gear, Chronicle, Market, and transfer events join as their
// data pillars land.

import type { Language } from '../languages';
import type { Attribute } from '../quirks';
import type { ArmourProficiency, ImplementGroup } from '../classes';
import type { WeaponGroup } from '../quirks';

/** Who caused an event. GM-sourced events arrive via grants; system-sourced
 * ones come from machinery (rules reconciliation, refunds). */
export type EventSource = 'player' | 'gm' | 'system';

interface BaseEvent {
  /** Unique within the log (any scheme; ULIDs once storage lands). */
  id: string;
  /** ISO timestamp of when the event was appended. */
  at: string;
  source: EventSource;
}

/** An ability is addressed by its Category name + card name — the corpus has
 * no separate id scheme yet, so names are the stable handle (renames are
 * save-breaking until an id column exists; tracked in the spec). */
export interface AbilityRef {
  category: string;
  ability: string;
}

/** Where an owned item sits — the Gear States of mechanics/encumbrance.md.
 * Held is in hand; Worn is on the body; Equipped is at the ready (a Move
 * action to draw); `in:<instanceId>` is Stored inside an owned Container
 * (a Standard action to retrieve, coefficient math applies). Home is off
 * the body and weightless. Old records may carry the retired value
 * 'carried' — replay reads it as 'equipped'. The Party Inventory joins
 * with campaigns. */
export type ItemLocation = 'held' | 'worn' | 'equipped' | 'home' | `in:${string}`;

/** One Basket line. Buys reference a Market's stock; sells reference an
 * owned instance. Prices are computed at replay time from the Market data
 * and the character's Commerce rank — the event stores only decisions. */
export type TransactionLine =
  | {
      direction: 'buy';
      marketId: string;
      itemId: string;
      qty: number;
      /** The item's purchase-time pick (a Craft, a saint), where the item
       * defines one. Renders into the instance name; picks never stack. */
      choice?: string;
    }
  | { direction: 'sell'; marketId: string; instanceId: string; qty: number };

export type RecordEvent =
  // ── The creation spine ────────────────────────────────────────────────
  | (BaseEvent & { type: 'class-chosen'; classId: string })
  | (BaseEvent & { type: 'subclass-chosen'; subclassId: string })
  /** Creation-only: where the character was raised. Must be a lib/places.ts
   * entry; a re-pick replaces the earlier choice. It carries the Home
   * Language with it — the free second tongue every character speaks
   * alongside Imperial — so the tongue is never chosen on its own. */
  | (BaseEvent & { type: 'origin-chosen'; place: string })
  /** Retired: the Home Language was once its own pick, before Place of Origin
   * dictated it. Replayed for records written under the old rule; nothing
   * emits it now. */
  | (BaseEvent & { type: 'home-language-chosen'; language: Language })
  /** Creation-only: the free starting outfit, from the Class-aware table
   * (equipment.ts STARTING_CLOTHES). A re-pick replaces the earlier choice. */
  | (BaseEvent & { type: 'clothes-chosen'; itemId: string })
  /** Creation-only: −1 to an Attribute for +1 Major (at most two). */
  | (BaseEvent & { type: 'flaw-taken'; attr: Attribute })
  /** The finale: the seesawed Quirk + Starting Gear package, one roll. Stores
   * card ids + drawn slot fills — texts and effects re-derive from the corpora.
   * Gear fields are absent only on logs from before the gear tables existed. */
  | (BaseEvent & {
      type: 'quirk-rolled';
      quirkId?: string; quirkName: string; slots: Record<string, string>;
      rerollsUsed: number;
      gearId?: string; gearName?: string; gearSlots?: Record<string, string>;
    })
  /** The point of no return — the spine locks, play begins at Level 0. */
  | (BaseEvent & { type: 'crystallized' })

  // ── Grants ────────────────────────────────────────────────────────────
  /** +1 Major and +1 Minor to the bank. The DM's to grant: a roster sheet
   * records it at the DM's word (source 'gm'); the sandbox grants freely. */
  | (BaseEvent & { type: 'milestone-granted'; note?: string })
  /** A played Session (the meta-Chronicle, spec §5). Self-marked in v1.
   * Gates the first-Session sell lock — a New character sells nothing. */
  | (BaseEvent & { type: 'session-logged'; note?: string })

  // ── Wealth & gear ─────────────────────────────────────────────────────
  /** One committed Basket — a whole shopping trip as one logged event.
   * The Basket is atomic: any flagged line refuses the whole transaction. */
  | (BaseEvent & { type: 'transaction'; lines: TransactionLine[]; note?: string })
  /** An item arriving outside commerce: DM grant, found gear, a gift. With
   * an itemId it is catalogue-backed; free-named otherwise (unique items). */
  | (BaseEvent & { type: 'item-granted'; name?: string; itemId?: string; qty?: number; note?: string })
  /** Move an owned item between locations (sheet organization, durable). */
  | (BaseEvent & { type: 'item-moved'; instanceId: string; location: ItemLocation })
  /** Split a stack: carve `qty` off into a new stack (id = this event's id)
   * at `location`, provenance inherited — spare Supplies in the backpack,
   * the rest in the kit's pouch. */
  | (BaseEvent & { type: 'item-split'; instanceId: string; qty: number; location: ItemLocation })

  // ── Major purchases ──────────────────────────────────────────────────
  /** One step up the triangular curve (+N costs N Major for the Nth step). */
  | (BaseEvent & { type: 'attribute-bought'; attr: Attribute })
  /** One Ability from an accessible Category — 1 Major, except the first
   * from each of the first Class's two Categories, which is free (cost is
   * computed at replay by abilityCost). Builder cards
   * (spell/curse builders) may be bought repeatedly: each purchase carries a
   * unique instanceId, a player name, and the card's one build choice
   * (element, Malediction) — validated against the card. */
  | (BaseEvent & {
      type: 'ability-bought';
      ref: AbilityRef;
      instanceId?: string;
      instanceName?: string;
      choices?: Record<string, string>;
    })
  /** Rename a builder instance — free, non-mechanical. */
  | (BaseEvent & { type: 'ability-renamed'; ref: AbilityRef; instanceId: string; name: string })
  /** A second/third Class + Subclass (3 Major, then 6). */
  | (BaseEvent & { type: 'class-added'; classId: string; subclassId: string })

  // ── Minor purchases ──────────────────────────────────────────────────
  /** +1 Offence rank in an Attribute (triangular steps). */
  | (BaseEvent & { type: 'offence-bought'; attr: Attribute })
  /** +1 Defence rank in an Attribute (triangular steps); lifts Save too. */
  | (BaseEvent & { type: 'defence-bought'; attr: Attribute })
  /** +Class HP. Once per Level window. */
  | (BaseEvent & { type: 'hp-bought' })
  /** Become Trained (+0) in a Skill not on your Class list. Class Skills
   * arrive Trained free. Untrained use is −1 (or barred, where flagged). */
  | (BaseEvent & { type: 'skill-trained'; skill: string })
  /** +1 Skill Rank. Class Skills climb +1 → +2 (Level 3) → +3 (Level 5);
   * bought-Trained Skills never pass +1. 1 Minor per step. */
  | (BaseEvent & { type: 'skill-advanced'; skill: string })
  /** A Weapon/Armour/Implement proficiency (fixed at base, never advances). */
  | (BaseEvent & { type: 'proficiency-bought'; group: WeaponGroup | ArmourProficiency | ImplementGroup })
  /** +1 on a Class/Subclass proficiency (cap +2; second step at Level 5). */
  | (BaseEvent & { type: 'proficiency-advanced'; group: WeaponGroup | ArmourProficiency | ImplementGroup })
  /** A language, 1 Minor. */
  | (BaseEvent & { type: 'language-bought'; language: Language })
  /** A Feat (cost from the roster). Choices carry a parameterized Feat's
   * pick, where one exists. */
  | (BaseEvent & { type: 'feat-bought'; featId: string; choices?: Record<string, string> })
  /** Climb a Feat Ladder one Rank (cost from the Rank; one per Level). */
  | (BaseEvent & { type: 'feat-advanced'; featId: string; toRank: number })

  // ── Ability advancement ──────────────────────────────────────────────
  /** Climb one variable's Ladder one Rank (cost m/M from the card). For a
   * builder card, instanceId names which copy climbs. */
  | (BaseEvent & {
      type: 'ability-advanced';
      ref: AbilityRef;
      instanceId?: string;
      variable: string;
      /** The Rank reached (1 = the first advance beyond base). */
      toRank: number;
    })

  // ── Companions ───────────────────────────────────────────────────────
  /** Name and describe a Companion — free, non-mechanical, editable. The
   * builder keeps at most one per Companion card (replace, not append). */
  | (BaseEvent & { type: 'companion-named'; ref: AbilityRef; name: string; description: string })
  /** Climb one of a Companion's stat Ladders one Rank. The payer is decided
   * at replay time — the Companion's own earned Advances first, the owner's
   * bank after — and recorded in state for the death-refund rule. */
  | (BaseEvent & { type: 'companion-advanced'; ref: AbilityRef; ladder: string; toRank: number });

export type RecordEventType = RecordEvent['type'];
