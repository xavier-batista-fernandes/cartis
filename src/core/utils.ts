import { Country } from "../types/country.js";
import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";

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

// How far a zoom transform may drift from identity and still count as the default view. The
// transform re-derived after a resize goes through a projection round trip and comes back with
// floating-point residue (`translate(0, -9.09e-13) scale(1)` in practice); anything this small is
// far below a pixel, so it can't be a pan or zoom anyone made on purpose.
const DEFAULT_VIEW_TOLERANCE = 1e-6;

/** Whether a zoom transform is the map's initial fitted view (no zoom, no pan), give or take float residue. */
export function isDefaultTransform({ k, x, y }: { k: number; x: number; y: number }): boolean {
	return Math.abs(k - 1) < DEFAULT_VIEW_TOLERANCE && Math.abs(x) < DEFAULT_VIEW_TOLERANCE && Math.abs(y) < DEFAULT_VIEW_TOLERANCE;
}
