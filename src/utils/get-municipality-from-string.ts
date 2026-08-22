import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";
import { doStringsMatch } from "./strings/do-strings-match.js";

/**
 * Finds the municipality whose name **exactly matches** `input`, ignoring case, accents, and
 * surrounding whitespace (via {@link doStringsMatch}). Use this to turn free-text user input
 * (e.g. a finished guess) into the exact `Municipality` string cartis's map methods expect. For
 * partial/prefix matching as the user types, use {@link getMunicipalitiesFromString} instead.
 *
 * @param input - Free-text municipality name, e.g. from a search box or a submitted guess.
 * @returns The matching {@link Municipality}, or `undefined` if no municipality matches exactly.
 */
export function getMunicipalityFromString(input: string): Municipality | undefined {
	return MUNICIPALITIES.find((municipality) => doStringsMatch(input, municipality));
}
