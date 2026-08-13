// The full build-mode Ability card, rendered inline in the builder so a
// player can plan purchases levels ahead: every variable with every future
// Rank and its cost, the option blocks (Specialization Hooks, Elements,
// Implements) with the notes that state their unlock gates, and the Feats
// line. Mirrors AbilityCard.astro's build mode. When the Ability is owned,
// the Rank each Ladder currently rests at is highlighted.

import type { Ability, AbilityOption, NamedLadder } from '../../lib/abilities';
import { VAR_LABELS, VAR_ORDER, actionBadge, freqBadge, resolveRung } from '../../lib/abilities';
import { keywordsFor } from '../../lib/traditions';

const ADV_GLYPHS = ['①', '②', '③', '④', '⑤'];

interface Props {
  ability: Ability;
  /** The Category hosting the card (reused cards render under their host). */
  host: string;
  /** Owned Ranks by variable/Ladder name; omit when the Ability isn't owned. */
  ranks?: Record<string, number>;
  /** Inlines the character's attribute totals into rule text. */
  annotate?: (s: string) => string;
}

export default function AbilityFullCard({ ability, host, ranks, annotate = (s) => s }: Props) {
  const keywords = keywordsFor(host);
  const sub = [ability.role, ability.mode].filter(Boolean).join(' · ');
  const noun = ability.builderNoun ?? 'Spell';

  const extraVars = ability.extraVars ?? [];
  const mainAdvCount = Math.max(
    3,
    ...VAR_ORDER.map((k) => ability.vars[k]?.advances?.length ?? 0),
    ...extraVars.map((v) => v.advances?.length ?? 0),
  );
  const MAIN_COLS = Array.from({ length: mainAdvCount }, (_, i) => i);

  // The two badges read the Rank this build actually rests at, so a player
  // planning purchases sees the cost change as they climb the Ladder.
  const aBadge = actionBadge(resolveRung(ability.vars.action, ranks?.action));
  const fBadge = freqBadge(resolveRung(ability.vars.frequency, ranks?.frequency));

  const opts = ability.options ?? [];
  const topOpts = opts.filter((o) => o.placement === 'top');
  const bottomOpts = opts.filter((o) => o.placement !== 'top');

  // The cell a Ladder rests at: Base when Rank 0, advance i when Rank i+1.
  const at = (name: string, cell: number): string | undefined =>
    ranks && (ranks[name] ?? 0) === cell ? 'at' : undefined;

  // label is what the row shows; rankKey is how the record engine names the
  // Ladder in owned.ranks ('frequency' for variables, the Ladder name itself
  // for named Ladders).
  const ladderRow = (label: string, rankKey: string, base: string, advances: NamedLadder['advances'], opts2?: { cols?: number[]; showCosts?: boolean; baseCost?: 'm' | 'M'; tracked?: boolean }) => {
    const adv = advances ?? [];
    const cols = opts2?.cols ?? [0, 1, 2];
    const showCosts = opts2?.showCosts ?? true;
    const blank = base === '—' && adv.length === 0;
    return (
      <tr class={blank ? 'locked' : undefined}>
        <th scope="row">{label}</th>
        <td class={blank || opts2?.tracked ? undefined : at(rankKey, 0)}>
          {annotate(base)}
          {showCosts && opts2?.baseCost && (
            <> <span class={`pip pip--${opts2.baseCost}`}>{opts2.baseCost}</span></>
          )}
        </td>
        {cols.map((i) =>
          adv[i] ? (
            <td class={opts2?.tracked ? undefined : at(rankKey, i + 1)}>
              {annotate(adv[i].value)}
              {showCosts && (
                <> <span class={`pip pip--${adv[i].cost}`}>{adv[i].cost}{adv[i].note ? `·${adv[i].note}` : ''}</span></>
              )}
            </td>
          ) : (
            <td class="empty">—</td>
          ),
        )}
      </tr>
    );
  };

  const optBlock = (o: AbilityOption) => (
    <div class="cf-fullcard-opt" key={o.label}>
      <p class="cf-fullcard-optlabel">{o.label}</p>
      {o.note && <p class="cf-fullcard-optnote">{o.note}</p>}
      {o.ladders ? (
        <table class="cf-fullcard-subtable">
          <thead>
            <tr>
              <th></th>
              <th>Base</th>
              {[0, 1, 2].map((i) => <th>{ADV_GLYPHS[i]}</th>)}
            </tr>
          </thead>
          <tbody>
            {o.ladders.map((l) =>
              ladderRow(l.name, l.name, l.base ?? '—', l.advances, {
                showCosts: !o.hideCosts,
                baseCost: o.baseCost,
                // Automatic Ladders (hideCosts) track another Ladder and
                // base-priced hook sets aren't bought here; neither carries
                // a Rank of its own to highlight.
                tracked: !!o.hideCosts || !!o.baseCost,
              }),
            )}
          </tbody>
        </table>
      ) : Array.isArray(o.detail) ? (
        <ul>{o.detail.map((d) => <li key={d}>{annotate(d)}</li>)}</ul>
      ) : (
        o.detail && <p class="cf-fullcard-optdetail">{annotate(o.detail)}</p>
      )}
    </div>
  );

  return (
    <section class="cf-fullcard">
      <header class="cf-fullcard-banner">
        <span class="cf-fullcard-name">{ability.name}</span>
        <span class="cf-fullcard-cat">{host}</span>
      </header>
      {sub && <p class="cf-fullcard-sub">{sub}</p>}
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
      {keywords && (
        <p class="cf-fullcard-keywords"><strong>Keywords:</strong> {keywords.join(' · ')}</p>
      )}
      {ability.builder && (
        <p class="cf-fullcard-builder">
          <strong>{noun} Builder</strong> — this Ability can be taken multiple times, allowing you
          to build many different {noun.toLowerCase()}s with the building blocks below. You can
          rename this and any other new {noun.toLowerCase()} you create.
        </p>
      )}
      {topOpts.map(optBlock)}
      <table class="cf-fullcard-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Base</th>
            {MAIN_COLS.map((i) => <th>{ADV_GLYPHS[i]}</th>)}
          </tr>
        </thead>
        <tbody>
          {VAR_ORDER.map((k) => ladderRow(VAR_LABELS[k], k, ability.vars[k]?.base ?? '—', ability.vars[k]?.advances, { cols: MAIN_COLS }))}
          {extraVars.map((v) => ladderRow(v.name, v.name, v.base ?? '—', v.advances, { cols: MAIN_COLS }))}
        </tbody>
      </table>
      {bottomOpts.map(optBlock)}
      {ability.feats && (
        <p class="cf-fullcard-feats"><strong>Feats:</strong> {annotate(ability.feats)}</p>
      )}
    </section>
  );
}
