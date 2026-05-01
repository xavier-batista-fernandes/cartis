import { stringToSlug } from "./string-to-slug.js";

export function doStringsMatch(string1: string, string2: string) {
	const slug1 = stringToSlug(string1);
	const slug2 = stringToSlug(string2);
	return slug1 === slug2;
}
