import * as d3 from "d3";
import * as topojson from "topojson-client";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import type { DistrictInteractionEvent } from "../types/events/district-interaction-event.js";
import type { ZoomChangeEvent } from "../types/events/zoom-change-event.js";
import type { MapRenderer } from "../types/map/map-renderer.js";
import type { MapState } from "../types/map/map-state.js";
import type { FitOptions } from "../types/options/fit.options.js";
import type { MapOptions } from "../types/options/map.options.js";
import type { StyleOptions } from "../types/options/style.options.js";
import { Status } from "../types/status.js";
import { getDistrictTopology } from "./utils.js";

// Same rationale as `CountryMap`'s constant of the same name — see there.
const RESIZE_DEBOUNCE_MS = 150;

/**
 * Renders an interactive, zoomable SVG map of a country's **districts** — real district boundary
 * polygons, not municipality paths grouped by district (that's what {@link CountryMap.styleDistricts}
 * does, for lack of this data). Otherwise mirrors {@link CountryMap}'s shape and lifecycle closely:
 * same private-constructor-plus-`create()` pattern, same pan/zoom/fit/style vocabulary, one
 * difference being the unit of everything is a district instead of a municipality.
 *
 * There is no public constructor — build an instance with {@link DistrictMap.create}, which
 * resolves only once the map has finished rendering.
 *
 * Only {@link Country.PORTUGAL} is currently supported.
 */
export class DistrictMap {
	private mapOptions: MapOptions;
	private mapState: MapState;
	private mapRenderer: MapRenderer;
	private resizeDebounceHandle?: number;
	private lastReprojectSize?: { width: number; height: number };
	private hoverHandler?: (event: DistrictInteractionEvent) => void;
	private leaveHandler?: () => void;
	private clickHandler?: (event: DistrictInteractionEvent) => void;
	private zoomChangeHandler?: (event: ZoomChangeEvent) => void;

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
	 * Builds and renders a map into `container`, resolving only once it's fully usable. See
	 * {@link CountryMap.create} — same contract, same `container` sizing requirement.
	 *
	 * @example
	 * ```ts
	 * const map = await DistrictMap.create(Country.PORTUGAL, containerEl);
	 * map.styleDistricts(["Lisboa"], { fill: "#86c227" });
	 * // ...later, e.g. on unmount:
	 * map.destroy();
	 * ```
	 */
	static async create(
		country: Country,
		container: HTMLElement,
		options: MapOptions = { style: DEFAULT_MAP_STYLES },
	): Promise<DistrictMap> {
		const instance = new DistrictMap(country, container, options);
		await instance.render();
		return instance;
	}

	private async render() {
		this.updateMapState({ status: Status.RENDERING });

		if (!this.mapRenderer.container) {
			this.updateMapState({ status: Status.ERROR });
			throw new Error("Cannot render the map: the provided container element is not accessible.");
		}

		const container = this.mapRenderer.container;

		const topology: any = await getDistrictTopology(this.mapState.country);
		this.mapRenderer.collection = topojson.feature(topology, topology.objects.districts);

		const { width, height } = this.mapRenderer.container.getBoundingClientRect();
		const pathGenerator = this.reproject(width, height);

		const svg = d3
			.select(this.mapRenderer.container)
			.append("svg")
			.attr("height", "100%")
			.attr("width", "100%")
			.style("display", "block");

		this.mapRenderer.svgElement = svg.node() ?? undefined;

		const g = svg.append("g");

		this.mapRenderer.zoomBehavior = d3.zoom();
		if (this.mapOptions.zoom?.enabled !== false) {
			svg.call(this.mapRenderer.zoomBehavior);
		}

		this.mapRenderer.zoomBehavior.scaleExtent([1, 10]);
		this.mapRenderer.zoomBehavior.translateExtent([
			[0, 0],
			[width, height],
		]);
		this.mapRenderer.zoomBehavior.on("zoom", ({ transform }) => {
			g.attr("transform", transform);
			this.zoomChangeHandler?.({
				scale: transform.k,
				isDefaultView: transform.k === 1 && transform.x === 0 && transform.y === 0,
			});
		});

		// Bind every feature (district) to a path element
		const styles = this.mapOptions.style ?? {};
		const interactive = this.mapOptions.interactive !== false;
		const paths = g.selectAll("path");
		const boundPaths = paths
			.data(this.mapRenderer.collection.features)
			.enter()
			.append("path")
			.attr("d", pathGenerator)
			.attr("fill", styles.fill ?? DEFAULT_MAP_STYLES.fill)
			.attr("stroke", styles.strokeColor ?? DEFAULT_MAP_STYLES.strokeColor)
			.attr("stroke-width", styles.strokeWidth ?? DEFAULT_MAP_STYLES.strokeWidth);

		if (interactive) {
			boundPaths
				.style("cursor", "pointer")
				.on("mousemove", (event: MouseEvent, datum: any) => {
					if (!this.hoverHandler) return;
					const [x, y] = d3.pointer(event, container);
					this.hoverHandler({ district: datum.properties.dis_name, x, y });
				})
				.on("mouseleave", () => this.leaveHandler?.())
				.on("click", (event: MouseEvent, datum: any) => {
					if (!this.clickHandler) return;
					const [x, y] = d3.pointer(event, container);
					this.clickHandler({ district: datum.properties.dis_name, x, y });
				});
		}

		this.updateMapState({ status: Status.READY });

		this.mapRenderer.resizeObserver = new ResizeObserver((entries) => {
			window.clearTimeout(this.resizeDebounceHandle);
			this.resizeDebounceHandle = window.setTimeout(() => this.handleResize(entries[0]), RESIZE_DEBOUNCE_MS);
		});
		this.mapRenderer.resizeObserver.observe(this.mapRenderer.container);
	}

	// Identical to `CountryMap.reproject` — see there for the padding/degenerate-size rationale.
	private reproject(width: number, height: number) {
		const safeWidth = Math.max(width, 1);
		const safeHeight = Math.max(height, 1);

		this.mapRenderer.geoProjection = d3.geoMercator().fitExtent(
			[
				[safeWidth * 0.05, safeHeight * 0.05],
				[safeWidth * 0.95, safeHeight * 0.95],
			],
			this.mapRenderer.collection,
		);

		this.mapRenderer.pathGenerator = d3.geoPath().projection(this.mapRenderer.geoProjection).digits(3);
		this.lastReprojectSize = { width: safeWidth, height: safeHeight };
		return this.mapRenderer.pathGenerator;
	}

	// Identical to `CountryMap.handleResize` — see there for the centered-point-preservation rationale.
	private handleResize(entry: ResizeObserverEntry) {
		if (!this.mapRenderer.container || !this.mapRenderer.zoomBehavior) return;

		const { width, height } = entry.contentRect;
		if (width === 0 || height === 0) return;

		const svg = d3.select(this.mapRenderer.container).select<SVGSVGElement>("svg");
		const svgNode = svg.node();

		const oldProjection = this.mapRenderer.geoProjection;
		const lastSize = this.lastReprojectSize;
		let centerGeo: [number, number] | null = null;
		let zoomK = 1;
		if (svgNode && oldProjection?.invert && lastSize) {
			const oldTransform = d3.zoomTransform(svgNode);
			const oldCenterPixel = oldTransform.invert([lastSize.width / 2, lastSize.height / 2]);
			centerGeo = oldProjection.invert(oldCenterPixel);
			zoomK = oldTransform.k;
		}

		const pathGenerator = this.reproject(width, height);
		svg.select("g").selectAll("path").attr("d", pathGenerator);

		this.mapRenderer.zoomBehavior.translateExtent([
			[0, 0],
			[width, height],
		]);

		let newTransform = d3.zoomIdentity;
		const newProjection = this.mapRenderer.geoProjection;
		const newCenterPixel = newProjection && centerGeo ? newProjection(centerGeo) : null;
		if (newCenterPixel) {
			newTransform = d3.zoomIdentity
				.translate(width / 2 - zoomK * newCenterPixel[0], height / 2 - zoomK * newCenterPixel[1])
				.scale(zoomK);
		}

		svg.call(this.mapRenderer.zoomBehavior.transform, newTransform);
	}

	/**
	 * Tears down this map instance: removes the `<svg>` it rendered and releases its internal
	 * state. Same safety contract as {@link CountryMap.destroy}.
	 */
	destroy() {
		this.mapRenderer.resizeObserver?.disconnect();
		window.clearTimeout(this.resizeDebounceHandle);

		this.mapRenderer.svgElement?.remove();
		this.mapRenderer = { container: this.mapRenderer.container };

		this.updateMapState({ status: Status.DESTROYED });
	}

	/**
	 * Registers a handler called continuously while the pointer moves over any district, with the
	 * resolved district and the pointer's position relative to the map's container. Same
	 * single-active-handler and unsubscribe semantics as {@link CountryMap.onMunicipalityHover}.
	 */
	public onDistrictHover(handler: (event: DistrictInteractionEvent) => void): () => void {
		this.hoverHandler = handler;
		return () => {
			if (this.hoverHandler === handler) this.hoverHandler = undefined;
		};
	}

	/**
	 * Registers a handler called when the pointer leaves a district (and isn't over another one).
	 * Pairs with {@link DistrictMap.onDistrictHover}.
	 */
	public onDistrictLeave(handler: () => void): () => void {
		this.leaveHandler = handler;
		return () => {
			if (this.leaveHandler === handler) this.leaveHandler = undefined;
		};
	}

	/**
	 * Registers a handler called when a district is clicked (or tapped), with the same event shape
	 * as {@link DistrictMap.onDistrictHover}.
	 */
	public onDistrictClick(handler: (event: DistrictInteractionEvent) => void): () => void {
		this.clickHandler = handler;
		return () => {
			if (this.clickHandler === handler) this.clickHandler = undefined;
		};
	}

	/**
	 * Registers a handler called whenever the map's zoom/pan transform changes. Fires once
	 * synchronously on registration. Same semantics as {@link CountryMap.onZoomChange}.
	 */
	public onZoomChange(handler: (event: ZoomChangeEvent) => void): () => void {
		this.zoomChangeHandler = handler;

		const svg = this.mapRenderer.container && d3.select(this.mapRenderer.container).select<SVGSVGElement>("svg").node();
		const transform = svg ? d3.zoomTransform(svg) : d3.zoomIdentity;
		handler({ scale: transform.k, isDefaultView: transform.k === 1 && transform.x === 0 && transform.y === 0 });

		return () => {
			if (this.zoomChangeHandler === handler) this.zoomChangeHandler = undefined;
		};
	}

	/**
	 * Colors every district in `districts` with the same style, animated over
	 * `mapOptions.style.duration` (default 300ms). Unlike {@link CountryMap.styleDistricts}, this
	 * styles the district's own polygon directly — one path per district, not its constituent
	 * municipality paths — so `strokeWidth` draws a true district boundary.
	 *
	 * @param districts - District names to style. Unmatched names are silently ignored.
	 * @param options - Fill/stroke to apply. **Omit entirely to reset the matched districts back
	 *   to the default style** — passing `{}` does nothing, since each field is applied only if
	 *   present.
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

		if (options?.fill !== undefined) targets.attr("fill", options.fill);
		if (options?.strokeColor !== undefined) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth !== undefined) targets.attr("stroke-width", options.strokeWidth);
	}

	/**
	 * Resets the zoom/pan to show the whole country, animated. Same contract as
	 * {@link CountryMap.fitToCountry}.
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
	 * Zooms/pans to frame the union of the given districts' bounds, animated. Pass a single name to
	 * jump to just that one district. Same `options` contract as {@link CountryMap.fitToMunicipalities}.
	 */
	public fitToDistricts(districts: District[], options: FitOptions = {}) {
		if (districts.length === 0) {
			console.warn("fitToDistricts requires at least one district.");
			return;
		}

		if (!this.mapRenderer.container || !this.mapRenderer.pathGenerator || !this.mapRenderer.zoomBehavior) {
			console.warn("Fitting is not possible because the map has not finished rendering.");
			return;
		}

		const features = this.selectDistricts(districts).data();
		if (features.length === 0) {
			console.warn("Fitting is not possible because no matching features were found.");
			return;
		}

		const { width, height } = this.mapRenderer.container.getBoundingClientRect();
		if (width === 0 || height === 0) return;

		const collection = { type: "FeatureCollection", features };
		const [[x0, y0], [x1, y1]] = this.mapRenderer.pathGenerator.bounds(collection as any);

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

	private selectDistricts(districts: District[]) {
		const svg = d3.select(this.mapRenderer.container).select("svg");
		const g = svg.select("g");
		return g.selectAll("path").filter((datum: any) => districts.includes(datum.properties.dis_name));
	}

	private updateMapState(updates: Partial<MapState>) {
		this.mapState = { ...this.mapState, ...updates };
	}
}
