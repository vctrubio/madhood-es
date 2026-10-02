import { memo } from "react";
import type { MapState, NatureGeography } from "@/components/map/types";
import "./NatureLayers.css";

type Park = NatureGeography["parks"][number];
type Landscape = NatureGeography["landscapes"][number];
type WaterLabel = NatureGeography["waterLabels"][number];
type NatureAreaProps = { nature: NatureGeography; layers: MapState["layers"] };
type NatureLabelProps = {
  nature: NatureGeography;
  state: MapState;
  scale: number;
};

function ParkArea({ park }: { park: Park }) {
  const className = `park-${park.kind}`;
  const title =
    park.kind === "national" ? `Parque nacional: ${park.name}` : park.name;

  return (
    <path d={park.path} className={className} fillRule="evenodd">
      <title>{title}</title>
    </path>
  );
}

function ParkAreas({ parks, visible }: { parks: Park[]; visible: boolean }) {
  const visibility = visible ? "visible" : "hidden";
  const orderedParks = [...parks].sort(
    (a, b) => Number(a.kind === "national") - Number(b.kind === "national"),
  );

  return (
    <g className="park-areas" visibility={visibility}>
      {orderedParks.map((park) => (
        <ParkArea key={`${park.kind}-${park.name}`} park={park} />
      ))}
    </g>
  );
}

function DesertArea({ path, visible }: { path: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <path className="desert-area" d={path} fillRule="evenodd">
      <title>Paraje Natural del Desierto de Tabernas</title>
    </path>
  );
}

function WaterAreas({ path, visible }: { path: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <path className="water-areas" d={path} fillRule="evenodd">
      <title>Lagos, embalses y láminas de agua · OpenStreetMap</title>
    </path>
  );
}

function LandscapeSymbol({ kind }: { kind: string }) {
  if (kind === "mountain")
    return <path d="M-23 10-8-12 1 1 8-7 23 10ZM-13-5-8-1-4-6M3 0 8 3 12-1" />;
  if (kind === "plain") return <path d="M-20 0H20M-13 5H16M-17 10H10" />;
  return <path d="M-22 7Q-9-12 4 4Q13-9 24 7M-16 12Q-1 4 16 12M-6-1Q0 4 4 4" />;
}

function ParkMarker({
  park,
  scale,
  detailed,
}: {
  park: Park;
  scale: number;
  detailed: boolean;
}) {
  const title = `Parque nacional: ${park.name}`;
  const transform = `translate(${park.x} ${park.y}) scale(${scale})`;

  return (
    <g className="park-marker" transform={transform}>
      <title>{title}</title>
      <path d="M0-10 6 0H3L8 6H1V11H-1V6H-8L-3 0H-6Z" />
      {detailed && (
        <text x="11" y="3">
          {park.name}
        </text>
      )}
    </g>
  );
}

function ParkMarkers({
  parks,
  scale,
  detailed,
  visible,
}: {
  parks: Park[];
  scale: number;
  detailed: boolean;
  visible: boolean;
}) {
  if (!visible) return null;
  const nationalParks = parks.filter((park) => park.kind === "national");

  return (
    <>
      {nationalParks.map((park) => (
        <ParkMarker
          key={park.name}
          park={park}
          scale={scale}
          detailed={detailed}
        />
      ))}
    </>
  );
}

function WaterName({ water, scale }: { water: WaterLabel; scale: number }) {
  const transform = `translate(${water.x} ${water.y}) scale(${scale})`;

  return (
    <text className="water-label" transform={transform} y="-6">
      {water.name}
    </text>
  );
}

function WaterNames({
  waters,
  scale,
  visible,
}: {
  waters: WaterLabel[];
  scale: number;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <>
      {waters.map((water) => (
        <WaterName key={water.name} water={water} scale={scale} />
      ))}
    </>
  );
}

function LandscapeMarker({
  landscape,
  scale,
}: {
  landscape: Landscape;
  scale: number;
}) {
  const className = `landscape-marker landscape-${landscape.kind}`;
  const transform = `translate(${landscape.x} ${landscape.y}) scale(${scale})`;
  const labelOffsets: Record<string, number> = { plain: 24, steppe: 28 };
  const labelY = labelOffsets[landscape.kind] ?? -14;

  return (
    <g className={className} transform={transform}>
      <title>{landscape.description}</title>
      <LandscapeSymbol kind={landscape.kind} />
      <text y={labelY}>{landscape.name}</text>
    </g>
  );
}

function LandscapeMarkers({
  landscapes,
  scale,
  visible,
}: {
  landscapes: Landscape[];
  scale: number;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <>
      {landscapes.map((landscape) => (
        <LandscapeMarker
          key={landscape.name}
          landscape={landscape}
          scale={scale}
        />
      ))}
    </>
  );
}

export const NatureAreas = memo(function NatureAreas({
  nature,
  layers,
}: NatureAreaProps) {
  return (
    <g className="nature-areas">
      <ParkAreas parks={nature.parks} visible={layers.parks} />
      <DesertArea path={nature.desertPath} visible={layers.landscapes} />
      <WaterAreas path={nature.waterPath} visible={layers.water} />
    </g>
  );
});

export function NatureLabels({ nature, state, scale }: NatureLabelProps) {
  const detailed = state.viewport.width < 700;
  const waterVisible = state.layers.water && detailed;
  if (!state.layers.labels) return null;

  return (
    <g className="nature-labels">
      <ParkMarkers
        parks={nature.parks}
        scale={scale}
        detailed={detailed}
        visible={state.layers.parks}
      />
      <WaterNames
        waters={nature.waterLabels}
        scale={scale}
        visible={waterVisible}
      />
      <LandscapeMarkers
        landscapes={nature.landscapes}
        scale={scale}
        visible={state.layers.landscapes}
      />
    </g>
  );
}
