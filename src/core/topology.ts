import { Country } from "../types/country.js";
import type { DistrictsTopology, MunicipalitiesTopology } from "../types/map/map-feature.js";

// Kept apart from `utils.ts`, which the public `randomMunicipality` export lives in: these return
// GeoJSON/TopoJSON types, and nothing reachable from the package's `index.d.ts` should import from
// type packages a consumer may not have installed.

// The JSON imports are cast: TypeScript infers their literal shape (every coordinate as `number`),
// which is wider than the TopoJSON types say a topology's fields are.
export async function getTopology(country: Country): Promise<MunicipalitiesTopology> {
	switch (country) {
		case Country.PORTUGAL:
			return (await import("../data/portugal/municipalities.json")) as unknown as MunicipalitiesTopology;
		default:
			throw new Error(`Topology data for country ${country} is not available.`);
	}
}

export async function getDistrictTopology(country: Country): Promise<DistrictsTopology> {
	switch (country) {
		case Country.PORTUGAL:
			return (await import("../data/portugal/districts.json")) as unknown as DistrictsTopology;
		default:
			throw new Error(`District topology data for country ${country} is not available.`);
	}
}
