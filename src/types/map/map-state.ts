import type { Country } from "../country.js";
import type { Status } from "../status.js";

export interface MapState {
	status: Status;
	country: Country;
}
