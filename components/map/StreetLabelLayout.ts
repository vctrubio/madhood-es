import type { MadridViewport } from "./MadridTypes";

type Point = [number, number];
type StreetGeometry = { points: Point[]; distances: number[]; length: number };
export type LabelStreet = {
  index: number;
  label: string;
  geometry: StreetGeometry;
};
export type LabelPlacement = {
  index: number;
  x: number;
  y: number;
  angle: number;
  width: number;
  bounds: MadridViewport;
};

/** The generated street label paths contain only M/L coordinates. */
export function parseStreetPath(path: string): StreetGeometry {
  const coordinates = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  const points: Point[] = [];
  for (let index = 0; index < coordinates.length; index += 2)
    points.push([coordinates[index], coordinates[index + 1]]);
  const distances = [0];
  for (let index = 1; index < points.length; index++)
    distances.push(
      distances[index - 1] +
        Math.hypot(
          points[index][0] - points[index - 1][0],
          points[index][1] - points[index - 1][1],
        ),
    );
  return { points, distances, length: distances.at(-1) || 0 };
}

function pointAlong(path: StreetGeometry, distance: number): Point {
  const target = Math.max(0, Math.min(path.length, distance));
  for (let index = 1; index < path.points.length; index++) {
    if (path.distances[index] < target) continue;
    const previous = path.points[index - 1];
    const next = path.points[index];
    const span = path.distances[index] - path.distances[index - 1];
    const ratio = span ? (target - path.distances[index - 1]) / span : 0;
    return [
      previous[0] + (next[0] - previous[0]) * ratio,
      previous[1] + (next[1] - previous[1]) * ratio,
    ];
  }
  return path.points.at(-1) ?? [0, 0];
}

export function overlaps(first: MadridViewport, second: MadridViewport) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function placeStreetLabels(
  streets: LabelStreet[],
  view: MadridViewport,
  scale: number,
  obstacles: MadridViewport[],
): LabelPlacement[] {
  const occupied = [...obstacles];
  const placements: LabelPlacement[] = [];
  for (const street of streets) {
    if (street.geometry.length === 0) continue;
    const width = (street.label.length * 6.7 + 22) * scale;
    const height = 23 * scale;
    let chosen: LabelPlacement | null = null;
    for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) {
      const distance = street.geometry.length * fraction;
      const point = pointAlong(street.geometry, distance);
      const before = pointAlong(street.geometry, distance - 16 * scale);
      const after = pointAlong(street.geometry, distance + 16 * scale);
      let angle = Math.atan2(after[1] - before[1], after[0] - before[0]);
      if (angle > Math.PI / 2) angle -= Math.PI;
      if (angle < -Math.PI / 2) angle += Math.PI;
      const cosine = Math.cos(angle),
        sine = Math.sin(angle);
      for (const offset of [19, -19, 34, -34]) {
        const x = point[0] - sine * offset * scale;
        const y = point[1] + cosine * offset * scale;
        const boxWidth =
          Math.abs(cosine) * width + Math.abs(sine) * height + 8 * scale;
        const boxHeight =
          Math.abs(sine) * width + Math.abs(cosine) * height + 8 * scale;
        const bounds = {
          x: x - boxWidth / 2,
          y: y - boxHeight / 2,
          width: boxWidth,
          height: boxHeight,
        };
        const inside =
          bounds.x > view.x + 10 * scale &&
          bounds.y > view.y + 10 * scale &&
          bounds.x + bounds.width < view.x + view.width - 10 * scale &&
          bounds.y + bounds.height < view.y + view.height - 10 * scale;
        if (!inside || occupied.some((box) => overlaps(bounds, box))) continue;
        chosen = {
          index: street.index,
          x,
          y,
          angle: (angle * 180) / Math.PI,
          width: width / scale,
          bounds,
        };
        break;
      }
      if (chosen) break;
    }
    if (!chosen) continue;
    occupied.push(chosen.bounds);
    placements.push(chosen);
  }
  return placements;
}
