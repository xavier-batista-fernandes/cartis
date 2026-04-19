import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { MapOptions } from "../types/country-map-options.js";
import type { Country } from "../types/country.js";
import type { District } from "../types/district.js";
import { MUNICIPALITIES, type Municipality } from "../types/municipality.js";
import type { StyleOptions } from "../types/style-options.js";
import { getTopology } from "./utils.js";

export class CountryMap {
	private country: Country;
	private container: HTMLElement | null = null;
	private mapOptions: MapOptions;

	private collection: any | null = null; // GeoJSON FeatureCollection

	constructor(
		country: Country,
		container: HTMLElement,
		options: MapOptions = { style: { duration: 300 } },
	) {
		this.country = country;
		this.container = container;
		this.mapOptions = options;

		this.initMap();
	}

	private clearMap() {
		d3.select(this.container).selectAll("*").remove();
	}

	private async initMap() {
		// Start by clearing any existing content.
		console.log("Loading a new country.");
		this.clearMap();

		// Convert topology to a usable format and render.
		const topology: any = await getTopology(this.country);
		this.collection = topojson.feature(
			topology,
			topology.objects.municipalities,
		);
		console.log("Loaded features:", this.collection);
		console.log(">>> Municipalities:", MUNICIPALITIES);

		// Render the map.
		const { width, height } = this.container.getBoundingClientRect();

		// Create a projection that leaves 5% padding on every side
		const geoProjection = d3.geoMercator().fitExtent(
			[
				[width * 0.05, height * 0.05],
				[width * 0.95, height * 0.95],
			],
			this.collection,
		);

		// Create a path generator using the projection
		const pathGenerator = d3.geoPath().projection(geoProjection).digits(3);

		// Append data to the map
		const svg = d3
			.select(this.container)
			.append("svg")
			.attr("height", "100%")
			.attr("width", "100%")
			.style("display", "block");

		const g = svg.append("g");

		/* Creating a zoom behavior and attaching it to the svg */
		const zoomBehavior = d3.zoom();
		svg.call(zoomBehavior as any);

		/* Zoom events are detected at the svg level, and its handler applies the transform to the g element */
		zoomBehavior.scaleExtent([1, 10]);
		zoomBehavior.translateExtent([
			[0, 0],
			[width, height],
		]);
		zoomBehavior.on("zoom", ({ transform }) => {
			g.attr("transform", transform);
		});

		// Bind every feature (municipality) to a path element
		const paths = g.selectAll("path");
		paths
			.data(this.collection.features)
			.enter()
			.append("path")
			.attr("d", pathGenerator as any)

			.attr("fill", this.mapOptions.style.fill ?? "rgba(198, 198, 198, 0.25)")
			.attr("stroke", this.mapOptions.style.strokeColor ?? "#000000")
			.attr("stroke-width", this.mapOptions.style.strokeWidth ?? 0.25)

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
			.duration(this.mapOptions.style.duration);

		if (options.fill) targets.attr("fill", options.fill);
		if (options.strokeColor) targets.attr("stroke", options.strokeColor);
		if (options.strokeWidth) targets.attr("stroke-width", options.strokeWidth);
	}

	public styleDistricts(districts: District[], options?: StyleOptions) {
		const targets = this.selectDistricts(districts)
			.transition()
			.duration(this.mapOptions.style.duration);

		if (options.fill) targets.attr("fill", options.fill);
		if (options.strokeColor) targets.attr("stroke", options.strokeColor);
		if (options.strokeWidth) targets.attr("stroke-width", options.strokeWidth);
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
		const svg = d3.select(this.container).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumMunicipality = datum.properties.NAME_2;
			return municipalities.includes(datumMunicipality);
		});

		return target;
	}

	private selectDistricts(districts: District[]) {
		const svg = d3.select(this.container).select("svg");
		const g = svg.select("g");
		const target = g.selectAll("path").filter((datum: any) => {
			const datumDistrict = datum.properties.NAME_1;
			return districts.includes(datumDistrict);
		});

		return target;
	}
}
