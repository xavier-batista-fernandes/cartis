import { Municipality } from "./municipality";

export interface District {
  name: string;
  municipalities: Municipality[];
}