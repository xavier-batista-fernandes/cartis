import { DISTRICTS, type District } from "../types/district.js";

/**
 * The complement of `existing`: every district **not** in the given list. Handy for a
 * "what's left to find" view, e.g. styling unguessed districts differently from guessed ones.
 *
 * @param existing - Districts to exclude.
 * @returns The remaining districts, in `DISTRICTS`' original order.
 */
export function getMissingDistricts(existing: District[]): District[] {
	return DISTRICTS.filter((district) => !existing.includes(district));
}
