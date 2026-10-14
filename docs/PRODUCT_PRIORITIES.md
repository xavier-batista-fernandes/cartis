# Product Priorities

This file is a planning guide for future Cartis work. It is not a release commitment. It was last checked against the
code at `v0.5.0` (2026-10-14); `[x]` is done, `[~]` partly done, `[ ]` open.

## Current Product Reality
- Cartis is an early-stage TypeScript map library, published on npm at `v0.5.0`.
- The public API is `CountryMap`, `DistrictMap`, `randomMunicipality`, `Country`, the district/municipality types and
  arrays, event and option types, and the string/lookup helpers. `src/index.ts` is the source of truth.
- Only Portugal is implemented, and its topology is bundled.
- Readiness and lifecycle, the biggest risk when this file was written, are solved: maps come only from an async
  `create()` factory and clean up with `destroy()`.
- The biggest risks now: a few correctness gaps around `destroy()` and `isDefaultView`, no automated verification,
  and two map classes that duplicate most of their code.

## Prioritization Principles
- Prioritize features that remove integration risk before adding surface area.
- Prefer features that help users build real product experiences, not just prettier demos.
- Favor extensibility over hardcoding more one-off geography support.
- Use what the main consumer (Terras Lusas) has had to work around as evidence of what is missing.

## Priority 1: Readiness And Lifecycle (done, with gaps)
- [x] Explicit readiness API: async `create()` factory with a private constructor.
- [x] `destroy()`, which removes only the `<svg>` that instance created.
- [x] Resize support: automatic via `ResizeObserver`, keeping the current view.
- [x] Method behavior before initialization: there is no un-initialized instance to call.
- [ ] Method behavior after `destroy()`: `styleMunicipalities`, `styleDistricts` and `onZoomChange` still reach
      whatever `<svg>` is in the container, which can belong to a newer instance.

## Priority 2: Interaction API (done)
- [x] Click, hover and leave events, with an unsubscribe function each.
- [x] Municipality-level interactions on `CountryMap`, district-level on `DistrictMap`.
- [x] Event payloads with region metadata and pointer position.
- [~] `resetView()` exists as `fitToCountry()`; there is no `clearStyles()`.
- [ ] Selection state. Consumers track it themselves, which has been fine so far.

## Priority 3: Data-Driven Styling (partly done)
- [~] Binding values to regions: one style per call, so a choropleth is one call per color bin.
- [ ] Choropleth helpers, color scales, missing-data behavior.
- [ ] Legend support or legend data helpers.

## Priority 4: Viewport Controls (mostly done)
- [x] `fitToCountry`, `fitToDistricts`, `fitToMunicipalities`, `zoomIn`, `zoomOut`, `onZoomChange`.
- [x] `jumpToDistrict` / `jumpToMunicipality`, replaced by the `fitTo*` methods.
- [x] Turning user pan/zoom off while keeping the programmatic API (`zoom.enabled: false`).
- [ ] Configurable zoom limits, padding and animation durations. The `MapOptions` fields exist but are ignored.
- [ ] `isDefaultView` reliability (exact zero check breaks on float residue after a resize).

## Priority 5: Labels, Tooltips, And Overlays (not started)
- [~] Tooltip hooks: events carry pointer `x`/`y`; no built-in tooltip.
- [ ] Optional municipality and district labels.
- [ ] Markers or overlays for points of interest.
- [ ] Custom SVG overlays layered on top of the map.

## Priority 6: Extensibility And Framework Support (not started)
- [ ] Custom TopoJSON input.
- [ ] Styling hooks such as class names or data attributes on paths.
- [ ] A thin React wrapper, once the core is shared and tested.
- [x] Real district boundaries (`DistrictMap`). Not on the original list, but it removed a long-standing limitation.

## Not A Priority Yet
- Shipping many countries directly in the core package.
- Fancy animation presets.
- A heavy plugin system before the core API stabilizes.

## If Only Three Things Ship Next
1. Fix the `destroy()` and `isDefaultView` correctness gaps, and remove the debug logging.
2. A small smoke-test suite for both map classes, with the shared code extracted into one core.
3. Per-feature styling in one call (value map or style callback) plus `clearStyles()`.

The full ordered list is in `ROADMAP.md` under "Next".
