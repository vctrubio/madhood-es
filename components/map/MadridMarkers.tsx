import type {
  MadridGeography,
  MadridPointFeature,
  MadridState,
} from "./MadridTypes";
import "./MadridMarkers.css";

type MarkerProps = {
  feature: MadridPointFeature;
  scale: number;
  labels: boolean;
  station: boolean;
};

function StationSymbol() {
  return (
    <g className="madrid-marker-symbol">
      <rect x="-7" y="-9" width="14" height="16" rx="3" />
      <path d="M-4-6H4V0H-4ZM-5 10-3 7M5 10 3 7M-4 4H-3M3 4H4" />
    </g>
  );
}

function AirportSymbol() {
  return (
    <g className="madrid-marker-symbol">
      <path d="M0-11 2-8 2-3 11 3V5L2 2V7L5 9V11L0 9-5 11V9L-2 7V2L-11 5V3L-2-3V-8Z" />
    </g>
  );
}

function MonumentSymbol({ symbol }: { symbol?: string }) {
  if (symbol === "airport") return <AirportSymbol />;
  if (symbol === "sun")
    return (
      <g className="madrid-marker-symbol">
        <circle r="4" />
        <path d="M0-11V-7M0 7V11M-11 0H-7M7 0H11M-8-8-5-5M5 5 8 8M-8 8-5 5M5-5 8-8" />
      </g>
    );
  if (symbol === "towers")
    return (
      <g className="madrid-marker-symbol">
        <path d="M-10 9-6-10H0L-4 9ZM4 9 0-10H6L10 9ZM-12 10H12" />
      </g>
    );
  return (
    <g className="madrid-marker-symbol">
      <path d="M-8 10H8M-6 7H6M-2 7V-5H2V7M-4-5H4M0-5V-10M-3-8H3" />
    </g>
  );
}

function MarkerSymbol({
  station,
  symbol,
}: {
  station: boolean;
  symbol?: string;
}) {
  return station ? <StationSymbol /> : <MonumentSymbol symbol={symbol} />;
}

function MarkerName({ feature }: { feature: MadridPointFeature }) {
  const [x, y] = feature.labelOffset;
  const anchor = x < 0 ? "end" : "start";
  return (
    <text x={x} y={y} textAnchor={anchor} className="madrid-marker-name">
      {feature.label}
    </text>
  );
}

function MapMarker({ feature, scale, labels, station }: MarkerProps) {
  const transform = `translate(${feature.point[0]} ${feature.point[1]}) scale(${scale})`;
  const className = station
    ? "madrid-point-marker station"
    : "madrid-point-marker monument";
  return (
    <g
      transform={transform}
      className={className}
      role="img"
      aria-label={feature.name}
    >
      <title>{feature.name}</title>
      <circle r="14" className="madrid-marker-halo" />
      <MarkerSymbol station={station} symbol={feature.symbol} />
      {labels && <MarkerName feature={feature} />}
    </g>
  );
}

function StationMarkers({
  stations,
  scale,
  labels,
  visible,
}: {
  stations: MadridPointFeature[];
  scale: number;
  labels: boolean;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <g>
      {stations.map((station) => (
        <MapMarker
          key={station.id}
          feature={station}
          scale={scale}
          labels={labels}
          station
        />
      ))}
    </g>
  );
}

function MonumentMarkers({
  monuments,
  scale,
  labels,
  visible,
}: {
  monuments: MadridPointFeature[];
  scale: number;
  labels: boolean;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <g>
      {monuments.map((monument) => (
        <MapMarker
          key={monument.id}
          feature={monument}
          scale={scale}
          labels={labels}
          station={false}
        />
      ))}
    </g>
  );
}

export function MadridMarkers({
  geography,
  state,
  scale,
}: {
  geography: MadridGeography;
  state: MadridState;
  scale: number;
}) {
  return (
    <g>
      <StationMarkers
        stations={geography.stations}
        scale={scale}
        labels={state.layers.labels}
        visible={state.layers.stations}
      />
      <MonumentMarkers
        monuments={geography.monuments}
        scale={scale}
        labels={state.layers.labels}
        visible={state.layers.monuments}
      />
    </g>
  );
}
