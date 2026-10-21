export type ZoomChangeEvent = {
	/** Current zoom multiplier — `1` is the initial fitted view. */
	scale: number;
	/** Whether the map is at its initial fitted view (no zoom, no pan) — the state
	 *  `fitToCountry()` and a fresh `create()` both leave it in, and a container resize keeps it in.
	 *  Tolerates the sub-pixel float residue a resize leaves on the transform. Useful for showing a
	 *  "reset view" control only once there's somewhere to reset back *from*. */
	isDefaultView: boolean;
};
