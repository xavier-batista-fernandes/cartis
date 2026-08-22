# Cartis

**Cartis** is a library for rendering maps as vector graphics, which abstracts away the complexity of TopoJSON and D3.

This library is under active development (0.x). \
**Breaking changes may occur between minor versions.**

Currently only Portugal (`Country.PORTUGAL`) is supported.

## Install

```bash
npm install cartis
```

## Quick start

```ts
import { Country, CountryMap } from "cartis";

const container = document.getElementById("map")!; // must already have a non-zero size

const map = await CountryMap.create(Country.PORTUGAL, container);

map.styleMunicipalities(["Sintra"], { fill: "#86c227" });
map.fitToMunicipalities(["Sintra"], { zoom: 1.5 });

// later, e.g. on component unmount:
map.destroy();
```

Framework-agnostic lifecycle note: `CountryMap.create()` only resolves once the map is fully
built, so you never hold a half-built instance. If you might call `create()` again before an
earlier call resolves (e.g. React StrictMode remounting a component), guard against keeping a
stale result:

```ts
let cancelled = false;

CountryMap.create(Country.PORTUGAL, container).then((map) => {
	if (cancelled) {
		map.destroy(); // discard — a newer call already took over
		return;
	}
	// ...store `map` somewhere you can call .destroy() on later
});

// on cleanup:
cancelled = true;
```

## API reference

### `CountryMap`

The core class. No public constructor — build one with `CountryMap.create()`.

| Member | Signature | What it does |
| --- | --- | --- |
| `CountryMap.create` | `(country, container, options?) => Promise<CountryMap>` | Builds and renders a map into `container`. Resolves once fully usable. |
| `destroy` | `() => void` | Removes this instance's `<svg>` and releases its state. Always safe to call. |
| `styleMunicipalities` | `(municipalities, options?) => void` | Colors the listed municipalities with one shared style. Omit `options` to reset them to the default style. |
| `styleDistricts` | `(districts, options?) => void` | Colors every municipality belonging to the listed districts with one shared style (no separate district polygons — see caveat below). |
| `fitToCountry` | `(options?) => void` | Zooms/pans back to the full-country view. |
| `fitToMunicipalities` | `(municipalities, options) => void` | Zooms/pans to frame the given municipalities. Requires a non-empty list. |
| `fitToDistricts` | `(districts, options) => void` | Zooms/pans to frame the given districts. Requires a non-empty list. |
| `zoomIn` | `() => void` | Zooms in by a fixed 1.25x step (capped at 10x). |
| `zoomOut` | `() => void` | Zooms out by a fixed 0.75x step (capped at 1x). |

Full parameter docs (including `options` shapes and edge cases) are in the source as JSDoc —
your editor will show them on hover/autocomplete.

**Caveat:** cartis has no separate district-boundary topology. `styleDistricts`/`fitToDistricts`
work by matching each municipality's district property, so what renders is municipality borders
sharing a color — set `strokeWidth: 0` if you want same-district municipalities to visually
merge into one shape.

### Types

| Export | What it is |
| --- | --- |
| `Country` | Enum of supported countries. Only `Country.PORTUGAL` today. |
| `District` | Literal union of all 18 Portuguese district names. |
| `Municipality` | Literal union of all 278 Portuguese municipality names. |
| `MapOptions` | Options for `CountryMap.create()` (initial styling; `padding`/`zoom` fields are reserved, not yet implemented). |
| `StyleOptions` | `{ fill?, strokeColor?, strokeWidth? }` — used by `styleMunicipalities`/`styleDistricts`. |
| `FitOptions` | `{ zoom?, duration? }` — used by `fitToMunicipalities`/`fitToDistricts`. |

### Utilities

| Export | Signature | What it does |
| --- | --- | --- |
| `getDistrictsArray` | `() => District[]` | All 18 district names. |
| `getMunicipalitiesArray` | `() => Municipality[]` | All 278 municipality names. |
| `randomMunicipality` | `(country) => Municipality` | A random municipality name. |
| `getDistrictFromString` | `(input) => District \| undefined` | Exact, accent/case-insensitive match. |
| `getMunicipalityFromString` | `(input) => Municipality \| undefined` | Exact, accent/case-insensitive match. |
| `getDistrictsFromString` | `(input) => District[]` | Prefix match — for search-as-you-type. |
| `getMunicipalitiesFromString` | `(input) => Municipality[]` | Prefix match — for search-as-you-type. |
| `getMissingDistricts` | `(existing) => District[]` | The complement of a district list. |
| `getMissingMunicipalities` | `(existing) => Municipality[]` | The complement of a municipality list. |
| `doStringsMatch` | `(a, b) => boolean` | Accent/case/whitespace-insensitive equality check. |
| `stringToSlug` | `(text) => string` | Lowercase, hyphenated, accent-stripped slug. |
| `stringToTitleCase` | `(text) => string` | Title-cases words, keeping Portuguese articles/prepositions lowercase. |

## What's not here yet

- Multi-country support (only Portugal)
- Custom/runtime TopoJSON loading (the topology is bundled)
- Click/hover event listeners
- Per-feature choropleth coloring in a single call (each `style*` call applies one shared style to every match)
- Tooltips, labels, markers/overlays

See `docs/ROADMAP.md` and `docs/PRODUCT_PRIORITIES.md` for internal planning notes on these.
