import { DISTRICTS, type District } from "../types/district.js";
import { doStringsMatch } from "./strings/do-strings-match.js";

export function getDistrictFromString(input: string): District | undefined {
	return DISTRICTS.find((district) => doStringsMatch(input, district));
}
