import content from "@/config/madrid.json";
import type { MadridController } from "./MadridController";
import type { MadridLayer, MadridPreset, MadridState } from "./MadridTypes";

type ToolbarProps = { controller: MadridController; state: MadridState };
const PRESETS: { id: MadridPreset; label: string }[] = [
  { id: "centre", label: content.presets[0].label },
  { id: "ring", label: content.presets[1].label },
  { id: "all", label: content.presets[2].label },
];
const LAYERS: { id: MadridLayer; label: string }[] = [
  { id: "hoods", label: content.layers[0].label },
  { id: "streets", label: content.layers[1].label },
  { id: "highways", label: content.layers[2].label },
  { id: "labels", label: content.layers[3].label },
  { id: "parks", label: content.layers[4].label },
  { id: "stations", label: content.layers[5].label },
  { id: "monuments", label: content.layers[6].label },
  { id: "construction", label: content.layers[7].label },
];

function PresetButton({
  preset,
  controller,
}: {
  preset: (typeof PRESETS)[number];
  controller: MadridController;
}) {
  function focus() {
    controller.focusPreset(preset.id);
  }
  return (
    <button
      onClick={focus}
      className="min-h-10 border-0 bg-transparent px-3 text-xs hover:text-terracotta"
    >
      {preset.label}
    </button>
  );
}

function LayerButton({
  layer,
  controller,
  enabled,
}: {
  layer: (typeof LAYERS)[number];
  controller: MadridController;
  enabled: boolean;
}) {
  function toggle() {
    controller.setLayer(layer.id);
  }
  const className = enabled
    ? "border-0 bg-ink px-3 py-2 text-xs text-paper"
    : "border-0 bg-transparent px-3 py-2 text-xs text-muted";
  return (
    <button aria-pressed={enabled} onClick={toggle} className={className}>
      {layer.label}
    </button>
  );
}

export function MadridToolbar({ controller, state }: ToolbarProps) {
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2 md:right-6 md:top-5">
      <div className="flex border border-map-line bg-paper shadow-sm">
        {PRESETS.map((preset) => (
          <PresetButton
            key={preset.id}
            preset={preset}
            controller={controller}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 border border-map-line bg-paper shadow-sm">
        {LAYERS.map((layer) => (
          <LayerButton
            key={layer.id}
            layer={layer}
            enabled={state.layers[layer.id]}
            controller={controller}
          />
        ))}
      </div>
    </div>
  );
}

export function MadridZoomControls({
  controller,
}: {
  controller: MadridController;
}) {
  function zoomIn() {
    controller.zoom(0.8);
  }
  function zoomOut() {
    controller.zoom(1.25);
  }
  function reset() {
    controller.reset();
  }
  const buttonClass = "size-11 border-0 bg-paper text-xl hover:bg-map-line";
  return (
    <div className="absolute bottom-12 right-3 z-10 flex flex-col divide-y divide-map-line border border-map-line bg-paper shadow-sm md:right-6">
      <button
        className={buttonClass}
        onClick={zoomIn}
        aria-label={content.zoomIn}
      >
        +
      </button>
      <button
        className={buttonClass}
        onClick={zoomOut}
        aria-label={content.zoomOut}
      >
        −
      </button>
      <button
        className={buttonClass}
        onClick={reset}
        aria-label={content.reset}
      >
        ↺
      </button>
    </div>
  );
}
