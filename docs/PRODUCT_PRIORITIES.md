# Product Priorities

This file is a planning guide for future Cartis work. It is not a release commitment.

## Current Product Reality
- Cartis is an early-stage TypeScript map library.
- The current public API is small: `CountryMap`, `randomMunicipality`, `Country`, and related public types.
- Only Portugal is implemented today.
- `CountryMap` starts async setup inside the constructor, which makes readiness and lifecycle behavior the biggest current product risk.

## Prioritization Principles
- Prioritize features that remove integration risk before adding surface area.
- Prefer features that help users build real product experiences, not just prettier demos.
- Favor extensibility over hardcoding more one-off geography support.

## Priority 1: Readiness And Lifecycle
Goal: make the map safe and predictable to use in real applications.

- Add an explicit readiness API such as `await map.ready()`, `onReady`, or an async factory.
- Add `destroy()` so consumers can clean up event handlers and DOM state.
- Add `resize()` or equivalent rerender support for responsive containers.
- Define method behavior before initialization finishes.

Why this matters:
- This is the biggest current usability risk.
- Consumers will otherwise need trial-and-error to know when styling and navigation calls are safe.

## Priority 2: Interaction API
Goal: support real application behavior, not just rendering.

- Add click, hover, leave, and selection events.
- Support municipality and district level interactions.
- Add helpers such as `resetView()` and `clearStyles()`.
- Expose stable event payloads with region metadata.

Why this matters:
- Most product use cases need interaction before they need advanced visuals.
- Without a first-class event model, every consumer will build brittle DOM-level workarounds.

## Priority 3: Data-Driven Styling
Goal: let users visualize business data, not just geography.

- Support binding values to municipalities or districts.
- Add choropleth-style rendering helpers.
- Include color scale support and missing-data behavior.
- Add legend support or legend data helpers.

Why this matters:
- This is the feature set that makes the library useful for dashboards, reporting, civic apps, and analytics tools.

## Priority 4: Viewport Controls
Goal: make map navigation match common product needs.

- Add `fitToCountry`, `fitToDistrict`, and `fitToMunicipalities`.
- Add `jumpToDistrict` alongside `jumpToMunicipality`.
- Make zoom limits, padding, and animation settings configurable.

Why this matters:
- Users often need to focus the map around a region, selection, or workflow state.

## Priority 5: Labels, Tooltips, And Overlays
Goal: support richer information display without forcing custom implementations.

- Add tooltip hooks or built-in tooltip support.
- Add optional municipality and district labels.
- Add markers or overlays for points of interest.
- Allow custom SVG overlays layered on top of the map.

Why this matters:
- Many consumers need annotation and context, not just region fills.

## Priority 6: Extensibility And Framework Support
Goal: make Cartis easier to adopt across products and stacks.

- Support custom TopoJSON input instead of relying only on built-in geography packs.
- Consider a thin React wrapper after the core API is stable.
- Add clearer styling hooks such as class names, data attributes, or style callbacks.

Why this matters:
- Extensibility is more valuable than shipping many hardcoded countries.
- Framework integration can improve adoption once the base API is dependable.

## Not A Priority Yet
- Shipping many countries directly in the core package.
- Fancy animation presets.
- A heavy plugin system before the core API stabilizes.
- Broad feature expansion without first fixing readiness and lifecycle ergonomics.

## Suggested Release Framing
### v0.2
- Explicit readiness model.
- Cleanup and resize lifecycle support.
- Basic event API.

### v0.3
- Data-driven styling.
- Legends.
- Better viewport controls.

### v0.4+
- Tooltips, labels, markers, overlays.
- Custom TopoJSON input.
- Framework wrappers if adoption justifies them.

## If Only Three Things Ship Next
1. Explicit async readiness API.
2. Stable municipality and district interaction events.
3. Data-driven choropleth styling with legend support.

That combination would make Cartis much more useful for production dashboards and data-rich applications.
