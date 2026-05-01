import * as d3 from "d3";
import * as topojson from "topojson-client";
import { DEFAULT_MAP_STYLES } from "../constants/map-styles.default.js";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import type { MapRenderer } from "../types/map/map-renderer.js";
import type { MapState } from "../types/map/map-state.js";
import type { Municipality } from "../types/municipality.js";
import type { JumpOptions } from "../types/options/jump.options.js";
import type { MapOptions } from "../types/options/map.options.js";
import type { StyleOptions } from "../types/options/style.options.js";
import { Status } from "../types/status.js";
import { getTopology } from "./utils.js";

export class CountryMap {
	private mapOptions: MapOptions;
	private mapState: MapState;
	private mapRenderer: MapRenderer;

	constructor(country: Country, container: HTMLElement, options: MapOptions = { style: DEFAULT_MAP_STYLES }) {
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

		this.render();
	}

	async render() {
		// Start rendering.
		this.updateMapState({ status: Status.RENDERING });

		// Check if map exists.
		// Set status to error in case the map container is not accessible.
		if (!this.mapRenderer.container) {
			console.warn("Map initialization is not possible because the map container is not defined.");
			this.updateMapState({ status: Status.ERROR });
			return;
		}

		console.log(`Initializing map for ${this.mapState.country}...`);
		console.log("Using options:", this.mapOptions);

		// Clear any existing content.
		// Avoids having more than one map.
		this.clearScene();

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

	destroy() {
		this.clearRenderer();
		this.clearScene();

		this.updateMapState({ status: Status.DESTROYED });
	}

	private clearRenderer() {
		this.mapRenderer = { container: this.mapRenderer.container };
	}

	private clearScene() {
		d3.select(this.mapRenderer.container).selectAll("*").remove();
	}

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

	public styleDistricts(districts: District[], options?: StyleOptions) {
		const targets = this.selectDistricts(districts)
			.transition()
			.duration(this.mapOptions.style?.duration ?? 300);

		if (options?.fill) targets.attr("fill", options.fill);
		if (options?.strokeColor) targets.attr("stroke", options.strokeColor);
		if (options?.strokeWidth) targets.attr("stroke-width", options.strokeWidth);
	}

	public jumpToMunicipality(municipality: Municipality, options: JumpOptions = {}) {
		if (!this.mapRenderer.container) {
			console.warn("Jumping to municipality is not possible because the map container is not initialized.");
			return;
		}

		const target = this.selectMunicipalities([municipality]);
		const [[x0, y0], [x1, y1]] = this.mapRenderer.pathGenerator.bounds(target.datum());

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

	public zoomIn() {
		if (!this.mapRenderer.container) return;
		if (!this.mapRenderer.zoomBehavior) return;

		const svg = d3.select(this.mapRenderer.container).select("svg");
		svg.transition().duration(200).call(this.mapRenderer.zoomBehavior.scaleBy, 1.25);
	}

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
