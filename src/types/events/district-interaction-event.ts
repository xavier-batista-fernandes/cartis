import type { District } from "../district.js";

export type DistrictInteractionEvent = {
	district: District;
	/** Pointer position relative to the map's container, in pixels — for positioning a tooltip. */
	x: number;
	y: number;
};
