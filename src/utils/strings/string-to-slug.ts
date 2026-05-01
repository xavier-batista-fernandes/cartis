/**
 * Converts a string to a slug.
 * This function replaces spaces with hyphens, converts the string to lowercase,
 * removes accents, and trims leading and trailing whitespace.
 *
 * @param string - The input string to be converted to a slug.
 *
 * @returns The converted slug string.
 */
export function stringToSlug(string: string) {
	return string
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}
