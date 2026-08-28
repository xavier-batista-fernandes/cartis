import * as d3 from "d3";
import * as topojson from "topojson-client";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import type { MunicipalityInteractionEvent } from "../types/events/municipality-interaction-event.js";
import type { ZoomChangeEvent } from "../types/events/zoom-change-event.js";
import type { MapRenderer } from "../types/map/map-renderer.js";
import type { MapState } from "../types/map/map-state.js";
import type { Municipality } from "../types/municipality.js";
import type { FitOptions } from "../types/options/fit.options.js";
import type { MapOptions } from "../types/options/map.options.js";
import type { StyleOptions } from "../types/options/style.options.js";
import { Status } from "../types/status.js";
import { getTopology } from "./utils.js";

// How long to wait after the container stops resizing before reprojecting. A resize (e.g. a
// sidebar collapsing) can fire many ResizeObserver callbacks in a row while it's animating —
// reprojecting on every one of them means re-running the projection and rewriting every path's
// `d` attribute on every frame, which is expensive enough (hundreds of paths) to visibly drag
// down the CSS transition driving the resize itself. Debouncing to fire once, shortly after the
// container settles, keeps that cost to a single pass instead of one per frame.
const RESIZE_DEBOUNCE_MS = 150;

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
	private resizeDebounceHandle?: number;
	private lastReprojectSize?: { width: number; height: number };
	private hoverHandler?: (event: MunicipalityInteractionEvent) => void;
	private leaveHandler?: () => void;
	private clickHandler?: (event: MunicipalityInteractionEvent) => void;
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

		const container = this.mapRenderer.container;

		console.log(`Initializing map for ${this.mapState.country}...`);
		console.log("Using options:", this.mapOptions);

		// Convert topology to a usable format and render.
		const topology: any = await getTopology(this.mapState.country);
		this.mapRenderer.collection = topojson.feature(topology, topology.objects.municipalities);

		// Render the map.
		const { width, height } = this.mapRenderer.container.getBoundingClientRect();
		const pathGenerator = this.reproject(width, height);

		// Append data to the map
		const svg = d3
			.select(this.mapRenderer.container)
			.append("svg")
			.attr("height", "100%")
			.attr("width", "100%")
			.style("display", "block");

		this.mapRenderer.svgElement = svg.node() ?? undefined;

		const g = svg.append("g");

		/* Creating a zoom behavior. It stays wired to `.on("zoom", ...)` below and reachable via
		 * zoomIn()/zoomOut()/fitTo*() either way — those call the behavior's imperative setters
		 * (`.transform`/`.scaleBy`), which fire that handler directly and don't depend on the
		 * interactive listeners `svg.call()` attaches. Skipping that `.call()` when zoom is
		 * disabled removes only the pointer/wheel/touch listeners, leaving the programmatic API
		 * intact — so a "fixed" map can still be recentered by a caller, just never by the user. */
		this.mapRenderer.zoomBehavior = d3.zoom();
		if (this.mapOptions.zoom?.enabled !== false) {
			svg.call(this.mapRenderer.zoomBehavior);
		}

		/* Zoom events are detected at the svg level, and its handler applies the transform to the g element */
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

		// Bind every feature (municipality) to a path element
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

		// A read-only map (no handlers ever registered) skips both the cursor and the listeners —
		// a pointer cursor with nothing behind it just implies clickability that isn't there.
		if (interactive) {
			boundPaths
				.style("cursor", "pointer")
				.on("mousemove", (event: MouseEvent, datum: any) => {
					if (!this.hoverHandler) return;
					const [x, y] = d3.pointer(event, container);
					this.hoverHandler({ municipality: datum.properties.NAME_2, district: datum.properties.NAME_1, x, y });
				})
				.on("mouseleave", () => this.leaveHandler?.())
				.on("click", (event: MouseEvent, datum: any) => {
					if (!this.clickHandler) return;
					const [x, y] = d3.pointer(event, container);
					this.clickHandler({ municipality: datum.properties.NAME_2, district: datum.properties.NAME_1, x, y });
				});
		}

		this.updateMapState({ status: Status.READY });

		this.mapRenderer.resizeObserver = new ResizeObserver((entries) => {
			window.clearTimeout(this.resizeDebounceHandle);
			this.resizeDebounceHandle = window.setTimeout(() => this.handleResize(entries[0]), RESIZE_DEBOUNCE_MS);
		});
		this.mapRenderer.resizeObserver.observe(this.mapRenderer.container);
	}

	/**
	 * Builds (or rebuilds) the projection and path generator for the given container size,
	 * leaving 5% padding on every side. Called once during initial render, and again on every
	 * container resize so paths can be redrawn against the current dimensions.
	 */
	private reproject(width: number, height: number) {
		// A container that's `display:none` at the moment this runs (e.g. a consumer that mounts
		// the map into a currently-hidden tab/panel) reports 0×0 here. `fitExtent` on a zero-area
		// box divides by zero internally, producing a NaN projection that then poisons every path's
		// `d` attribute and every later `fitTo*`/zoom transform. Clamping to a 1px floor keeps the
		// projection finite (degenerate, but harmless) until the container is actually shown, at
		// which point the existing resize-driven reproject in `handleResize` corrects it for real.
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

	/**
	 * Re-fits the map to a resized container: recomputes the projection and updates every
	 * existing path's `d` attribute in place, without touching `fill`/`stroke` — so any coloring
	 * applied via {@link CountryMap.styleMunicipalities}/{@link CountryMap.styleDistricts} survives
	 * a resize. Also updates the zoom's pan bounds and re-derives a zoom transform that keeps
	 * the same geographic point centered at the same zoom level under the new projection —
	 * *not* a reset to a full-country fit, which would otherwise clobber any pan/zoom a caller
	 * currently has active (e.g. a consumer's own {@link CountryMap.fitToMunicipalities} view).
	 */
	private handleResize(entry: ResizeObserverEntry) {
		if (!this.mapRenderer.container || !this.mapRenderer.zoomBehavior) return;

		const { width, height } = entry.contentRect;
		if (width === 0 || height === 0) return;

		const svg = d3.select(this.mapRenderer.container).select<SVGSVGElement>("svg");
		const svgNode = svg.node();

		// Capture what's currently centered on screen, and how zoomed in it is, *before*
		// reprojecting overwrites the old projection — expressed as a geographic coordinate and
		// a zoom multiplier (both independent of container size), not raw pixels, since pixels
		// are meaningless to preserve across a resize of the container itself.
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

		// Untransitioned, unlike fitToCountry() — a transitioned reset here would visually fight
		// with whatever CSS transition is still settling the container itself (e.g. a sidebar
		// collapsing) at the moment this debounced handler fires.
		svg.call(this.mapRenderer.zoomBehavior.transform, newTransform);
	}

	/**
	 * Tears down this map instance: removes the `<svg>` it rendered and releases its internal
	 * state. Only removes what this instance itself created, so it's always safe to call — even
	 * on an instance you're about to discard in favor of a newer one sharing the same container
	 * (e.g. React StrictMode remounting a component). Calling any other method afterwards is a
	 * no-op (with a console warning) rather than a throw.
	 */
	destroy() {
		this.mapRenderer.resizeObserver?.disconnect();
		window.clearTimeout(this.resizeDebounceHandle);

		// Remove only the DOM this instance itself created — never the whole container.
		// A stale instance racing a newer one (e.g. two overlapping create() calls sharing
		// a container) must be able to self-cleanup without touching the other's live map.
		this.mapRenderer.svgElement?.remove();
		this.mapRenderer = { container: this.mapRenderer.container };

		this.updateMapState({ status: Status.DESTROYED });
	}

	/**
	 * Registers a handler called continuously while the pointer moves over any municipality,
	 * with the resolved municipality/district and the pointer's position relative to the map's
	 * container (handy for positioning a tooltip). Only one handler is active at a time — a new
	 * registration replaces the previous one, matching D3's own un-namespaced `.on()` semantics.
	 *
	 * @returns An unsubscribe function. Calling it only clears the handler if it's still the one
	 *   most recently registered, so an unsubscribe from a stale registration can't clobber a
	 *   newer one.
	 */
	public onMunicipalityHover(handler: (event: MunicipalityInteractionEvent) => void): () => void {
		this.hoverHandler = handler;
		return () => {
			if (this.hoverHandler === handler) this.hoverHandler = undefined;
		};
	}

	/**
	 * Registers a handler called when the pointer leaves a municipality (and isn't over another
	 * one). Pairs with {@link CountryMap.onMunicipalityHover} — e.g. to hide a tooltip. Same
	 * single-active-handler and unsubscribe semantics as `onMunicipalityHover`.
	 */
	public onMunicipalityLeave(handler: () => void): () => void {
		this.leaveHandler = handler;
		return () => {
			if (this.leaveHandler === handler) this.leaveHandler = undefined;
		};
	}

	/**
	 * Registers a handler called when a municipality is clicked (or tapped, on touch devices),
	 * with the same event shape as {@link CountryMap.onMunicipalityHover}. Same
	 * single-active-handler and unsubscribe semantics as `onMunicipalityHover`.
	 */
	public onMunicipalityClick(handler: (event: MunicipalityInteractionEvent) => void): () => void {
		this.clickHandler = handler;
		return () => {
			if (this.clickHandler === handler) this.clickHandler = undefined;
		};
	}

	/**
	 * Registers a handler called whenever the map's zoom/pan transform changes — from user
	 * interaction (wheel, drag, pinch) as well as `zoomIn`/`zoomOut`/`fitTo*`/`fitToCountry`, since
	 * all of them drive the same underlying transform. Fires once synchronously on registration
	 * with the current transform, so a consumer building UI state (e.g. a "reset view" button that
	 * should only show once the view has moved) doesn't have to wait for the first change to know
	 * where things stand. Same single-active-handler and unsubscribe semantics as
	 * {@link CountryMap.onMunicipalityHover}.
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

		// `!== undefined`, not truthy checks: `strokeWidth: 0` (documented as how to hide borders)
		// and `fill`/`strokeColor: ""` are legitimate values a truthy check silently drops.
		if (options?.fill !== undefined) targets.attr("fill", options.fill);
		if (options?.strokeColor !== undefined) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth !== undefined) targets.attr("stroke-width", options.strokeWidth);
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

		if (options?.fill !== undefined) targets.attr("fill", options.fill);
		if (options?.strokeColor !== undefined) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth !== undefined) targets.attr("stroke-width", options.strokeWidth);
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

		const { width, height } = this.mapRenderer.container.getBoundingClientRect();
		if (width === 0 || height === 0) {
			// `display:none` (or not yet laid out) — nothing to fit into. Skipping rather than
			// computing against a zero-size box, which would otherwise collapse the resulting
			// transform to scale 0 for no visible reason.
			return;
		}

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
