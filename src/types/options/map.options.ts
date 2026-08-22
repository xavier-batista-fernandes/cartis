import type { StyleOptions } from "./style.options.js";

/** Options passed to {@link CountryMap.create} to configure the initial map. */
export interface MapOptions {
	/**
	 * Not yet implemented — `CountryMap` currently hardcodes 5% padding on every side regardless
	 * of this value. Reserved for a future release.
	 */
	padding?: number; // % as decimal (0.05 = 5%)

	/**
	 * Not yet implemented — `CountryMap` currently always enables zoom with a fixed 1x–10x scale
	 * extent regardless of these values. Reserved for a future release.
	 */
	zoom?: {
		duration?: number;
		enabled?: boolean;
		min?: number;
		max?: number;
	};

	/** Initial fill/stroke applied to every municipality path when the map first renders. */
	style?: {
		/** CSS color for every municipality's stroke. */
		strokeColor?: string;
		/** Stroke width in SVG user units. */
		strokeWidth?: number;
		/** CSS color for every municipality's fill. */
		fill?: string;
		/** Transition duration (ms) used by every subsequent `styleMunicipalities`/`styleDistricts` call on this map, unless overridden per-call. Default `300`. */
		duration?: number;
	} & StyleOptions;
}
