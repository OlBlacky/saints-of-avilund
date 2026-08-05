# Coding Standards

Conventions for the one code component in this repo: the Astro site in `app/`. Adapted from the Solstice engineering standards; backend/API sections dropped (this is a static site with no server).

## General

1. **No emoji** in code comments or log messages.

2. **Braces**: opening bracket on the same line as the statement, closing bracket on its own line.

3. **Indentation**: 2 spaces in TypeScript, Astro components, and SCSS. No tabs.

4. **Naming conventions**:
   - Variables and functions: `camelCase`
   - Module-level constants: `SCREAMING_SNAKE_CASE`
   - Types and interfaces: `PascalCase`
   - Astro components: `PascalCase.astro`
   - Other filenames: `kebab-case.ts` / `kebab-case.scss`

5. **Import ordering**: built-in, third-party, local — blank lines between groups.

6. **TypeScript strictness**: keep `strict` on, avoid `any`.

7. **Fail fast, fail loud.** No lazy fallbacks. If data is malformed or missing (a saint without a tier, an ability card referencing a ladder that doesn't exist), throw at build time — don't render a blank. A static site's build step is exactly where errors should surface. Silent failures are bugs that hide other bugs.

8. **Single source of truth for game data.** Rules data (classes, abilities, ladders, feats) lives once, in typed data modules under `app/src/lib/`, and everything renders from there — the same principle as `saints.ts` and the shared-ladder constants (`STD_RANGE`, `ongoingDamage()`). Never copy a number into a page that a data module already owns.

9. **Document data fields with JSDoc.** Every exported type and every non-obvious field gets a `/** ... */` comment directly above it (that's what editors surface on hover). Field comments describe *meaning or constraint* — units, valid ranges, which rule it encodes — not the type.

## Testing

10. **Vitest** is the test runner. Any new logic in `app/src/lib/` ships with tests — especially rules-engine code (character builder math, advancement validation, ladder helpers).

11. **Prefer pure functions over mocks.** Keep logic out of components: extract it into pure functions that take data in and return results. Pure in, results out, zero mocks needed.

12. **Test our logic, not libraries.** Passthroughs to Astro or third-party code don't need tests.

13. **Every test must be able to catch a real bug.** No smoke tests, no tautologies. If you can't describe a plausible change that would make the test fail, delete it.

14. **Inline fixtures.** Build minimal fixtures in the test file (baseline object + spread/override per case). Tests should never break because a content file was added or removed.

15. **Keep components thin.** `.astro` files and any client-side components wire tested functions together; they shouldn't contain logic that needs its own tests.

## Site Conventions

16. Content and standing orders (images, cross-linking, library headers, alphabetical sorting) are in `CLAUDE.md` — they are conventions with the same force as anything here.

17. **Verify versions against live sources.** Never trust training data for package versions — check npm or the official docs before writing a version into `package.json` or a workflow file.

18. Styling goes through `app/src/styles/global.scss` and the parchment theme's existing variables — don't introduce one-off inline styles or a second styling system.
