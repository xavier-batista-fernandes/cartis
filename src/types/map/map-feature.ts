import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { District } from "../district.js";
import type { Municipality } from "../municipality.js";

/** What cartis reads off each municipality in the bundled municipalities topology. */
export type MunicipalityProperties = { NAME_1: District; NAME_2: Municipality };

/** What cartis reads off each district in the bundled districts topology. */
export type DistrictProperties = { dis_name: District };

/** One drawn shape: the datum bound to each `<path>`. */
export type MapFeature<P> = Feature<Geometry, P>;

export type MapFeatureCollection<P> = FeatureCollection<Geometry, P>;

export type MunicipalitiesTopology = Topology<{ municipalities: GeometryCollection<MunicipalityProperties> }>;

export type DistrictsTopology = Topology<{ districts: GeometryCollection<DistrictProperties> }>;
