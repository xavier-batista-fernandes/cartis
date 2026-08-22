/** Options for {@link CountryMap.fitToMunicipalities} and {@link CountryMap.fitToDistricts}. */
export interface FitOptions {
	/** Extra scale multiplier on top of the computed tight fit. `< 1` zooms out further; result is capped at 5x. Default `1`. */
	zoom?: number;
	/** Transition duration in milliseconds. Default `1000`. */
	duration?: number;
}
