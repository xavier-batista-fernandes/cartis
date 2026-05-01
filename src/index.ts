/* core */
export { CountryMap } from "./core/country-map.js";
export { randomMunicipality } from "./core/utils.js";

/* types */
export { Country } from "./types/country.js";
export { getDistrictsArray } from "./types/district.js";
export type { District } from "./types/district.js";
export { getMunicipalitiesArray } from "./types/municipality.js";
export type { Municipality } from "./types/municipality.js";
export type { JumpOptions } from "./types/options/jump.options.js";
export type { MapOptions } from "./types/options/map.options.js";
export type { StyleOptions } from "./types/options/style.options.js";

/* utils */
export { getDistrictFromString } from "./utils/get-district-from-string.js";
export { getDistrictsFromString } from "./utils/get-districts-from-string.js";
export { getMissingDistricts } from "./utils/get-missing-districts.js";
export { getMissingMunicipalities } from "./utils/get-missing-municipalities.js";
export { getMunicipalitiesFromString } from "./utils/get-municipalities-from-string.js";
export { getMunicipalityFromString } from "./utils/get-municipality-from-string.js";

// TEMPORARLY
export * from "./utils/strings/do-strings-match.js";
export * from "./utils/strings/string-to-slug.js";
export * from "./utils/strings/string-to-title-case.js";
