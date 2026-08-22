import { DISTRICTS, type District } from "../types/district.js";
import { doStringsMatch } from "./strings/do-strings-match.js";

/**
 * Finds the district whose name **exactly matches** `input`, ignoring case, accents, and
 * surrounding whitespace (via {@link doStringsMatch}). For partial/prefix matching as the user
 * types, use {@link getDistrictsFromString} instead.
 *
 * @param input - Free-text district name, e.g. from a search box.
 * @returns The matching {@link District}, or `undefined` if no district matches exactly.
 */
export function getDistrictFromString(input: string): District | undefined {
	return DISTRICTS.find((district) => doStringsMatch(input, district));
}
