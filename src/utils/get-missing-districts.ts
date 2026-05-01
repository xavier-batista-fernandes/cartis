import { DISTRICTS, type District } from "../types/district.js";

export function getMissingDistricts(existing: District[]): District[] {
	return DISTRICTS.filter((district) => !existing.includes(district));
}
