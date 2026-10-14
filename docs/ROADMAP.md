# Roadmap

This file is a planning guide for sequencing Cartis work by release. It is not a release promise. It was last checked
against the code at `v0.5.0` (2026-10-14).

## Planning Principles
- Stabilize the core API before expanding the feature surface.
- Prioritize features that remove integration risk for consumers.
- Prefer extensibility over hardcoded one-off geography additions.
- Keep early releases focused so each version feels coherent.

## Current Baseline
- Cartis is an early-stage TypeScript map library, published on npm at `v0.5.0`.
- Two map classes: `CountryMap` (municipalities) and `DistrictMap` (true district boundaries). Both are built with an
  async `create()` factory, have `destroy()`, follow container resizes, and expose hover/click/leave and zoom-change
  events plus `fitTo*` and `zoomIn`/`zoomOut`.
- Only Portugal is implemented, and its topology is bundled with the package.
- The async-initialization risk this roadmap was originally built around is solved. The main risks now are small
  correctness gaps (see "Next"), no automated verification, and a lot of code duplicated between the two map classes.
- Terras Lusas is the main real consumer, and its workarounds are a good guide to what cartis is missing.

## What Actually Shipped

The original plan put lifecycle in `v0.2`, data styling in `v0.3`, presentation in `v0.4` and extensibility in `v0.5`.
In practice the releases kept to the core: lifecycle, interaction and viewport control, then district maps.

| Version | What shipped |
| --- | --- |
| `v0.2.0` | `CountryMap` class, `jumpToMunicipality`, exported string/lookup helpers. |
| `v0.3.0` | Async `create()` factory with a private constructor, `destroy()`, `fitToCountry` / `fitToMunicipalities` / `fitToDistricts` (replacing `jumpToMunicipality`), resize handling that keeps the current view, strict TypeScript, README and API docs. |
| `v0.4.0` | `onMunicipalityHover` / `onMunicipalityLeave` / `onMunicipalityClick`, `onZoomChange`, `zoom.enabled` and `interactive` options, fix for NaN paths in zero-size containers. |
| `v0.5.0` | `DistrictMap` with real district polygons and its own district events. |

### Original v0.2 scope: Make The Core Safe (done)
- [x] Explicit readiness model: async `create()` factory.
- [x] Behavior for methods called before initialization: impossible, the instance only exists once ready.
- [x] `destroy()` for cleanup.
- [x] Resize support: automatic, via `ResizeObserver`, preserving the current view.
- [x] First-party municipality and district interaction events.
- [~] `resetView()` exists as `fitToCountry()`. There is no `clearStyles()`; calling `styleMunicipalities(names)` with
      no options resets only the listed ones.

### Original v0.3 scope: Make The Map Useful For Data (partly done)
- [~] Data-driven styling: `styleMunicipalities` / `styleDistricts` apply one style per call, so a choropleth takes one
      call per color bin. There is no way to pass a value per feature.
- [ ] Choropleth helpers, color scales, legend support, missing-data behavior.
- [x] `jumpToDistrict`, as `fitToDistricts`.
- [x] `fitToCountry`, `fitToDistricts`, `fitToMunicipalities`.
- [ ] Configurable zoom, padding and animation defaults. `MapOptions.padding`, `zoom.duration`, `zoom.min` and
      `zoom.max` exist in the types but are documented as "not yet implemented" and ignored.

### Original v0.4 scope: Add Presentation Features (mostly not started)
- [~] Tooltip hooks: interaction events carry the pointer `x`/`y` relative to the container, which is enough for a
      consumer-drawn tooltip. No built-in tooltip.
- [ ] Optional municipality and district labels.
- [ ] Markers or point overlays.
- [ ] Custom SVG overlays layered above the map.

### Original v0.5 scope: Open The Platform (not started)
- [ ] Custom TopoJSON input.
- [ ] A clearer geography-loading model (the topology is a bundled dynamic `import()`).
- [ ] Stable styling hooks such as class names or data attributes on paths.
- [ ] A thin React wrapper.

## Next

A short, ordered list. Each item is small enough to be its own release or part of one.

1. **Fix the correctness gaps consumers already hit.**
   - Methods called after `destroy()` reach whatever `<svg>` is now in the container, which can be a newer instance's
     map. Select this instance's own `svgElement` instead, and warn as the `destroy()` docs promise.
   - `isDefaultView` uses an exact zero check and misreports after a resize because of float residue. Compare with a
     tolerance, so Terras Lusas can drop its `isRestingView` workaround.
   - Make the `FitOptions.zoom` docs match the code (the multiplier is applied after the 5x cap).
   - Remove the debug `console.log` calls from `CountryMap.render()`.
2. **Add a lightweight verification path.** A small Vitest + jsdom smoke test that creates a map, styles it, fits it
   and destroys it, for both map classes. This has been on the list since `v0.1.0` and should land before more
   features do.
3. **Share code between `CountryMap` and `DistrictMap`.** Rendering, resize, zoom, fit and event wiring are near
   copies of each other. Extracting the common part makes item 1's fixes land once and keeps the next features from
   being written twice.
4. **Per-feature styling in one call.** Accept a value map or a style callback (municipality → style) so a choropleth
   is one call instead of one per bin, plus a `clearStyles()`. Terras Lusas builds heatmaps bin by bin today.
5. **Honor or drop the reserved `MapOptions` fields** (`padding`, `zoom.min`, `zoom.max`, `zoom.duration`), and
   document `DistrictMap` in the README.

After that, the original presentation and extensibility ideas (labels, markers, overlays, custom TopoJSON, legend
helpers) are still the right direction, ordered by what a real consumer asks for first.

## v1.0: Stabilize The Product Contract
Theme: finalize the product shape after the core usage patterns are proven.

Goals:
- Lock down the API surface that real consumers rely on.
- Tighten quality, docs, and release expectations.

Recommended scope:
- Review and finalize the public API.
- Remove or redesign features that remained awkward across `0.x`.
- Document the intended extension model clearly.
- Add stronger verification coverage than build-only validation.
- Publish polished documentation and examples for the stable use cases.
- Keep a changelog.

Success criteria:
- Core usage patterns are stable.
- Documentation matches the shipped API.
- Verification is strong enough to support confident releases.

## Not A Near-Term Priority
- Shipping many countries directly in the core package.
- Fancy animation presets.
- A heavy plugin system before the core API is stable.
- A React wrapper before the two map classes share one tested core.
