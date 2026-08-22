/**
 * Fill/stroke to apply to matched map features. Used by {@link CountryMap.styleMunicipalities}
 * and {@link CountryMap.styleDistricts}. Any CSS color string is valid for `fill`/`strokeColor`
 * (hex, `rgb()`, `rgba()`, named colors, ...).
 */
export interface StyleOptions {
	/** CSS color for the matched paths' fill. */
	fill?: string;
	/** CSS color for the matched paths' stroke. */
	strokeColor?: string;
	/** Stroke width in SVG user units. Set to `0` to hide borders (useful when blending same-color adjacent municipalities). */
	strokeWidth?: number;
}
