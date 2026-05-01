/**
 * Converts the first letter of each word in a string to uppercase, making the rest of the word lowercase.
 * Keeps certain words like "do", "da", "de" in lowercase.
 *
 * @param text - The input string to be converted.
 *
 * @returns The converted string in title case.
 */
export function stringToTitleCase(text: string): string {
	const regex = /[çÇáÁéÉíÍóÓúÚàÀãÃâÂêÊôÔõÕüÜñÑA-Za-z]+-?/g;
	const exceptions = ["o", "do", "dos", "o-", "a", "da", "das", "à", "a-", "e", "de", "des", "é"];

	return text.replace(regex, (word) => {
		if (exceptions.includes(word.toLowerCase())) {
			return word.toLowerCase();
		}
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	});
}
