import type { MapController } from "@/components/map/MapController";
import type { Layer, MapState, Region } from "@/components/map/types";
import type { ChangeEvent } from "react";
import "./MapToolbar.css";

const LAYERS: { key: Layer; label: string }[] = [
  { key: "cities", label: "Ciudades" },
  { key: "highways", label: "Vías" },
  { key: "labels", label: "Nombres" },
  { key: "parks", label: "Parques" },
  { key: "water", label: "Agua" },
  { key: "landscapes", label: "Paisajes" },
];
const REGIONS: { value: Region; label: string }[] = [
  { value: "peninsula", label: "Toda la península" },
  { value: "north", label: "Norte" },
  { value: "centre", label: "Centro" },
  { value: "south", label: "Sur" },
  { value: "east", label: "Mediterráneo" },
];
type ToolbarProps = { controller: MapController; state: MapState };

function ToolbarHeading() {
  return (
    <div className="controller-heading">
      <span>EXPLORAR EL MAPA</span>
      <span className="live-dot" />
    </div>
  );
}

function RegionSelector({
  controller,
  region,
  selectedCity,
}: {
  controller: MapController;
  region: Region;
  selectedCity: string | null;
}) {
  const selectedValue = selectedCity ? "city" : region;
  function handleRegionChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedRegion = REGIONS.find(
      (option) => option.value === event.target.value,
    );
    if (!selectedRegion) return;
    controller.setRegion(selectedRegion.value);
  }

  return (
    <label className="region-select">
      <span className="sr-only">Escala de la vista</span>
      <select value={selectedValue} onChange={handleRegionChange}>
        {selectedCity && <option value="city">{selectedCity}</option>}
        {REGIONS.map((region) => (
          <option key={region.value} value={region.value}>
            {region.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ZoomControls({ controller }: { controller: MapController }) {
  function zoomOut() {
    controller.zoom(1.25);
  }
  function zoomIn() {
    controller.zoom(0.8);
  }
  function reset() {
    controller.reset();
  }

  return (
    <div className="zoom-controls">
      <button aria-label="Alejar" onClick={zoomOut}>
        −
      </button>
      <button aria-label="Acercar" onClick={zoomIn}>
        +
      </button>
      <button
        aria-label="Restablecer mapa"
        title="Restablecer mapa"
        onClick={reset}
      >
        ↺
      </button>
    </div>
  );
}

function ViewControls({ controller, state }: ToolbarProps) {
  return (
    <div className="controller-row">
      <RegionSelector
        controller={controller}
        region={state.region}
        selectedCity={state.selectedCity}
      />
      <ZoomControls controller={controller} />
    </div>
  );
}

function LayerToggle({
  layer,
  enabled,
  controller,
}: {
  layer: (typeof LAYERS)[number];
  enabled: boolean;
  controller: MapController;
}) {
  function toggleLayer() {
    controller.setLayer(layer.key, !enabled);
  }

  return (
    <button aria-pressed={enabled} onClick={toggleLayer}>
      <span className="toggle-indicator" />
      {layer.label}
    </button>
  );
}

function LayerControls({ controller, state }: ToolbarProps) {
  return (
    <div className="layer-controls">
      {LAYERS.map((layer) => (
        <LayerToggle
          key={layer.key}
          layer={layer}
          enabled={state.layers[layer.key]}
          controller={controller}
        />
      ))}
    </div>
  );
}

export function MapToolbar({ controller, state }: ToolbarProps) {
  return (
    <aside className="controller" aria-label="Controles del mapa">
      <ToolbarHeading />
      <ViewControls controller={controller} state={state} />
      <LayerControls controller={controller} state={state} />
    </aside>
  );
}
