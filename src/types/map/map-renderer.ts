import type { GeoPath, GeoProjection, ZoomBehavior } from "d3";

export interface MapRenderer {
	container: HTMLElement | null;
	collection?: any;
	geoProjection?: GeoProjection;
	pathGenerator?: GeoPath<any, any>;
	zoomBehavior?: ZoomBehavior<any, any>;
}
