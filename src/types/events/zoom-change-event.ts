export type ZoomChangeEvent = {
	/** Current zoom multiplier — `1` is the initial fitted view. */
	scale: number;
	/** Whether the map is exactly at its initial fitted view (no zoom, no pan) — the state
	 *  `fitToCountry()` and a fresh `create()` both leave it in. Useful for showing a "reset view"
	 *  control only once there's somewhere to reset back *from*. */
	isDefaultView: boolean;
};
