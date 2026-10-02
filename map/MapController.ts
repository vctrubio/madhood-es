import { INITIAL_STATE, MapModel } from "./MapModel";
import type { City, Layer, Region, Viewport } from "./types";

const REGIONS: Record<Region, Viewport> = {
  peninsula: INITIAL_STATE.viewport,
  north: { x: 40, y: 10, width: 990, height: 540 },
  centre: { x: 265, y: 280, width: 650, height: 515 },
  south: { x: 210, y: 500, width: 730, height: 450 },
  east: { x: 660, y: 170, width: 540, height: 700 },
};
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Public commands for the toolbar, map gestures, and future integrations. */
export class MapController {
  constructor(readonly model: MapModel) {}

  setLayer(layer: Layer, visible: boolean) {
    this.model.update({
      layers: { ...this.model.getSnapshot().layers, [layer]: visible },
    });
  }

  setRegion(region: Region) {
    this.model.update({
      region,
      viewport: { ...REGIONS[region] },
      selectedCity: null,
    });
  }

  setViewport(viewport: Viewport) {
    if (!Object.values(viewport).every(Number.isFinite)) return;
    if (viewport.width < 24 || viewport.width > 1500 || viewport.height <= 0)
      return;
    this.model.update({
      viewport: {
        ...viewport,
        x: clamp(viewport.x, -250, 1300 - viewport.width),
        y: clamp(viewport.y, -180, 1100 - viewport.height),
      },
    });
  }

  zoom(factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const view = this.model.getSnapshot().viewport;
    const width = clamp(view.width * factor, 24, 1500);
    const height = (view.height * width) / view.width;
    this.setViewport({
      x: view.x + (view.width - width) / 2,
      y: view.y + (view.height - height) / 2,
      width,
      height,
    });
  }

  pan(dx: number, dy: number) {
    const view = this.model.getSnapshot().viewport;
    this.setViewport({ ...view, x: view.x + dx, y: view.y + dy });
  }

  focusCity(city: City) {
    this.setViewport({ x: city.x - 40, y: city.y - 32, width: 80, height: 64 });
    this.model.update({ selectedCity: city.name });
  }

  reset() {
    this.model.update(INITIAL_STATE);
  }
}
