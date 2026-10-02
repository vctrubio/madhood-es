import { MadridModel } from "./MadridModel";
import type {
  MadridGeography,
  MadridHood,
  MadridLayer,
  MadridPreset,
  MadridViewport,
} from "./MadridTypes";

function toViewport(bounds: number[], padding = 0): MadridViewport {
  const [x, y, width, height] = bounds;
  return {
    x: x - padding,
    y: y - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export class MadridController {
  readonly model: MadridModel;
  constructor(readonly geography: MadridGeography) {
    this.model = new MadridModel(toViewport(geography.centralBounds, 90));
  }
  setViewport(viewport: MadridViewport) {
    if (!Object.values(viewport).every(Number.isFinite)) return;
    if (viewport.width < 130 || viewport.width > 6500 || viewport.height <= 0)
      return;
    this.model.update({ viewport });
  }
  zoom(factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const view = this.model.getSnapshot().viewport;
    const width = Math.max(130, Math.min(6500, view.width * factor));
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
  setQuery(query: string) {
    this.model.update({ query });
  }
  setLayer(layer: MadridLayer) {
    const layers = this.model.getSnapshot().layers;
    this.model.update({ layers: { ...layers, [layer]: !layers[layer] } });
  }
  focusPreset(preset: MadridPreset) {
    const bounds =
      preset === "centre"
        ? this.geography.centralBounds
        : preset === "ring"
          ? this.geography.ringBounds
          : this.geography.worldBounds;
    this.setViewport(toViewport(bounds, 90));
  }
  toggleHood(hood: MadridHood) {
    const selected = new Set(this.model.getSnapshot().selected);
    if (selected.has(hood.code)) selected.delete(hood.code);
    else selected.add(hood.code);
    this.model.update({ selected: [...selected] });
  }
  focusHood(hood: MadridHood) {
    this.setViewport(toViewport(hood.bounds, 100));
  }
  clearSelection() {
    this.model.update({ selected: [] });
  }
  reset() {
    this.clearSelection();
    this.focusPreset("centre");
  }
}
