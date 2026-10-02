import { memo, useMemo } from "react";
import configuration from "@/config/madrid.json";
import type { KeyboardEvent } from "react";
import type { MadridController } from "./MadridController";
import type {
  MadridGeography,
  MadridHood,
  MadridRoad,
  MadridState,
} from "./MadridTypes";
import {
  parseStreetPath,
  placeStreetLabels,
  overlaps,
} from "./StreetLabelLayout";

type LayerProps = {
  geography: MadridGeography;
  state: MadridState;
  scale: number;
};
type HoodProps = {
  hood: MadridHood;
  selected: boolean;
  controller: MadridController;
};

function HoodShape({ hood, selected, controller }: HoodProps) {
  const className = selected ? "madrid-hood selected" : "madrid-hood";
  const title = `${hood.name}, ${hood.district}`;
  function select() {
    controller.toggleHood(hood);
  }
  function keySelect(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    select();
  }
  const destination = hood.kind === "destination";
  const label = hood.label ?? [hood.bounds[0], hood.bounds[1]];
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={title}
      aria-pressed={selected}
      onClick={select}
      onKeyDown={keySelect}
      className={className}
    >
      <title>{title}</title>
      {destination ? (
        <circle cx={label[0]} cy={label[1]} r="22" />
      ) : (
        <path d={hood.path} fillRule="evenodd" />
      )}
    </g>
  );
}

export function HoodAreas({
  geography,
  state,
  controller,
}: Omit<LayerProps, "scale"> & { controller: MadridController }) {
  if (!state.layers.hoods) return null;
  return (
    <g>
      {geography.hoods.map((hood) => (
        <HoodShape
          key={hood.code}
          hood={hood}
          selected={state.selected.includes(hood.code)}
          controller={controller}
        />
      ))}
    </g>
  );
}

function HoodName({ hood, scale }: { hood: MadridHood; scale: number }) {
  const [x, y, width, height] = hood.bounds;
  const point = hood.label ?? [x + width / 2, y + height / 2];
  const labelY = point[1] - (hood.kind === "destination" ? 35 : 0);
  const transform = `translate(${point[0]} ${labelY}) scale(${scale})`;
  return (
    <text transform={transform} textAnchor="middle">
      {hood.name}
    </text>
  );
}

export function HoodNames({ geography, state, scale }: LayerProps) {
  if (!state.layers.hoods || !state.layers.labels) return null;
  const occupied: { x: number; y: number; width: number; height: number }[] =
    [];
  const orderedHoods = [...geography.hoods].sort((first, second) => {
    const selectedPriority =
      Number(state.selected.includes(second.code)) -
      Number(state.selected.includes(first.code));
    return (
      selectedPriority ||
      second.bounds[2] * second.bounds[3] - first.bounds[2] * first.bounds[3]
    );
  });
  const visibleHoods = orderedHoods.filter((hood) => {
    if (state.viewport.width > 2200 && hood.territory === "central")
      return false;
    const [x, y, width, height] = hood.bounds;
    const point = hood.label ?? [x + width / 2, y + height / 2];
    const labelWidth = (hood.name.length * 5.2 + 12) * scale;
    const labelBounds = {
      x: point[0] - labelWidth / 2,
      y: point[1] - 9 * scale,
      width: labelWidth,
      height: 18 * scale,
    };
    if (occupied.some((box) => overlaps(labelBounds, box))) return false;
    occupied.push(labelBounds);
    return true;
  });
  return (
    <g className="madrid-hood-labels" aria-hidden="true">
      {visibleHoods.map((hood) => (
        <HoodName key={hood.code} hood={hood} scale={scale} />
      ))}
    </g>
  );
}

export const MadridBackground = memo(function MadridBackground({
  geography,
  visible,
}: {
  geography: MadridGeography;
  visible: boolean;
}) {
  if (!visible) return null;
  const parks = geography.landmarks.filter(
    (landmark) => landmark.kind === "park",
  );
  return (
    <g aria-hidden="true">
      {parks.map((park) => (
        <path
          className="madrid-park"
          key={park.id}
          d={park.path}
          fillRule="evenodd"
        >
          <title>{park.name}</title>
        </path>
      ))}
    </g>
  );
});

export const MadridStreets = memo(function MadridStreets({
  geography,
  visible,
}: {
  geography: MadridGeography;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <g className="madrid-streets" aria-hidden="true">
      <path className="madrid-local-streets" d={geography.streets} />
      {geography.importantStreets.map((street) => (
        <path
          className="madrid-important-street"
          key={street.name}
          d={street.path}
        >
          <title>{street.name}</title>
        </path>
      ))}
    </g>
  );
});

function Highway({ road }: { road: MadridRoad }) {
  const className =
    road.name === "M-40" ? "madrid-highway outer-ring" : "madrid-highway";
  return (
    <g className={className}>
      <path className="madrid-road-casing" d={road.path} />
      <path className="madrid-road-line" d={road.path}>
        <title>{road.name}</title>
      </path>
    </g>
  );
}

export const MadridHighways = memo(function MadridHighways({
  roads,
  visible,
}: {
  roads: MadridRoad[];
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <g aria-hidden="true">
      {roads.map((road) => (
        <Highway key={road.name} road={road} />
      ))}
    </g>
  );
});

function RoadBadge({ road, scale }: { road: MadridRoad; scale: number }) {
  const transform = `translate(${road.label[0]} ${road.label[1]}) scale(${scale})`;
  return (
    <g transform={transform} className="madrid-road-badge">
      <rect x="-20" y="-10" width="40" height="20" rx="2" />
      <text textAnchor="middle" y="4">
        {road.name}
      </text>
    </g>
  );
}

export function MadridRoadBadges({ geography, state, scale }: LayerProps) {
  if (!state.layers.highways || !state.layers.labels) return null;
  return (
    <g aria-hidden="true">
      {geography.highways.map((road) => (
        <RoadBadge key={road.name} road={road} scale={scale} />
      ))}
    </g>
  );
}

export function MadridStreetNames({ geography, state, scale }: LayerProps) {
  const streets = useMemo(
    () =>
      geography.importantStreets.map((street, index) => ({
        index,
        name: street.name,
        label: street.label,
        geometry: parseStreetPath(street.labelPath),
      })),
    [geography],
  );
  if (
    !state.layers.streets ||
    !state.layers.labels ||
    state.viewport.width > 2200
  )
    return null;
  const obstacles = geography.hoods.map((hood) => {
    const [x, y, width, height] = hood.bounds;
    const point = hood.label ?? [x + width / 2, y + height / 2];
    const labelWidth = (hood.name.length * 5.2 + 10) * scale;
    return {
      x: point[0] - labelWidth / 2,
      y: point[1] - 10 * scale,
      width: labelWidth,
      height: 18 * scale,
    };
  });
  const pinned = configuration.streetLabelAnchors
    .map((anchor) => {
      const index = streets.findIndex((street) => street.name === anchor.name);
      const width = 88;
      return {
        index,
        x: anchor.x,
        y: anchor.y,
        angle: anchor.angle,
        width,
        bounds: {
          x: anchor.x - 15 * scale,
          y: anchor.y - 44 * scale,
          width: 30 * scale,
          height: 88 * scale,
        },
      };
    })
    .filter((anchor) => anchor.index >= 0);
  const automaticStreets = streets.filter(
    (street) => !pinned.some((label) => label.index === street.index),
  );
  const automatic = placeStreetLabels(automaticStreets, state.viewport, scale, [
    ...obstacles,
    ...pinned.map((label) => label.bounds),
  ]);
  const placements = [...pinned, ...automatic];
  return (
    <g className="madrid-street-labels" aria-hidden="true">
      {placements.map((label) => (
        <StreetName
          key={label.index}
          placement={label}
          name={streets[label.index].label}
          scale={scale}
        />
      ))}
    </g>
  );
}

function StreetName({
  placement,
  name,
  scale,
}: {
  placement: ReturnType<typeof placeStreetLabels>[number];
  name: string;
  scale: number;
}) {
  const transform = `translate(${placement.x} ${placement.y}) rotate(${placement.angle}) scale(${scale})`;
  const x = -placement.width / 2;
  return (
    <g transform={transform}>
      <rect x={x} y="-10" width={placement.width} height="20" rx="2" />
      <text textAnchor="middle" y="3">
        {name}
      </text>
    </g>
  );
}
