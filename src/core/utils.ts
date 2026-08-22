import { Country } from "../types/country.js";
import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";

export async function getTopology(country: Country): Promise<any> {
	switch (country) {
		case Country.PORTUGAL:
			return await import("../data/portugal/municipalities.json");
		default:
			throw new Error(`Topology data for country ${country} is not available.`);
	}
}

/**
 * Picks a uniformly random municipality name for the given country. Handy for demos, "guess a
 * random one" game modes, or decorative animated maps.
 *
 * @param country - Only {@link Country.PORTUGAL} is supported — other values throw.
 * @throws If `country` isn't supported.
 */
// TODO: Could be a class specific method.
export function randomMunicipality(country: Country): Municipality {
	switch (country) {
		case Country.PORTUGAL: {
			const index = Math.floor(Math.random() * MUNICIPALITIES.length);
			return MUNICIPALITIES[index];
		}

		default:
			throw new Error(`Random municipality for country ${country} is not available.`);
	}
}
