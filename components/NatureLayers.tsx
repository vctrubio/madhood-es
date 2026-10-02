import { memo } from "react";
import type { MapState, NatureGeography } from "@/map/types";

export const NatureAreas = memo(function NatureAreas({
  nature,
  layers,
}: {
  nature: NatureGeography;
  layers: MapState["layers"];
}) {
  return (
    <g className="nature-areas">
      <g
        className="park-areas"
        visibility={layers.parks ? "visible" : "hidden"}
      >
        {[...nature.parks]
          .sort(
            (a, b) =>
              Number(a.kind === "national") - Number(b.kind === "national"),
          )
          .map((park) => (
            <path
              key={`${park.kind}-${park.name}`}
              d={park.path}
              className={`park-${park.kind}`}
              fillRule="evenodd"
            >
              <title>
                {`${park.kind === "national" ? "Parque nacional: " : ""}${park.name}`}
              </title>
            </path>
          ))}
      </g>
      {layers.landscapes && (
        <path className="desert-area" d={nature.desertPath} fillRule="evenodd">
          <title>Paraje Natural del Desierto de Tabernas</title>
        </path>
      )}
      {layers.water && (
        <path className="water-areas" d={nature.waterPath} fillRule="evenodd">
          <title>Lagos, embalses y láminas de agua · OpenStreetMap</title>
        </path>
      )}
    </g>
  );
});

function LandscapeSymbol({ kind }: { kind: string }) {
  if (kind === "mountain")
    return <path d="M-23 10-8-12 1 1 8-7 23 10ZM-13-5-8-1-4-6M3 0 8 3 12-1" />;
  if (kind === "plain") return <path d="M-20 0H20M-13 5H16M-17 10H10" />;
  return <path d="M-22 7Q-9-12 4 4Q13-9 24 7M-16 12Q-1 4 16 12M-6-1Q0 4 4 4" />;
}

export function NatureLabels({
  nature,
  state,
  scale,
}: {
  nature: NatureGeography;
  state: MapState;
  scale: number;
}) {
  const detailed = state.viewport.width < 700;
  if (!state.layers.labels) return null;
  return (
    <g className="nature-labels">
      {state.layers.parks &&
        nature.parks
          .filter((park) => park.kind === "national")
          .map((park) => (
            <g
              key={park.name}
              className="park-marker"
              transform={`translate(${park.x} ${park.y}) scale(${scale})`}
            >
              <title>{`Parque nacional: ${park.name}`}</title>
              <path d="M0-10 6 0H3L8 6H1V11H-1V6H-8L-3 0H-6Z" />
              {detailed && (
                <text x="11" y="3">
                  {park.name}
                </text>
              )}
            </g>
          ))}
      {state.layers.water &&
        detailed &&
        nature.waterLabels.map((water) => (
          <text
            key={water.name}
            className="water-label"
            transform={`translate(${water.x} ${water.y}) scale(${scale})`}
            y="-6"
          >
            {water.name}
          </text>
        ))}
      {state.layers.landscapes &&
        nature.landscapes.map((landscape) => (
          <g
            key={landscape.name}
            className={`landscape-marker landscape-${landscape.kind}`}
            transform={`translate(${landscape.x} ${landscape.y}) scale(${scale})`}
          >
            <title>{landscape.description}</title>
            <LandscapeSymbol kind={landscape.kind} />
            <text
              y={
                landscape.kind === "plain"
                  ? 24
                  : landscape.kind === "steppe"
                    ? 28
                    : -14
              }
            >
              {landscape.name}
            </text>
          </g>
        ))}
    </g>
  );
}
