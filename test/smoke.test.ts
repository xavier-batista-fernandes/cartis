// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Country, CountryMap, DistrictMap, type ZoomChangeEvent } from "../src/index.js";

// jsdom has no layout engine and no ResizeObserver. Each container reports a fixed size, the
// stub keeps its callback so a test can fire a resize by hand, and every <svg> gets the
// width/height lengths d3-zoom reads its default extent from.
let resizeCallbacks: ResizeObserverCallback[] = [];

class FakeResizeObserver {
	constructor(private readonly callback: ResizeObserverCallback) {
		resizeCallbacks.push(callback);
	}
	observe() {}
	unobserve() {}
	disconnect() {
		resizeCallbacks = resizeCallbacks.filter((callback) => callback !== this.callback);
	}
}

function makeContainer(width = 400, height = 600) {
	const container = document.createElement("div");
	container.getBoundingClientRect = () =>
		({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 }) as DOMRect;
	document.body.appendChild(container);
	return container;
}

function resizeTo(width: number, height: number) {
	const entry = { contentRect: { width, height } } as ResizeObserverEntry;
	for (const callback of resizeCallbacks) callback([entry], {} as ResizeObserver);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

for (const dimension of ["width", "height"] as const) {
	Object.defineProperty(SVGElement.prototype, dimension, {
		configurable: true,
		get: () => ({ baseVal: { value: dimension === "width" ? 400 : 600 } }),
	});
}

beforeEach(() => {
	vi.stubGlobal("ResizeObserver", FakeResizeObserver);
	vi.spyOn(console, "log");
});

afterEach(() => {
	document.body.innerHTML = "";
	resizeCallbacks = [];
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("CountryMap", () => {
	it("creates, styles, fits and destroys a map", async () => {
		const container = makeContainer();
		const map = await CountryMap.create(Country.PORTUGAL, container, { style: { duration: 0 } });

		const paths = container.querySelectorAll("svg path");
		expect(paths.length).toBeGreaterThan(250);
		expect(console.log).not.toHaveBeenCalled();

		map.styleMunicipalities(["Lisboa"], { fill: "#ff0000" });
		await wait(50);
		const filled = [...paths].filter((path) => path.getAttribute("fill") === "rgb(255, 0, 0)");
		expect(filled).toHaveLength(1);

		map.fitToMunicipalities(["Lisboa"], { duration: 0 });
		map.fitToCountry({ duration: 0 });
		map.zoomIn();
		map.zoomOut();

		map.destroy();
		expect(container.querySelector("svg")).toBeNull();
		expect(container.isConnected).toBe(true);
	});

	it("still reports the default view after a resize", async () => {
		const container = makeContainer();
		const map = await CountryMap.create(Country.PORTUGAL, container);

		const events: ZoomChangeEvent[] = [];
		map.onZoomChange((event) => events.push(event));
		expect(events.at(-1)?.isDefaultView).toBe(true);

		resizeTo(523, 777);
		await wait(250);

		expect(events.length).toBeGreaterThan(1);
		expect(events.at(-1)).toEqual({ scale: 1, isDefaultView: true });

		map.destroy();
	});
});

describe("DistrictMap", () => {
	it("creates, styles, fits and destroys a map", async () => {
		const container = makeContainer();
		const map = await DistrictMap.create(Country.PORTUGAL, container, { style: { duration: 0 } });

		const paths = container.querySelectorAll("svg path");
		expect(paths.length).toBeGreaterThan(15);

		map.styleDistricts(["Lisboa"], { fill: "#00ff00" });
		await wait(50);
		const filled = [...paths].filter((path) => path.getAttribute("fill") === "rgb(0, 255, 0)");
		expect(filled).toHaveLength(1);

		map.fitToDistricts(["Lisboa"], { duration: 0 });
		map.fitToCountry({ duration: 0 });

		map.destroy();
		expect(container.querySelector("svg")).toBeNull();
	});
});
