import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";

export function getMissingMunicipalities(existing: Municipality[]): Municipality[] {
	return MUNICIPALITIES.filter((municipality) => !existing.includes(municipality));
}
