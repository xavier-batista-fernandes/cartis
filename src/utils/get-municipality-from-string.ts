import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";
import { doStringsMatch } from "./strings/do-strings-match.js";

export function getMunicipalityFromString(input: string): Municipality | undefined {
	return MUNICIPALITIES.find((municipality) => doStringsMatch(input, municipality));
}
