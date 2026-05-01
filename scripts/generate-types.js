import fs from "node:fs";

const MUNICIPALITIES_PATH = "src/data/portugal/municipalities.json";
const data = JSON.parse(fs.readFileSync(MUNICIPALITIES_PATH, "utf8"));
console.log("Generating districts.ts...");
const districtNames = data.objects.municipalities.geometries.map((item) => item.properties.NAME_1);
const uniqueDistricts = [...new Set(districtNames)];
const content1 = `export const DISTRICTS = [\n${uniqueDistricts
	.map((n) => `  "${n}"`)
	.join(",\n")}\n] as const;\n\nexport type District = typeof DISTRICTS[number];`;
fs.writeFileSync("src/types/district.ts", content1);
console.log("Generated districts.ts");
console.log("Generating municipalities.ts...");
const municipalityNames = data.objects.municipalities.geometries.map((item) => item.properties.NAME_2);
const content2 = `export const MUNICIPALITIES = [\n${municipalityNames
	.map((n) => `  "${n}"`)
	.join(",\n")}\n] as const;\n\nexport type Municipality = typeof MUNICIPALITIES[number];`;
fs.writeFileSync("src/types/municipality.ts", content2);
console.log("Generated municipalities.ts");
