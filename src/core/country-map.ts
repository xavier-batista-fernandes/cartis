import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import { type Municipality } from "../types/municipality.js";
import { JumpOptions } from "../types/options/jump.options.js";
import type { MapOptions } from "../types/options/map.options.js";
import type { StyleOptions } from "../types/options/style.options.js";
import { getTopology } from "./utils.js";

export class CountryMap {
	private country: Country;
	private mapContainer: HTMLElement | null = null;
	private mapOptions: MapOptions;

	private collection: any | null = null; // GeoJSON FeatureCollection
	private geoProjection: d3.GeoProjection | null = null;
	private pathGenerator: d3.GeoPath<any, any> | null = null;
	private zoomBehavior: d3.ZoomBehavior<any, any> | null = null;

	private readonly DEFAULT_MAP_STYLES = {
		duration: 300,
		strokeColor: "rgba(0, 0, 0, 0.5)",
		strokeWidth: 0,
		fill: "rgba(198, 198, 198, 0.25)",
	};
	constructor(
		country: Country,
		container: HTMLElement,
		options: MapOptions = { style: this.DEFAULT_MAP_STYLES },
	) {
		this.country = country;
		this.mapContainer = container;
		this.mapOptions = {
			...options,
			style: {
				duration: options.style?.duration ?? this.DEFAULT_MAP_STYLES.duration,
				strokeColor:
					options.style?.strokeColor ?? this.DEFAULT_MAP_STYLES.strokeColor,
				strokeWidth:
					options.style?.strokeWidth ?? this.DEFAULT_MAP_STYLES.strokeWidth,
				fill: options.style?.fill ?? this.DEFAULT_MAP_STYLES.fill,
			},
		};

		this.initMap();
	}

	private clearMap() {
		d3.select(this.mapContainer).selectAll("*").remove();
	}

	private async initMap() {
		if (!this.mapContainer) {
			console.warn(
				"Map initialization is not possible because the map container is not provided.",
			);
			return;
		}
		console.log(`Initializing map for ${this.country}...`);
		console.log("Using options:", this.mapOptions);

		// Start by clearing any existing content.
		this.clearMap();

		// Convert topology to a usable format and render.
		const topology: any = await getTopology(this.country);
		this.collection = topojson.feature(
			topology,
			topology.objects.municipalities,
		);

		// Render the map.
		const { width, height } = this.mapContainer.getBoundingClientRect();

		// Create a projection that leaves 5% padding on every side
		this.geoProjection = d3.geoMercator().fitExtent(
			[
				[width * 0.05, height * 0.05],
				[width * 0.95, height * 0.95],
			],
			this.collection,
		);

		// Create a path generator using the projection
		this.pathGenerator = d3.geoPath().projection(this.geoProjection).digits(3);

		// Append data to the map
		const svg = d3
			.select(this.mapContainer)
			.append("svg")
			.attr("height", "100%")
			.attr("width", "100%")
			.style("display", "block");

		const g = svg.append("g");

		/* Creating a zoom behavior and attaching it to the svg */
		this.zoomBehavior = d3.zoom();
		svg.call(this.zoomBehavior as any);

		/* Zoom events are detected at the svg level, and its handler applies the transform to the g element */
		this.zoomBehavior.scaleExtent([1, 10]);
		this.zoomBehavior.translateExtent([
			[0, 0],
			[width, height],
		]);
		this.zoomBehavior.on("zoom", ({ transform }) => {
			g.attr("transform", transform);
		});

		// Bind every feature (municipality) to a path element
		const styles = this.mapOptions.style ?? {};
		const paths = g.selectAll("path");
		paths
			.data(this.collection.features)
			.enter()
			.append("path")
			.attr("d", this.pathGenerator as any)

			.attr("fill", styles.fill)
			.attr("stroke", styles.strokeColor)
			.attr("stroke-width", styles.strokeWidth)

			.on("mouseenter", (item) =>
				console.log(item.target.__data__.properties.CC_2),
			);
	}

	public styleMunicipalities(
		municipalities: Municipality[],
		options?: StyleOptions,
	) {
		const targets = this.selectMunicipalities(municipalities)
			.transition()
			.duration(this.mapOptions.style?.duration ?? 300);

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

	public jumpToMunicipality(
		municipality: Municipality,
		options: JumpOptions = {},
	) {
		if (!this.mapContainer) {
			console.warn(
				"Jumping to municipality is not possible because the map container is not initialized.",
			);
			return;
		}

		const target = this.selectMunicipalities([municipality]);
		const [[x0, y0], [x1, y1]] = this.pathGenerator!.bounds(
			target.datum() as any,
		);

		const { width, height } = this.mapContainer.getBoundingClientRect();
		const targetWidth = x1 - x0;
		const targetHeight = y1 - y0;
		const scale =
			Math.min(5, 0.5 / Math.max(targetWidth / width, targetHeight / height)) *
			(options.zoom ?? 1);

		const transform = d3.zoomIdentity
			.translate(width / 2, height / 2)
			.scale(scale)
			.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);

		const svg = d3.select(this.mapContainer).select("svg");
		svg
			.transition()
			.duration(options.duration ?? 1000)
			.call(this.zoomBehavior!.transform as any, transform);
	}

	public zoomIn() {
		if (!this.mapContainer) return;
		if (!this.zoomBehavior) return;

		const svg = d3.select(this.mapContainer).select("svg");
		svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 1.25);
	}

	public zoomOut() {
		if (!this.mapContainer) return;
		if (!this.zoomBehavior) return;

		const svg = d3.select(this.mapContainer).select("svg");
		svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 0.75);
	}

	// public clearStyles() {
	// 	console.log("Clearing all styles from the map.");
	// }

	// public addEventListener(
	// 	municipalities: Municipality[],
	// 	eventType: string,
	// 	eventCallback: (event: Event) => void,
	// ) {
	// 	const targets = this.selectPaths(municipalities);
	// 	targets.on(eventType, (event) => {
	// 		eventCallback(event);
	// 	});
	// }

	private selectMunicipalities(municipalities: Municipality[]) {
		const svg = d3.select(this.mapContainer).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumMunicipality = datum.properties.NAME_2;
			return municipalities.includes(datumMunicipality);
		});

		return target;
	}

	private selectDistricts(districts: District[]) {
		const svg = d3.select(this.mapContainer).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumDistrict = datum.properties.NAME_1;
			return districts.includes(datumDistrict);
		});

		return target;
	}
}
