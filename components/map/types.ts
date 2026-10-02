export type Point = { x: number; y: number };
export type Viewport = Point & { width: number; height: number };
export type Layer =
  | "cities"
  | "highways"
  | "labels"
  | "parks"
  | "water"
  | "landscapes";
export type Region = "peninsula" | "north" | "centre" | "south" | "east";
export type City = Point & {
  name: string;
  major: boolean;
  dx?: number;
  dy?: number;
};
export type NatureGeography = {
  parks: (Point & { name: string; kind: string; path: string })[];
  waterPath: string;
  desertPath: string;
  waterLabels: (Point & { name: string })[];
  landscapes: (Point & {
    name: string;
    kind: string;
    description: string;
    source: string;
  })[];
};
export type Geography = {
  nature: NatureGeography;
  countries: { name: string; code: string; path: string }[];
  highways: { ref: string; path: string; x: number; y: number }[];
  cities: City[];
  sourceDate: string;
};
export type MapState = {
  viewport: Viewport;
  layers: Record<Layer, boolean>;
  region: Region;
  selectedCity: string | null;
};
