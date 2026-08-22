import { DISTRICTS, type District } from "../types/district.js";
import { stringToSlug } from "./strings/string-to-slug.js";

/**
 * Finds every district whose (slugified) name **starts with** `input`'s (slugified) name —
 * accent/case-insensitive prefix matching, suited to live-search-as-you-type. An empty `input`
 * matches every district. For an exact single match, use {@link getDistrictFromString}.
 *
 * @param input - Free-text prefix, e.g. the current value of a search box.
 * @returns Matching {@link District} names, in `DISTRICTS`' original order. Empty array if none match.
 */
export function getDistrictsFromString(input: string): District[] {
	const inputSlug = stringToSlug(input);

	return DISTRICTS.filter((district) => stringToSlug(district).startsWith(inputSlug));
}
