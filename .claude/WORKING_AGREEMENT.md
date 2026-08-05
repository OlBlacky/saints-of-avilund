# Working Agreement

How Claude collaborates on this repository. This is a **solo project**: Les is the only person doing real work here, and he is a designer, not a developer. Occasional material arrives from Gus (collaborator on art direction) as pasted-in content. There is no team workflow — no issue tracker, no branches, no PRs. Everything commits straight to `master` via **CLEAN**.

## How to Approach Work

### 1. Plan when the blast radius is real

Use plan mode for architectural decisions, multi-file refactors, new site sections, or anything hard to reverse. Don't use it for clear bug fixes, single-file edits, or tasks where the path is obvious.

If something goes sideways mid-task: stop, surface what changed, re-plan. Don't keep pushing on a broken premise.

### 2. Plain language, small bites

Les works in small steps and reads everything. Explain in plain language, no assumed technical knowledge. Take one small step at a time and check in rather than dumping a huge multi-part change. Lead with the result.

### 3. Self-improvement loop

When corrected, capture the pattern in `LESSONS.md`. Lead with the rule, then **Why** and **How to apply**, so future sessions can judge edge cases instead of blindly following. Read `LESSONS.md` at the start of a task.

### 4. Verify before claiming done

Marking a task complete is a claim that it works. Run the tests, exercise the change. For site changes, build the site (`pnpm build`) — and remember visual review happens on the **deployed** GitHub Pages site, never a localhost link. If you can't verify, say so explicitly.

### 5. Demand elegance — for non-trivial changes only

For changes that touch shared structure (data models, layouts, the rules engine): pause and ask "is there a more elegant way?" before committing to it. If a fix feels hacky, redo it knowing what you know now. For simple, obvious fixes: skip this.

### 6. Just fix clear bugs

Given a bug report with errors or broken behaviour: diagnose and fix. Don't ask Les to walk through it — he's not a developer. Escalate to a plan only if the fix turns out to require structural changes.

### 7. Subagents for fan-out, not for everything

Subagents are for independent parallel work or for keeping large research output out of the main context. When the task is sequential or short, do it inline.

## Writing Content

- **Mechanics in full, flavour as placeholders.** Write game mechanics completely and precisely. For colour/flavour prose (blurbs, identity paragraphs, in-world voice), leave a `[[add text]]` placeholder with a short cue — Les rewrites substantial prose in his own voice before anything goes public.
- Follow the standing orders in `CLAUDE.md` (images, cross-links, library headers) and the Rails (`mechanics/design-principles.md`) for anything mechanical.

## Git

- **Never commit or push without explicit permission.** **CLEAN** is the standing routine: stage everything, sensible commit message, commit, push.
- Commit messages: imperative mood, concise subject line, body only when context helps.
- Work happens directly on `master`. No branching protocol.
