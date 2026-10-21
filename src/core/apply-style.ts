import type { BaseType, Selection } from "d3";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { StyleOptions } from "../types/options/style.options.js";

/**
 * Animates `options` onto `targets`, or resets them to the default style when `options` is
 * omitted. Shared by every `style*` method on `CountryMap` and `DistrictMap`.
 *
 * Each attribute animates on its own *named* transition. d3 only lets one transition of a given
 * name run on an element at a time — starting a newer one interrupts the older one wherever it
 * got to. With a single shared (unnamed) transition per call, a call that sets only `fill` would
 * cancel an earlier call's still-running stroke change on the same paths, leaving that stroke
 * stuck mid-way (e.g. "reset everything, then highlight a few" kept the highlighted paths' old
 * border). Naming per attribute means a later call only pre-empts the attributes it sets itself.
 */
export function applyStyle<E extends BaseType, D, P extends BaseType, PD>(
	targets: Selection<E, D, P, PD>,
	duration: number,
	options?: StyleOptions,
) {
	const style: StyleOptions = options ?? {
		fill: DEFAULT_MAP_STYLES.fill,
		strokeColor: DEFAULT_MAP_STYLES.strokeColor,
		strokeWidth: DEFAULT_MAP_STYLES.strokeWidth,
	};

	// `!== undefined`, not truthy checks: `strokeWidth: 0` (documented as how to hide borders)
	// and `fill`/`strokeColor: ""` are legitimate values a truthy check silently drops.
	if (style.fill !== undefined) {
		targets.transition("cartis-fill").duration(duration).attr("fill", style.fill);
	}
	if (style.strokeColor !== undefined) {
		targets.transition("cartis-stroke").duration(duration).attr("stroke", style.strokeColor);
	}
	if (style.strokeWidth !== undefined) {
		targets.transition("cartis-stroke-width").duration(duration).attr("stroke-width", style.strokeWidth);
	}
}
