import type { GeoPath, GeoPermissibleObjects, Selection } from "d3";
import type { MultiLineString } from "geojson";
import * as topojson from "topojson-client";
import type { GeometryCollection, GeometryObject, Topology } from "topojson-specification";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { BorderStyleOptions } from "../types/options/border.options.js";
import { applyStyle } from "./apply-style.js";

// Every border lives in this one path, drawn over the features. Feature paths carry
// `FEATURE_CLASS` so the selections that style them never pick it up.
export const FEATURE_CLASS = "cartis-feature";
export const BORDERS_CLASS = "cartis-borders";

/**
 * Why a separate layer at all: a stroke on each feature's own path draws every shared border
 * twice, once per neighbour, while the coast and the land frontier are drawn once. With a
 * translucent stroke the doubled line comes out visibly darker (two alphas compound), and the
 * later neighbour's fill covers half of the earlier one's stroke, so it looks thicker and
 * off-centre too. A TopoJSON mesh holds each arc exactly once, so every border looks the same.
 */
export function appendBorders(
	g: Selection<SVGGElement, unknown, null, undefined>,
	pathGenerator: GeoPath<unknown, GeoPermissibleObjects>,
	mesh: MultiLineString,
) {
	return g
		.append("path")
		.datum(mesh)
		.attr("class", BORDERS_CLASS)
		.attr("d", pathGenerator)
		.attr("fill", "none")
		.attr("stroke", DEFAULT_MAP_STYLES.strokeColor)
		.attr("stroke-width", 0)
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.style("pointer-events", "none");
}

/**
 * The borders of every feature `isIncluded` accepts: the ones it shares with any neighbour
 * (included or not, so a selection keeps its outline) plus its coast and land frontier.
 * No predicate means every border on the map.
 */
export function buildMesh<P extends { [name: string]: unknown }>(
	topology: Topology,
	object: GeometryCollection<P>,
	isIncluded?: (properties: P) => boolean,
): MultiLineString {
	// topojson-client types every geometry with `{}` properties, so the filter's arguments are
	// narrowed back to `P` here: they are geometries of `object`, which is a collection of `P`.
	const collection = object as GeometryObject;
	if (!isIncluded) return topojson.mesh(topology, collection);

	const included = (geometry: GeometryObject) => {
		const { properties } = geometry as { properties?: P };
		return properties !== undefined && isIncluded(properties);
	};
	return topojson.mesh(topology, collection, (a, b) => included(a) || included(b));
}

/**
 * Restyles the borders layer, animated over `duration` like every other `style*` call. Omitting
 * `options` hides the borders again (the default `strokeWidth` is `0`).
 */
export function styleBordersPath(
	borders: Selection<SVGPathElement, unknown, null, undefined>,
	pathGenerator: GeoPath<unknown, GeoPermissibleObjects> | undefined,
	mesh: MultiLineString,
	duration: number,
	options?: BorderStyleOptions,
) {
	const bound = borders.datum(mesh);
	if (pathGenerator) bound.attr("d", pathGenerator);

	const style: BorderStyleOptions = options ?? {
		strokeColor: DEFAULT_MAP_STYLES.strokeColor,
		strokeWidth: DEFAULT_MAP_STYLES.strokeWidth,
	};
	applyStyle(bound, duration, { strokeColor: style.strokeColor, strokeWidth: style.strokeWidth });
}
