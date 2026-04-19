import { Country } from "../types/country.js";

export async function getTopology(country: Country): Promise<any> {
	switch (country) {
		case Country.PORTUGAL:
			return await import("../data/portugal/municipalities.json");
		default:
			throw new Error(`Topology data for country ${country} is not available.`);
	}
}
