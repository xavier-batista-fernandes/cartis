import type { StyleOptions } from "./style-options.js";

export interface MapOptions {
	padding?: number; // % as decimal (0.05 = 5%)

	zoom?: {
		duration?: number;
		enabled?: boolean;
		min?: number;
		max?: number;
	};

	style?: {
		duration?: number;
	} & StyleOptions;
}
