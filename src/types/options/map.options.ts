import type { StyleOptions } from "./style.options.js";

/** Options passed to {@link CountryMap.create} to configure the initial map. */
export interface MapOptions {
	/**
	 * Not yet implemented — `CountryMap` currently hardcodes 5% padding on every side regardless
	 * of this value. Reserved for a future release.
	 */
	padding?: number; // % as decimal (0.05 = 5%)

	zoom?: {
		/** Not yet implemented — `zoomIn`/`zoomOut`/`fitTo*` transitions always use their own
		 *  hardcoded durations regardless of this value. Reserved for a future release. */
		duration?: number;
		/** Whether the rendered map responds to interactive pan/zoom (wheel, drag, pinch, double-click).
		 *  Default `true`. Setting `false` disables only those listeners — `zoomIn`/`zoomOut`/
		 *  `fitToCountry`/`fitToMunicipalities`/`fitToDistricts` remain fully usable, so a caller can
		 *  still programmatically move a "fixed" map; the user just can't drive it directly. */
		enabled?: boolean;
		/** Not yet implemented — `CountryMap` currently always uses a fixed 1x–10x scale extent
		 *  regardless of this value. Reserved for a future release. */
		min?: number;
		/** Not yet implemented — see {@link min}. */
		max?: number;
	};

	/**
	 * Whether municipality paths show a pointer cursor and hit-test for
	 * `onMunicipalityHover`/`onMunicipalityLeave`/`onMunicipalityClick`. Default `true`. Set `false`
	 * for a purely decorative/read-only map (a summary choropleth, say) where no handlers will ever
	 * be registered — otherwise the cursor implies clickability the map doesn't have.
	 */
	interactive?: boolean;

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
