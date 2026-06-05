# Roadmap

This file is a planning guide for sequencing Cartis work by release. It is not a release promise.

## Planning Principles
- Stabilize the core API before expanding the feature surface.
- Prioritize features that remove integration risk for consumers.
- Prefer extensibility over hardcoded one-off geography additions.
- Keep early releases focused so each version feels coherent.

## Current Baseline
- Cartis is an early-stage TypeScript map library.
- The current public API is still small.
- Only Portugal is implemented.
- The largest product risk today is async initialization inside `CountryMap`.

## v0.2: Make The Core Safe
Theme: remove uncertainty from the current API.

Goals:
- Make initialization predictable.
- Make lifecycle management explicit.
- Add the minimum interaction primitives needed by real applications.

Recommended scope:
- Add an explicit readiness model such as `await map.ready()`, `onReady`, or an async factory.
- Define behavior for methods called before initialization is complete.
- Add `destroy()` for cleanup.
- Add `resize()` or equivalent rerender support.
- Add first-party municipality and district interaction events.
- Add small utility methods such as `resetView()` and `clearStyles()`.

Why this release matters:
- It removes the biggest current usability risk.
- It gives consumers a stable mental model for integrating the library.

Success criteria:
- A consumer can reliably know when the map is ready.
- A consumer can mount, update, and clean up the map without DOM workarounds.
- A consumer can react to user interactions without directly wiring D3 events.

## v0.3: Make The Map Useful For Data
Theme: move from map rendering to map-driven product use cases.

Goals:
- Help users visualize application data directly on the map.
- Make navigation more useful for dashboards and workflows.

Recommended scope:
- Add data-driven styling for municipalities and districts.
- Support choropleth-style rendering.
- Add legend support or legend data helpers.
- Define missing-data behavior.
- Add `jumpToDistrict`.
- Add viewport helpers such as `fitToCountry`, `fitToDistrict`, and `fitToMunicipalities`.
- Make zoom, padding, and animation defaults configurable through a stable API.

Why this release matters:
- This is where Cartis becomes useful for analytics, civic, operational, and reporting applications.

Success criteria:
- A consumer can bind domain data to regions without custom rendering glue.
- A consumer can focus the map on a workflow-relevant area with first-class APIs.

## v0.4: Add Presentation Features
Theme: improve the information density and presentation quality of the map.

Goals:
- Support richer annotations and UI context.
- Reduce the need for custom overlay implementations.

Recommended scope:
- Add tooltip hooks or built-in tooltip support.
- Add optional municipality and district labels.
- Add markers or point overlays.
- Support custom SVG overlays layered above the map.

Why this release matters:
- Many real product experiences need context, labels, and callouts in addition to region styling.

Success criteria:
- A consumer can annotate and explain data on the map without rebuilding the presentation layer from scratch.

## v0.5: Open The Platform
Theme: make Cartis adaptable beyond the initial built-in geography model.

Goals:
- Reduce coupling to built-in geography assets.
- Improve adoption across frontend stacks.

Recommended scope:
- Support custom TopoJSON input.
- Define a clearer geography-loading model.
- Add stable styling hooks such as class names, data attributes, or style callbacks.
- Consider a thin React wrapper if the base API has stabilized.

Why this release matters:
- Extensibility is more valuable long term than shipping many hardcoded geographies inside the core package.

Success criteria:
- A consumer can use Cartis with custom geography data.
- Integration into framework-based applications becomes simpler without fragmenting the core API.

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

Why this release matters:
- `1.0` should signal that the product contract is dependable, not just that more features exist.

Success criteria:
- Core usage patterns are stable.
- Documentation matches the shipped API.
- Verification is strong enough to support confident releases.

## Not A Near-Term Priority
- Shipping many countries directly in the core package.
- Fancy animation presets.
- A heavy plugin system before the core API is stable.
- Broad feature expansion that avoids solving readiness and lifecycle problems first.

## If Only One Release Gets Focus Right Now
Prioritize `v0.2`.

Reason:
- Fixing readiness, lifecycle, and interaction ergonomics will increase the value of every later feature.
