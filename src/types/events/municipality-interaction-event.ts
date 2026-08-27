import type { District } from "../district.js";
import type { Municipality } from "../municipality.js";

export type MunicipalityInteractionEvent = {
	municipality: Municipality;
	district: District;
	/** Pointer position relative to the map's container, in pixels — for positioning a tooltip. */
	x: number;
	y: number;
};
