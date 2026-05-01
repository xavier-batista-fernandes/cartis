import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";
import { stringToSlug } from "./strings/string-to-slug.js";

export function getMunicipalitiesFromString(input: string): Municipality[] {
	const inputSlug = stringToSlug(input);

	return MUNICIPALITIES.filter((municipality) => stringToSlug(municipality).startsWith(inputSlug));
}
