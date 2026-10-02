import "./MapView.css";
import { NatureAreas, NatureLabels } from "./NatureLayers";
import { memo, useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent, MouseEvent } from "react";
import type { MapController } from "@/components/map/MapController";
import type { City, Geography, MapState, Viewport } from "@/components/map/types";

type MapViewProps = {
  geography: Geography;
  controller: MapController;
  state: MapState;
};
type Road = Geography["highways"][number];
type Country = Geography["countries"][number];

function CountryShape({ country }: { country: Country }) {
  const className = country.code === "ESP" ? "spain" : "neighbour";
  return (
    <path d={country.path} className={className} fillRule="evenodd">
      <title>{country.name}</title>
    </path>
  );
}

function Countries({ countries }: { countries: Country[] }) {
  return (
    <g className="countries">
      {countries.map((country) => (
        <CountryShape key={country.code} country={country} />
      ))}
    </g>
  );
}

function CountryLabels() {
  return (
    <g className="country-labels" aria-hidden="true">
      <text x="146" y="570" transform="rotate(-90 146 570)">
        PORTUGAL
      </text>
      <text x="1030" y="70">
        FRANCIA
      </text>
      <text x="610" y="950">
        MARRUECOS
      </text>
    </g>
  );
}

function Highways({
  geography,
  visible,
}: {
  geography: Geography;
  visible: boolean;
}) {
  const spainPath = geography.countries.find(
    (country) => country.code === "ESP",
  )?.path;
  const visibility = visible ? "visible" : "hidden";

  return (
    <>
      <defs>
        <clipPath id="spain-boundary">
          <path d={spainPath} />
        </clipPath>
      </defs>
      <g
        clipPath="url(#spain-boundary)"
        className="highways"
        visibility={visibility}
        aria-label="Autopistas y autovías"
      >
        {geography.highways.map((road) => (
          <path key={road.ref} d={road.path}>
            <title>{road.ref}</title>
          </path>
        ))}
      </g>
    </>
  );
}

const BaseLayers = memo(function BaseLayers({
  geography,
  layers,
}: {
  geography: Geography;
  layers: MapState["layers"];
}) {
  return (
    <>
      <Countries countries={geography.countries} />
      <NatureAreas nature={geography.nature} layers={layers} />
      <CountryLabels />
      <Highways geography={geography} visible={layers.highways} />
    </>
  );
});

function CitySymbol({ city, labels }: { city: City; labels: boolean }) {
  const labelX = city.dx ?? 9;
  const labelY = city.dy ?? -8;
  const characterWidth = city.major ? 7.5 : 5.8;
  const labelWidth = city.name.length * characterWidth;
  const hitX = Math.min(-10, labelX < 0 ? labelX - labelWidth : labelX);
  const hitY = Math.min(-10, labelY - 14);
  const hitWidth = labels ? labelWidth + 22 : 20;
  const hitHeight = labels ? Math.max(10, labelY + 4) - hitY : 20;
  const radius = city.major ? 4.3 : 2.7;
  const anchor = labelX < 0 ? "end" : "start";

  return (
    <>
      <rect
        className="city-hit"
        x={hitX}
        y={hitY}
        width={hitWidth}
        height={hitHeight}
        rx="3"
      />
      <circle className="city-dot" r={radius} />
      {labels && (
        <text x={labelX} y={labelY} textAnchor={anchor}>
          {city.name}
        </text>
      )}
      <title>{city.name}</title>
    </>
  );
}

function CityMarker({
  city,
  selected,
  labels,
  scale,
  controller,
}: {
  city: City;
  selected: boolean;
  labels: boolean;
  scale: number;
  controller: MapController;
}) {
  const transform = `translate(${city.x} ${city.y}) scale(${scale})`;
  const className = `city ${city.major ? "major" : ""} ${selected ? "selected" : ""}`;
  const label = `Ver ${city.name}`;

  function selectCity() {
    controller.focusCity(city);
  }
  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    selectCity();
  }

  return (
    <g
      transform={transform}
      className={className}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      onClick={selectCity}
      onKeyDown={handleKeyDown}
    >
      <CitySymbol city={city} labels={labels} />
    </g>
  );
}

function CityMarkers({
  geography,
  controller,
  state,
  scale,
}: MapViewProps & { scale: number }) {
  if (!state.layers.cities) return null;
  const cities = [...geography.cities].sort(
    (a, b) => Number(a.major) - Number(b.major),
  );

  return (
    <g className="cities">
      {cities.map((city) => (
        <CityMarker
          key={city.name}
          city={city}
          selected={state.selectedCity === city.name}
          labels={state.layers.labels}
          scale={scale}
          controller={controller}
        />
      ))}
    </g>
  );
}

function RoadLabel({ road, scale }: { road: Road; scale: number }) {
  const transform = `translate(${road.x} ${road.y}) scale(${scale})`;
  const width = road.ref.length * 6.8 + 8;
  const x = -width / 2;

  return (
    <g transform={transform}>
      <rect x={x} y="-9" width={width} height="18" rx="3" />
      <text textAnchor="middle" y="3">
        {road.ref}
      </text>
    </g>
  );
}

function RoadLabels({
  roads,
  state,
  scale,
}: {
  roads: Road[];
  state: MapState;
  scale: number;
}) {
  const view = state.viewport;
  const visible =
    state.layers.highways && state.layers.labels && view.width < 300;
  if (!visible) return null;
  const visibleRoads = roads.filter(
    (road) =>
      road.ref !== "Sin referencia" &&
      road.ref !== "Red principal" &&
      road.ref.length < 15 &&
      road.x > view.x &&
      road.x < view.x + view.width &&
      road.y > view.y &&
      road.y < view.y + view.height,
  );

  return (
    <g className="road-labels" aria-hidden="true">
      {visibleRoads.map((road) => (
        <RoadLabel key={road.ref} road={road} scale={scale} />
      ))}
    </g>
  );
}

function SeaLabels() {
  return (
    <g className="sea-labels" aria-hidden="true">
      <text x="10" y="360" transform="rotate(-90 10 360)">
        OCÉANO ATLÁNTICO
      </text>
      <text x="950" y="730" transform="rotate(-55 950 730)">
        MAR MEDITERRÁNEO
      </text>
    </g>
  );
}

function MapLayers({
  geography,
  controller,
  state,
  scale,
}: MapViewProps & { scale: number }) {
  return (
    <>
      <BaseLayers geography={geography} layers={state.layers} />
      <RoadLabels roads={geography.highways} state={state} scale={scale} />
      <SeaLabels />
      <NatureLabels nature={geography.nature} state={state} scale={scale} />
      <CityMarkers
        geography={geography}
        controller={controller}
        state={state}
        scale={scale}
      />
    </>
  );
}

export function MapView({
  geography,
  controller,
  state,
}: {
  geography: Geography;
  controller: MapController;
  state: MapState;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    view: Viewport;
    scale: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const view = state.viewport;
  const [dimensions, setDimensions] = useState({ width: 1200, height: 950 });
  const cityScale = Math.max(
    view.width / dimensions.width,
    view.height / dimensions.height,
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      controller.zoom(event.deltaY > 0 ? 1.08 : 1 / 1.08);
    };
    svg.addEventListener("wheel", wheel, { passive: false });
    return () => svg.removeEventListener("wheel", wheel);
  }, [controller]);

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || drag.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    suppressClick.current = false;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view,
      scale: Math.max(view.width / bounds.width, view.height / bounds.height),
      moved: false,
    };
  }
  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    start.moved = true;
    suppressClick.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    controller.setViewport({
      ...start.view,
      x: start.view.x - dx * start.scale,
      y: start.view.y - dy * start.scale,
    });
  }
  function stopDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyPan(event: KeyboardEvent<SVGSVGElement>) {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!steps[event.key]) return;
    event.preventDefault();
    const [x, y] = steps[event.key];
    controller.pan(x * view.width * 0.08, y * view.height * 0.08);
  }

  function releaseDrag() {
    drag.current = null;
  }

  function captureClick(event: MouseEvent<SVGSVGElement>) {
    if (!suppressClick.current) return;
    event.stopPropagation();
    suppressClick.current = false;
  }

  const detailed = view.width < 700;
  const viewBox = `${view.x} ${view.y} ${view.width} ${view.height}`;

  return (
    <div className="map-viewport">
      <svg
        ref={svgRef}
        className="map"
        data-detail={detailed}
        viewBox={viewBox}
        role="group"
        tabIndex={0}
        aria-label="Mapa de la península ibérica. Arrastra para mover; usa las flechas o los controles para explorar."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={releaseDrag}
        onKeyDown={keyPan}
        onClickCapture={captureClick}
      >
        <title>España, ciudad a ciudad</title>
        <MapLayers
          geography={geography}
          controller={controller}
          state={state}
          scale={cityScale}
        />
      </svg>
    </div>
  );
}
