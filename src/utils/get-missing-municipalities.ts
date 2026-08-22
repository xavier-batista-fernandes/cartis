import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";

/**
 * The complement of `existing`: every municipality **not** in the given list. Handy for a
 * "what's left to find" view, e.g. resetting unmatched municipalities back to the default style
 * while a search's matches get highlighted (see {@link CountryMap.styleMunicipalities}).
 *
 * @param existing - Municipalities to exclude.
 * @returns The remaining municipalities, in `MUNICIPALITIES`' original order.
 */
export function getMissingMunicipalities(existing: Municipality[]): Municipality[] {
	return MUNICIPALITIES.filter((municipality) => !existing.includes(municipality));
}
