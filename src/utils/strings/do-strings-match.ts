import { stringToSlug } from "./string-to-slug.js";

/**
 * Compares two strings for equality after slugifying both (via {@link stringToSlug}) — so
 * casing, accents, extra whitespace, and hyphen-vs-space differences are all ignored. Useful for
 * matching free-text user input (e.g. a typed guess) against a known name.
 *
 * @example doStringsMatch("  São João da MADEIRA", "sao-joao-da-madeira") // true
 */
export function doStringsMatch(string1: string, string2: string) {
	const slug1 = stringToSlug(string1);
	const slug2 = stringToSlug(string2);
	return slug1 === slug2;
}
