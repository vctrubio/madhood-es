export type MadridViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type MadridHood = {
  code: string;
  name: string;
  district: string;
  kind?: string;
  territory: string;
  description?: string;
  source?: string;
  path: string;
  bounds: number[];
  label?: number[];
};
export type MadridRoad = { name: string; path: string; label: number[] };
export type MadridStreet = {
  name: string;
  label: string;
  path: string;
  labelPath: string;
};
export type MadridLandmark = {
  id: string;
  name: string;
  label: string;
  point: number[];
  path?: string;
  kind?: string;
};
export type MadridPointFeature = {
  id: string;
  name: string;
  label: string;
  point: number[];
  labelOffset: number[];
  coordinates: number[];
  source: string;
  symbol?: string;
};
export type MadridConstructionProject = {
  id: string;
  name: string;
  label: string;
  status: string;
  description: string;
  kind: "area" | "corridor";
  path: string;
  bounds: number[];
  point: number[];
  labelOffset: number[];
  width?: number;
  source: string;
  geometryNote: string;
};
export type MadridGeography = {
  construction: MadridConstructionProject[];
  hoods: MadridHood[];
  streets: string;
  highways: MadridRoad[];
  importantStreets: MadridStreet[];
  landmarks: MadridLandmark[];
  stations: MadridPointFeature[];
  monuments: MadridPointFeature[];
  centralBounds: number[];
  worldBounds: number[];
  ringBounds: number[];
};
export type HoodRegistryEntry = { slug: string; name: string; activo: boolean };
export type MadridLayer =
  | "hoods"
  | "streets"
  | "highways"
  | "labels"
  | "parks"
  | "stations"
  | "monuments"
  | "construction";
export type MadridPreset = "centre" | "ring" | "all";
export type MadridState = {
  viewport: MadridViewport;
  selected: string[];
  query: string;
  layers: Record<MadridLayer, boolean>;
};
