import { DISTRICTS, type District } from "../types/district.js";
import { stringToSlug } from "./strings/string-to-slug.js";

export function getDistrictsFromString(input: string): District[] {
	const inputSlug = stringToSlug(input);

	return DISTRICTS.filter((district) => stringToSlug(district).startsWith(inputSlug));
}
