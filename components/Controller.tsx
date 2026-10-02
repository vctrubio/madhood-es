import type { MapController } from "@/map/MapController";
import type { Layer, MapState, Region } from "@/map/types";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "cities", label: "Ciudades" },
  { key: "highways", label: "Vías" },
  { key: "labels", label: "Nombres" },
  { key: "parks", label: "Parques" },
  { key: "water", label: "Agua" },
  { key: "landscapes", label: "Paisajes" },
];

export function Controller({
  controller,
  state,
}: {
  controller: MapController;
  state: MapState;
}) {
  return (
    <aside className="controller" aria-label="Controles del mapa">
      <div className="controller-heading">
        <span>EXPLORAR EL MAPA</span>
        <span className="live-dot" />
      </div>
      <div className="controller-row">
        <label className="region-select">
          <span className="sr-only">Escala de la vista</span>
          <select
            value={state.region}
            onChange={(event) =>
              controller.setRegion(event.target.value as Region)
            }
          >
            <option value="peninsula">Toda la península</option>
            <option value="north">Norte</option>
            <option value="centre">Centro</option>
            <option value="south">Sur</option>
            <option value="east">Mediterráneo</option>
          </select>
        </label>
        <div className="zoom-controls">
          <button aria-label="Alejar" onClick={() => controller.zoom(1.25)}>
            −
          </button>
          <button aria-label="Acercar" onClick={() => controller.zoom(0.8)}>
            +
          </button>
          <button
            aria-label="Restablecer mapa"
            title="Restablecer mapa"
            onClick={() => controller.reset()}
          >
            ↺
          </button>
        </div>
      </div>
      <div className="layer-controls">
        {LAYERS.map(({ key, label }) => (
          <button
            key={key}
            aria-pressed={state.layers[key]}
            onClick={() => controller.setLayer(key, !state.layers[key])}
          >
            <span className="toggle-indicator" />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
