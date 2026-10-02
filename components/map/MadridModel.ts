import type { MadridState, MadridViewport } from "./MadridTypes";

export class MadridModel {
  private state: MadridState;
  private readonly initialState: MadridState;
  private listeners = new Set<() => void>();

  constructor(viewport: MadridViewport) {
    this.initialState = {
      viewport,
      selected: [],
      query: "",
      layers: {
        hoods: true,
        streets: true,
        highways: true,
        labels: true,
        parks: true,
        stations: true,
        monuments: true,
        construction: true,
      },
    };
    this.state = this.initialState;
  }

  getSnapshot = () => this.state;
  getServerSnapshot = () => this.initialState;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  update(changes: Partial<MadridState>) {
    this.state = { ...this.state, ...changes };
    this.listeners.forEach((listener) => listener());
  }
}
