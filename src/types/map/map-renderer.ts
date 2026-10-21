import type { GeoPath, GeoPermissibleObjects, GeoProjection, ZoomBehavior } from "d3";
import type { MapFeatureCollection } from "./map-feature.js";

export interface MapRenderer<P> {
	container: HTMLElement | null;
	collection?: MapFeatureCollection<P>;
	geoProjection?: GeoProjection;
	pathGenerator?: GeoPath<unknown, GeoPermissibleObjects>;
	zoomBehavior?: ZoomBehavior<SVGSVGElement, unknown>;
	svgElement?: SVGSVGElement;
	resizeObserver?: ResizeObserver;
}
