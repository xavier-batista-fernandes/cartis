import type { StyleOptions } from "./style.options.js";

/**
 * Stroke for the borders layer drawn by `styleBorders` on {@link CountryMap} and
 * {@link DistrictMap}. Same fields and meaning as {@link StyleOptions}' stroke fields.
 */
export type BorderStyleOptions = Pick<StyleOptions, "strokeColor" | "strokeWidth">;
