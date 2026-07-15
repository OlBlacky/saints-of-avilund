---
title: "Design Notes and To Do — 2026"
order: 1
---

A working hub for the people building Avilund — who draws, who writes, and what
comes next. This page is maintained in the repository: to add or change an
entry, edit this file (or ask the maintainer to). Nothing here is settled canon;
it is a planning board, kept in the open for collaborators.

## Illustrators

The regular contributors to the artwork of Avilund. Three hands carry the visual
identity — one for each era of the primary documents:

- **Albrecht Türmann** — the Inquisition era (1347); early woodcut. _Credentials below._
- **Grafton Fitzdecker** — the modern era (c. 1700–1750); pencil, charcoal, sepia. _Entry to come._
- _[the copperplate engraver]_ — the era between the two; copper-plate engraving. _To be named._

### Albrecht Türmann — the Inquisition woodcuts

<figure class="plate">
  <img src="/saints-of-avilund/images/woodcuts/adnihilo-examination.png" alt="A Türmann woodcut: an examination for the signs of possession.">
  <figcaption>A sample plate — from <em>Adnihilo Inter Nos</em>.</figcaption>
</figure>

**Who:** Master woodcutter of Waldheim, contemporary of Inquisitor-Cardinal Hanzig Van Tassel; he cut the blocks for Van Tassel's demon-treatise _Adnihilo Inter Nos_ (1347).

**Style:** early relief woodcut, generations before fine copperplate — deliberately chunky and bold. Broad fields of solid black, dramatic chiaroscuro, rough and a little misregistered. The oldest and most violent of the three hands, leaning a touch toward fantasy to suit the game.

**Signature:** an **AT monogram** — a wide _A_ with a small _T_ nested under its crossbar, an homage to Dürer's _AD_ mark. Midjourney renders letters unreliably, so stamp the monogram onto each finished plate afterward for a consistent mark.

**Midjourney — reusable prompt.** Keep everything from the em-dash onward identical on every image; swap only the `[SUBJECT]`. That fixed style tail is what makes the set look like one carver's hand.

```
[SUBJECT] — early medieval German woodcut, hand-pressed blockbook relief print, bold chunky hand-carved black lines, thick uneven outlines, broad areas of solid black ink, stark high-contrast black and white, dramatic chiaroscuro, deep shadow against bright highlight, crude rough carving, coarse simple hatching, minimal fine detail, visible woodgrain and uneven inking, slightly misregistered hand-pressed impression on foxed cream laid paper, 14th-century Gothic devotional print, a small carved "AT" maker's monogram on a tablet in the lower right corner --style raw --ar 1:1 --s 50 --chaos 0 --no color, grey wash, smooth gradients, soft shading, photorealism --v 7
```

**Subjects** to drop into `[SUBJECT]`: a horned demon rising from a ring of flame as a hooded inquisitor recoils · a possessed woman bound to a chair, priests praying over her · the gaping mouth of the Abyss swallowing the damned · a winged devil whispering to a sleeping bishop · an inquisitor with a lantern descending into a pit of writhing forms.

**For a consistent set:** generate once, pick the best impression, then lock its look with `--sref <image-url-or-code> --sw 100` on every later prompt (hold `--ar`, `--s`, `--v`, `--chaos 0` constant). Optionally reuse a `--seed` for consistent framing.

## Narrators

The regular contributors to the narratives and epistolary of Avilund — the
in-world letters, chronicles, and texts that fill the Library.

- **_Name_** — _what they write (e.g. ecclesiastical history, saints' lives, letters)_

_Replace the line above with each narrator and their focus. Add one bullet per person._

## To Do

Items flagged to be worked on next, and who has taken them on. Set **Assigned
to** to a contributor's name (or _unassigned_), and update **Status** as work
moves — _Not started_, _In progress_, or _Done_.

| Task | Assigned to | Status |
| --- | --- | --- |
| **Figureheads of St. Ignatius College** — flesh out 2–3 named fellows/masters of St. Ignatius College at Lord's University (the college founded by the canon of St. Ignatius). One is the professor who sends the PCs to Carpathi in the introductory adventure; his correspondent is a fellow of the sister-college in the Bishopric of St. Ignatius. | _unassigned_ | Not started |
| **Cover illustration for _On the Side of Heaven_** — a frontispiece for the Library's central text. | _unassigned_ | Not started |
| **Map of the southern provinces** — the Primi heartlands referenced in the geography pages. | _unassigned_ | Not started |

_The two rows above are examples — replace them with real tasks. To add an item,
copy a row and fill in the task title, a short description, who should do it, and
its status._
