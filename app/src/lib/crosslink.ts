// Wiki-style auto cross-linking.
//
// Two entry points share one entity registry (the saints):
//   • remarkCrossLink — a remark plugin that links the first mention of each
//     saint in any markdown document (Library, Journal, Scriptorium).
//   • linkifySaints  — links saint names inside a plain string (used for the
//     saint-page blurbs, which aren't markdown), excluding the saint's own page.
//
// Places will join the registry once they have pages of their own.

import { SAINTS } from './saints';

const BASE = '/saints-of-avilund/';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface Entity { name: string; url: string; }

const SAINT_ENTITIES: Entity[] = SAINTS
  .filter((s) => !s.noAutoLink)
  .map((s) => ({ name: s.name, url: `${BASE}saints/${s.slug}/` }))
  .sort((a, b) => b.name.length - a.name.length); // longest names first

// Walk a string and return mdast nodes, linking the first unlinked mention of
// each entity, left to right. `linked` tracks names already linked in this doc.
function linkifyToNodes(value: string, entities: Entity[], linked: Set<string>): any[] {
  const out: any[] = [];
  let i = 0;
  while (i < value.length) {
    let best: { index: number; name: string; url: string; text: string } | null = null;
    for (const ent of entities) {
      if (linked.has(ent.name)) continue;
      const re = new RegExp(`\\b${escapeRegExp(ent.name)}\\b`, 'g');
      re.lastIndex = i;
      const m = re.exec(value);
      if (m && (best === null || m.index < best.index)) {
        best = { index: m.index, name: ent.name, url: ent.url, text: m[0] };
      }
    }
    if (best === null) { out.push({ type: 'text', value: value.slice(i) }); break; }
    if (best.index > i) out.push({ type: 'text', value: value.slice(i, best.index) });
    out.push({ type: 'link', url: best.url, children: [{ type: 'text', value: best.text }] });
    linked.add(best.name);
    i = best.index + best.text.length;
  }
  return out;
}

// Recursively link text nodes, but never inside links, headings, or code.
function transform(node: any, linked: Set<string>): void {
  if (!Array.isArray(node.children)) return;
  const skipText = ['heading', 'link', 'inlineCode', 'code'].includes(node.type);
  for (let idx = 0; idx < node.children.length; idx++) {
    const child = node.children[idx];
    if (child.type === 'text' && !skipText) {
      const replacement = linkifyToNodes(child.value, SAINT_ENTITIES, linked);
      if (replacement.length > 1) {
        node.children.splice(idx, 1, ...replacement);
        idx += replacement.length - 1;
      }
    } else if (Array.isArray(child.children) && !['link', 'inlineCode', 'code'].includes(child.type)) {
      transform(child, linked);
    }
  }
}

export function remarkCrossLink() {
  return (tree: any) => {
    transform(tree, new Set<string>());
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Link saint names inside a plain string, returning HTML. Excludes one slug
// (so a saint's own page never links to itself).
export function linkifySaints(text: string, base: string, excludeSlug?: string): string {
  const entities: Entity[] = SAINTS
    .filter((s) => s.slug !== excludeSlug && !s.noAutoLink)
    .map((s) => ({ name: s.name, url: `${base}saints/${s.slug}/` }))
    .sort((a, b) => b.name.length - a.name.length);
  const linked = new Set<string>();
  let out = '';
  let i = 0;
  while (i < text.length) {
    let best: { index: number; name: string; url: string; text: string } | null = null;
    for (const ent of entities) {
      if (linked.has(ent.name)) continue;
      const re = new RegExp(`\\b${escapeRegExp(ent.name)}\\b`, 'g');
      re.lastIndex = i;
      const m = re.exec(text);
      if (m && (best === null || m.index < best.index)) {
        best = { index: m.index, name: ent.name, url: ent.url, text: m[0] };
      }
    }
    if (best === null) { out += escapeHtml(text.slice(i)); break; }
    out += escapeHtml(text.slice(i, best.index));
    out += `<a href="${best.url}">${escapeHtml(best.text)}</a>`;
    linked.add(best.name);
    i = best.index + best.text.length;
  }
  return out;
}
