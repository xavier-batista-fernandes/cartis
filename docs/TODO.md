# TODO

This file started as the follow-up list written after `v0.1.0`. It was last checked against the code at `v0.5.0`
(2026-10-14): items marked `[x]` are done, `[ ]` are still open, and `[~]` are partly done.

The short list of what to do next lives in `ROADMAP.md` under "Next".

## Docs / npm page

- [x] Rewrite `README.md` for npm users.
- [x] Add an installation section.
- [x] Add a quickstart example.
- [x] Add a realistic usage example for the current public API.
- [x] Document that the consumer must provide a container `HTMLElement`.
- [x] Document that the container needs explicit dimensions for the map to render correctly.
- [x] Document the current scope clearly: Portugal is the only supported geography for now.
- [x] Add an API overview for `CountryMap` and `Country`.
- [x] Add examples for styling municipalities and districts.
- [x] Keep the early-stage / `0.x` warning in the docs, but make it clearer and more intentional.
- [ ] Document `DistrictMap` in the README. It shipped in `v0.5.0` but the README never mentions it.
- [x] Remove "Click/hover event listeners" from the README's "What's not here yet" list. They shipped in `v0.4.0`.

## CountryMap API / runtime behavior

- [x] Decide how the library should expose map readiness/loading state. `CountryMap.create()` is an async factory
      that resolves once the map is rendered, and the constructor is private.
- [x] Review the async constructor behavior via `initMap()`. Replaced by the factory; `initMap()` no longer exists.
- [x] Ensure consumers cannot easily call styling methods before the map is ready. There is no way to hold an
      instance before it is ready.
- [x] Review default option handling so optional fields are accessed safely.
- [x] Review `MapOptions` and `StyleOptions` usage for missing/null/undefined cases (`!== undefined` checks, so
      `strokeWidth: 0` works).
- [x] Remove the debug `console.log` calls in `CountryMap.render()` (`src/core/country-map.ts`).
- [~] Review whether the current public methods on `CountryMap` are the right minimum API. Added since: `destroy`,
      `fitToCountry`, `fitToMunicipalities`, `fitToDistricts`, `zoomIn`, `zoomOut`, `onMunicipalityHover`,
      `onMunicipalityLeave`, `onMunicipalityClick`, `onZoomChange`. Still open: see the two bugs below and the
      reserved-but-ignored `MapOptions` fields (`padding`, `zoom.duration`, `zoom.min`, `zoom.max`).
- [ ] Make methods called after `destroy()` actually no-op. `destroy()` keeps the container, and
      `styleMunicipalities` / `styleDistricts` / `onZoomChange` look up `container.select("svg")`, so on a destroyed
      instance they reach whatever `<svg>` is in the container now, which can be a newer instance's map. They should
      target this instance's own `svgElement` (and the docstring's promised console warning should exist).
- [x] Make `ZoomChangeEvent.isDefaultView` tolerate float residue. The transform re-derived after a resize carries
      values like `-9.09e-13`; the check now allows a 1e-6 tolerance (`isDefaultTransform` in `src/core/utils.ts`).
- [ ] Fix the `FitOptions.zoom` docs. They say the result is capped at 5x "regardless of this multiplier", but the
      code applies the multiplier after the cap, which is how consumers get past it. Decide which is intended and make
      the docs and code agree.

## Public package surface

- [x] Reconfirm the intended public surface. It has grown on purpose beyond `CountryMap` and `Country`: `DistrictMap`,
      `randomMunicipality`, the district/municipality types and arrays, event and option types, and the string and
      lookup helpers. `src/index.ts` is the source of truth.
- [x] Keep `CountryData` out of the public API. It no longer exists.
- [x] Decide whether `CountryData` should be deleted. Deleted.
- [x] Reconfirm whether any additional root exports are actually needed before adding them.

## Package metadata / distribution

- [ ] Decide whether to add `main` back to `package.json` in addition to `exports` and `types`.
- [ ] Review whether the current `exports` definition is sufficient (ESM only, no CommonJS build).
- [ ] Review npm metadata quality in `package.json`. The description still says "maps as SVG or vector graphics".
- [ ] Add `repository`, `bugs` and `keywords` to `package.json`.

## Verification / quality

- [x] Add at least one lightweight verification path before future releases. `npm test` runs a Vitest + jsdom smoke
      test for both map classes, and CI runs it on every push and PR.
- [~] Make sure the release process includes build verification and package dry-run verification. The scripts exist
      (`npm run build`, `npm run publish:dryrun`) but nothing enforces running them.

## Release planning

- [x] Before the next release, make sure docs and basic runtime behavior are in a better state.
- [x] Decide whether the next public release should be `0.2.0` rather than `0.1.1`. It was `0.2.0`.
- [~] Make sure release notes explain what changed between versions. Each version is tagged (`v0.1.0` to `v0.5.0`),
      but there is no `CHANGELOG.md`, so what changed lives only in the commit history.
