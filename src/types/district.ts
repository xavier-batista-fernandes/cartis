/** All 18 Portuguese district names, in no particular order. Generated from the bundled topology — see `scripts/generate-types.js`. */
export const DISTRICTS = [
	"Aveiro",
	"Beja",
	"Braga",
	"Bragança",
	"Castelo Branco",
	"Coimbra",
	"Évora",
	"Faro",
	"Guarda",
	"Leiria",
	"Lisboa",
	"Portalegre",
	"Porto",
	"Santarém",
	"Setúbal",
	"Viana do Castelo",
	"Vila Real",
	"Viseu",
] as const;

/** A Portuguese district name — the literal union of {@link DISTRICTS}. This is the type every district-name parameter across cartis expects (case- and accent-sensitive: use the exact spelling from this list). */
export type District = (typeof DISTRICTS)[number];

/** Returns a fresh, mutable array of all 18 district names (a copy — safe to sort/filter/mutate). */
export function getDistrictsArray() {
	return Array.from(DISTRICTS);
}
