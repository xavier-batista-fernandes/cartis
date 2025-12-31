import municipalitiesData from '../data/portugal/municipalities.json';
import { CountryName } from '../types/country-name';
import { District } from '../types/district';
import { Municipality } from '../types/municipality';



export class Country {
  private country: CountryName;
  private districts: District[] = [];
  private municipalities: Municipality[] = [];

  constructor(country: CountryName) {
    this.country = country;
    this.loadData();
  }

  private loadData() {
    switch (this.country) {
      case CountryName.PORTUGAL:
        this.municipalities = municipalitiesData.objects.municipalities.geometries.map(
          (geometry: any, index: number) => ({
            id: index,
            name: geometry.properties.NAME_2,
            district: geometry.properties.NAME_1,
          }),
        );

        const districtMap = new Map<string, Municipality[]>();
        this.municipalities.forEach((m) => {
          if (!districtMap.has(m.district)) districtMap.set(m.district, []);
          districtMap.get(m.district)!.push(m);
        });

        this.districts = Array.from(districtMap, ([name, municipalities]) => ({
          name,
          municipalities,
        }));
        break;

      default:
        throw new Error(`Unsupported country: ${this.country}`);
    }
  }

  getDistricts(): string[] {
    return this.districts.map((d) => d.name);
  }

  getMunicipalities(): Municipality[] {
    return this.municipalities;
  }

  getMunicipalitiesForDistrict(district: string): Municipality[] {
    const d = this.districts.find((x) => x.name === district);
    return d ? d.municipalities : [];
  }

  getMunicipalityByName(name: string): Municipality | undefined {
    return this.municipalities.find((m) => m.name === name);
  }

  getMunicipalityId(name: string): number | undefined {
    return this.getMunicipalityByName(name)?.id;
  }
}
