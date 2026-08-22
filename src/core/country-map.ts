import * as d3 from "d3";
import * as topojson from "topojson-client";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import type { MapRenderer } from "../types/map/map-renderer.js";
import type { MapState } from "../types/map/map-state.js";
import type { Municipality } from "../types/municipality.js";
import type { FitOptions } from "../types/options/fit.options.js";
import type { MapOptions } from "../types/options/map.options.js";
import type { StyleOptions } from "../types/options/style.options.js";
import { Status } from "../types/status.js";
import { getTopology } from "./utils.js";

/**
 * Renders an interactive, zoomable SVG map of a country's municipalities using D3 and TopoJSON.
 *
 * There is no public constructor — build an instance with {@link CountryMap.create}, which
 * resolves only once the map has finished rendering. Every method below assumes the instance
 * came from `create()` and is safe to call as soon as you have a reference to it.
 *
 * Only {@link Country.PORTUGAL} is currently supported.
 */
export class CountryMap {
	private mapOptions: MapOptions;
	private mapState: MapState;
	private mapRenderer: MapRenderer;

	private constructor(country: Country, container: HTMLElement, options: MapOptions = { style: DEFAULT_MAP_STYLES }) {
		this.mapState = { status: Status.IDLE, country };
		this.mapRenderer = {
			container: container,
		};
		this.mapOptions = {
			...options,
			style: {
				duration: options.style?.duration ?? DEFAULT_MAP_STYLES.duration,
				strokeColor: options.style?.strokeColor ?? DEFAULT_MAP_STYLES.strokeColor,
				strokeWidth: options.style?.strokeWidth ?? DEFAULT_MAP_STYLES.strokeWidth,
				fill: options.style?.fill ?? DEFAULT_MAP_STYLES.fill,
			},
		};
	}

	/**
	 * Builds and renders a map into `container`, resolving only once it's fully usable.
	 * There is no other way to obtain a `CountryMap` — this keeps "constructed" and "ready
	 * to call methods on" the same moment, so callers never hold a half-built instance.
	 *
	 * `container` must already have a non-zero size (e.g. via CSS) when this is called — the
	 * initial projection and zoom bounds are computed once, synchronously, from its bounding rect.
	 *
	 * @param country - Which country's topology to load. Only {@link Country.PORTUGAL} works today.
	 * @param container - The element the map's `<svg>` will be appended into. cartis owns this
	 *   element's contents from here on — don't render anything else inside it yourself.
	 * @param options - Initial styling for municipality paths. See {@link MapOptions}.
	 * @returns A promise that resolves with a fully-rendered `CountryMap`, or rejects if
	 *   `container` isn't a usable element.
	 *
	 * @example
	 * ```ts
	 * const map = await CountryMap.create(Country.PORTUGAL, containerEl);
	 * map.styleMunicipalities(["Sintra"], { fill: "#86c227" });
	 * // ...later, e.g. on unmount:
	 * map.destroy();
	 * ```
	 */
	static async create(
		country: Country,
		container: HTMLElement,
		options: MapOptions = { style: DEFAULT_MAP_STYLES },
	): Promise<CountryMap> {
		const instance = new CountryMap(country, container, options);
		await instance.render();
		return instance;
	}

	private async render() {
		// Start rendering.
		this.updateMapState({ status: Status.RENDERING });

		// Check if map exists.
		// Set status to error in case the map container is not accessible.
		if (!this.mapRenderer.container) {
			this.updateMapState({ status: Status.ERROR });
			throw new Error("Cannot render the map: the provided container element is not accessible.");
		}

		console.log(`Initializing map for ${this.mapState.country}...`);
		console.log("Using options:", this.mapOptions);

		// Convert topology to a usable format and render.
		const topology: any = await getTopology(this.mapState.country);
		this.mapRenderer.collection = topojson.feature(topology, topology.objects.municipalities);

		// Render the map.
		const { width, height } = this.mapRenderer.container.getBoundingClientRect();

		// Create a projection that leaves 5% padding on every side
		this.mapRenderer.geoProjection = d3.geoMercator().fitExtent(
			[
				[width * 0.05, height * 0.05],
				[width * 0.95, height * 0.95],
			],
			this.mapRenderer.collection,
		);

		// Create a path generator using the projection
		this.mapRenderer.pathGenerator = d3.geoPath().projection(this.mapRenderer.geoProjection).digits(3);

		// Append data to the map
		const svg = d3
			.select(this.mapRenderer.container)
			.append("svg")
			.attr("height", "100%")
			.attr("width", "100%")
			.style("display", "block");

		this.mapRenderer.svgElement = svg.node() ?? undefined;

		const g = svg.append("g");

		/* Creating a zoom behavior and attaching it to the svg */
		this.mapRenderer.zoomBehavior = d3.zoom();
		svg.call(this.mapRenderer.zoomBehavior);

		/* Zoom events are detected at the svg level, and its handler applies the transform to the g element */
		this.mapRenderer.zoomBehavior.scaleExtent([1, 10]);
		this.mapRenderer.zoomBehavior.translateExtent([
			[0, 0],
			[width, height],
		]);
		this.mapRenderer.zoomBehavior.on("zoom", ({ transform }) => {
			g.attr("transform", transform);
		});

		// Bind every feature (municipality) to a path element
		const styles = this.mapOptions.style ?? {};
		const paths = g.selectAll("path");
		paths
			.data(this.mapRenderer.collection.features)
			.enter()
			.append("path")
			.attr("d", this.mapRenderer.pathGenerator)
			.attr("fill", styles.fill ?? DEFAULT_MAP_STYLES.fill)
			.attr("stroke", styles.strokeColor ?? DEFAULT_MAP_STYLES.strokeColor)
			.attr("stroke-width", styles.strokeWidth ?? DEFAULT_MAP_STYLES.strokeWidth)
			.on("mouseenter", (item) => console.log(item.target.__data__.properties.NAME_2));

		this.updateMapState({ status: Status.READY });
	}

	/**
	 * Tears down this map instance: removes the `<svg>` it rendered and releases its internal
	 * state. Only removes what this instance itself created, so it's always safe to call — even
	 * on an instance you're about to discard in favor of a newer one sharing the same container
	 * (e.g. React StrictMode remounting a component). Calling any other method afterwards is a
	 * no-op (with a console warning) rather than a throw.
	 */
	destroy() {
		// Remove only the DOM this instance itself created — never the whole container.
		// A stale instance racing a newer one (e.g. two overlapping create() calls sharing
		// a container) must be able to self-cleanup without touching the other's live map.
		this.mapRenderer.svgElement?.remove();
		this.mapRenderer = { container: this.mapRenderer.container };

		this.updateMapState({ status: Status.DESTROYED });
	}

	/**
	 * Colors every municipality in `municipalities` with the same style, animated over
	 * `mapOptions.style.duration` (default 300ms, set via {@link CountryMap.create}'s `options`).
	 * Municipalities not in the list are left untouched.
	 *
	 * @param municipalities - Municipality names to style. Unmatched names are silently ignored.
	 * @param options - Fill/stroke to apply. **Omit entirely to reset the matched municipalities
	 *   back to the default style** — passing `{}` does nothing, since each field is applied only
	 *   if present.
	 */
	public styleMunicipalities(municipalities: Municipality[], options?: StyleOptions) {
		const targets = this.selectMunicipalities(municipalities)
			.transition()
			.duration(this.mapOptions.style?.duration ?? 300);

		if (!options) {
			targets.attr("fill", DEFAULT_MAP_STYLES.fill);
			targets.attr("stroke", DEFAULT_MAP_STYLES.strokeColor);
			targets.attr("stroke-width", DEFAULT_MAP_STYLES.strokeWidth);
		}

		if (options?.fill) targets.attr("fill", options.fill);
		if (options?.strokeColor) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth) targets.attr("stroke-width", options.strokeWidth);
	}

	/**
	 * Colors every municipality belonging to any district in `districts` with the same style.
	 * cartis has no separate district-boundary topology — this works by matching each
	 * municipality's district against your list, so what you see is municipality borders, not
	 * true district polygons (set `strokeWidth: 0` if you want same-district municipalities to
	 * visually blend into one shape).
	 *
	 * @param districts - District names to style. Unmatched names are silently ignored.
	 * @param options - Fill/stroke to apply. Omit entirely to reset matched municipalities back
	 *   to the default style; `{}` does nothing (same caveat as {@link CountryMap.styleMunicipalities}).
	 */
	public styleDistricts(districts: District[], options?: StyleOptions) {
		const targets = this.selectDistricts(districts)
			.transition()
			.duration(this.mapOptions.style?.duration ?? 300);

		if (!options) {
			targets.attr("fill", DEFAULT_MAP_STYLES.fill);
			targets.attr("stroke", DEFAULT_MAP_STYLES.strokeColor);
			targets.attr("stroke-width", DEFAULT_MAP_STYLES.strokeWidth);
		}

		if (options?.fill) targets.attr("fill", options.fill);
		if (options?.strokeColor) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth) targets.attr("stroke-width", options.strokeWidth);
	}

	/**
	 * Resets the zoom/pan to show the whole country, animated. The only way to get back to the
	 * initial full-country view — {@link CountryMap.fitToMunicipalities} and
	 * {@link CountryMap.fitToDistricts} require at least one match and won't do this for you.
	 *
	 * @param options.duration - Transition duration in ms (default 1000).
	 */
	public fitToCountry(options: Pick<FitOptions, "duration"> = {}) {
		if (!this.mapRenderer.container || !this.mapRenderer.zoomBehavior) {
			console.warn("Fitting to country is not possible because the map has not finished rendering.");
			return;
		}

		const svg = d3.select(this.mapRenderer.container).select("svg");
		svg
			.transition()
			.duration(options.duration ?? 1000)
			.call(this.mapRenderer.zoomBehavior.transform, d3.zoomIdentity);
	}

	/**
	 * Zooms/pans to frame the union of the given municipalities' bounds, animated. Pass a single
	 * name to jump to just that one municipality.
	 *
	 * @param municipalities - Municipality names to fit into view. Must be non-empty — an empty
	 *   array logs a warning and does nothing (it does **not** fall back to
	 *   {@link CountryMap.fitToCountry}).
	 * @param options.zoom - Extra scale multiplier on top of the computed tight fit (default 1).
	 *   Use `< 1` to zoom out further than a tight fit, e.g. `{ zoom: 0.35 }` for a wide establishing
	 *   shot around the target. The resulting scale is capped at 5x regardless of this multiplier.
	 * @param options.duration - Transition duration in ms (default 1000).
	 */
	public fitToMunicipalities(municipalities: Municipality[], options: FitOptions = {}) {
		if (municipalities.length === 0) {
			console.warn("fitToMunicipalities requires at least one municipality.");
			return;
		}

		this.fitToFeatures(this.selectMunicipalities(municipalities).data(), options);
	}

	/**
	 * Zooms/pans to frame the union of bounds of every municipality belonging to any district in
	 * `districts`, animated. Same underlying mechanism as {@link CountryMap.fitToMunicipalities} —
	 * see its `options` docs for `zoom`/`duration`.
	 *
	 * @param districts - District names to fit into view. Must be non-empty — an empty array logs
	 *   a warning and does nothing.
	 */
	public fitToDistricts(districts: District[], options: FitOptions = {}) {
		if (districts.length === 0) {
			console.warn("fitToDistricts requires at least one district.");
			return;
		}

		this.fitToFeatures(this.selectDistricts(districts).data(), options);
	}

	private fitToFeatures(features: any[], options: FitOptions) {
		if (!this.mapRenderer.container || !this.mapRenderer.pathGenerator || !this.mapRenderer.zoomBehavior) {
			console.warn("Fitting is not possible because the map has not finished rendering.");
			return;
		}

		if (features.length === 0) {
			console.warn("Fitting is not possible because no matching features were found.");
			return;
		}

		const collection = { type: "FeatureCollection", features };
		const [[x0, y0], [x1, y1]] = this.mapRenderer.pathGenerator.bounds(collection as any);

		const { width, height } = this.mapRenderer.container.getBoundingClientRect();
		const targetWidth = x1 - x0;
		const targetHeight = y1 - y0;
		const scale = Math.min(5, 0.5 / Math.max(targetWidth / width, targetHeight / height)) * (options.zoom ?? 1);

		const transform = d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(scale)
			.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);

		const svg = d3.select(this.mapRenderer.container).select("svg");
		svg
			.transition()
			.duration(options.duration ?? 1000)
			.call(this.mapRenderer.zoomBehavior.transform, transform);
	}

	/** Zooms in by a fixed 1.25x step, centered on the current view, over 200ms. Capped at 10x total. */
	public zoomIn() {
		if (!this.mapRenderer.container) return;
		if (!this.mapRenderer.zoomBehavior) return;

		const svg = d3.select(this.mapRenderer.container).select("svg");
		svg.transition().duration(200).call(this.mapRenderer.zoomBehavior.scaleBy, 1.25);
	}

	/** Zooms out by a fixed 0.75x step, centered on the current view, over 200ms. Capped at 1x (full country) total. */
	public zoomOut() {
		if (!this.mapRenderer.container) return;
		if (!this.mapRenderer.zoomBehavior) return;

		const svg = d3.select(this.mapRenderer.container).select("svg");
		svg.transition().duration(200).call(this.mapRenderer.zoomBehavior.scaleBy, 0.75);
	}

	private selectMunicipalities(municipalities: Municipality[]) {
		const svg = d3.select(this.mapRenderer.container).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumMunicipality = datum.properties.NAME_2;
			return municipalities.includes(datumMunicipality);
		});

		return target;
	}

	private selectDistricts(districts: District[]) {
		const svg = d3.select(this.mapRenderer.container).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumDistrict = datum.properties.NAME_1;
			return districts.includes(datumDistrict);
		});

		return target;
	}

	private updateMapState(updates: Partial<MapState>) {
		this.mapState = { ...this.mapState, ...updates };
	}
}
