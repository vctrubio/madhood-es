import type { MapState } from "./types";

export const INITIAL_STATE: MapState = {
  viewport: { x: 0, y: 0, width: 1200, height: 1030 },
  layers: {
    cities: true,
    highways: true,
    labels: true,
    parks: true,
    water: true,
    landscapes: true,
  },
  region: "peninsula",
  selectedCity: null,
};

/** Observable map state, independent of React and the DOM. */
export class MapModel {
  private state: MapState = INITIAL_STATE;
  private listeners = new Set<() => void>();

  getSnapshot = (): MapState => this.state;
  getServerSnapshot = (): MapState => INITIAL_STATE;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  update(changes: Partial<MapState>) {
    this.state = { ...this.state, ...changes };
    this.listeners.forEach((listener) => listener());
  }
}
