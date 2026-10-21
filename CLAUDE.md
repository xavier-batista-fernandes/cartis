# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Repo Shape
- Single-package npm TypeScript library. No workspace or monorepo tooling.
- Source lives in `src/`. Published output is `dist/`.
- Root public entrypoint is `src/index.ts`; package exports only `dist/index.js` and `dist/index.d.ts`.

## Commands
- Install: `npm install`
- Build: `npm run build`
- Full package verification: `npm run build && npm run publish:dryrun`

## Formatting / Linting
- Biome is the only formatter/linter.
- `npm run format:check` is not read-only: it runs `biome check --write` and can modify files.
- `npm run format:write` only formats with `biome format --write`.
- Biome uses tabs, double quotes, import organization, and ignores `dist/`.

## Generated Files
- `src/types/district.ts` and `src/types/municipality.ts` are generated from `src/data/portugal/municipalities.json`.
- Regenerate them with `node scripts/generate-types.js`.
- Do not hand-edit generated type lists unless you also update the source data and regenerate.

## Library Constraints
- Package is ESM (`"type": "module"`); internal imports use `.js` extensions in TypeScript source because output is NodeNext ESM.
- `CountryMap` has a **private constructor** — the only way to get an instance is `await CountryMap.create(country, container, options?)`, which resolves once the map is fully rendered. There is no half-built/not-ready state a consumer can observe or call methods on.
- `destroy()` removes only the `<svg>` that specific instance created, never the whole container — safe to call even on an instance a caller is discarding in favor of a newer one sharing the same container.
- Only `Country.PORTUGAL` is implemented right now.

## Public API
- Trust `src/index.ts` over prose docs for the current public surface.
- Current exports include `CountryMap`, `randomMunicipality`, `Country`, public types for districts/municipalities/map/style/fit options, and the string-matching/lookup utilities (`doStringsMatch`, `stringToSlug`, `stringToTitleCase`, `get*FromString`, `getMissing*`).

## Verification Expectations
- `npm test` runs a Vitest + jsdom smoke test (`test/smoke.test.ts`) that creates, styles, fits and destroys both map
  classes. CI (`.github/workflows/ci.yml`) runs it along with Biome, the build and a pack check.
- For most changes, the minimum meaningful verification is `npm test && npm run build`.
- If packaging or exports change, also run `npm run publish:dryrun`.

## Releases
- Follow `RELEASING.md`. A version bump is its own PR titled `chore(release): vX.Y.Z` that changes only `package.json`
  and `package-lock.json` (`npm version X.Y.Z --no-git-tag-version`); feature and fix PRs never touch `version`.
- CI enforces the release PR rules, and `release.yml` refuses a tag that doesn't point at that release commit on `main`.
- Sessions can't create tags or GitHub releases: Xavier creates the release (title = tag, empty notes while on 0.x).
