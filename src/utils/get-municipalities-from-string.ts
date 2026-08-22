import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";
import { stringToSlug } from "./strings/string-to-slug.js";

/**
 * Finds every municipality whose (slugified) name **starts with** `input`'s (slugified) name —
 * accent/case-insensitive prefix matching, suited to live-search-as-you-type (e.g. pass the
 * matches straight into {@link CountryMap.styleMunicipalities} to highlight them on the map). An
 * empty `input` matches every municipality. For an exact single match, use
 * {@link getMunicipalityFromString}.
 *
 * @param input - Free-text prefix, e.g. the current value of a search box.
 * @returns Matching {@link Municipality} names, in `MUNICIPALITIES`' original order. Empty array if none match.
 */
export function getMunicipalitiesFromString(input: string): Municipality[] {
	const inputSlug = stringToSlug(input);

	return MUNICIPALITIES.filter((municipality) => stringToSlug(municipality).startsWith(inputSlug));
}
