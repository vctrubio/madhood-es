import { NatureAreas, NatureLabels } from "./NatureLayers";
import { memo, useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
import type { MapController } from "@/map/MapController";
import type { City, Geography, MapState, Viewport } from "@/map/types";

const BaseLayers = memo(function BaseLayers({
  geography,
  highways,
  layers,
}: {
  geography: Geography;
  highways: boolean;
  layers: MapState["layers"];
}) {
  return (
    <>
      <g className="countries">
        {geography.countries.map((country) => (
          <path
            key={country.code}
            d={country.path}
            className={country.code === "ESP" ? "spain" : "neighbour"}
            fillRule="evenodd"
          >
            <title>{country.name}</title>
          </path>
        ))}
      </g>
      <NatureAreas nature={geography.nature} layers={layers} />
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
      <defs>
        <clipPath id="spain-boundary">
          <path
            d={
              geography.countries.find((country) => country.code === "ESP")
                ?.path
            }
          />
        </clipPath>
      </defs>
      <g
        clipPath="url(#spain-boundary)"
        className="highways"
        visibility={highways ? "visible" : "hidden"}
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
});

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
  return (
    <g
      transform={`translate(${city.x} ${city.y}) scale(${scale})`}
      className={`city ${city.major ? "major" : ""} ${selected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${city.name}`}
      aria-pressed={selected}
      onClick={() => controller.focusCity(city)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          controller.focusCity(city);
        }
      }}
    >
      <rect
        className="city-hit"
        x={Math.min(
          -10,
          (city.dx ?? 9) < 0
            ? (city.dx ?? 9) - city.name.length * (city.major ? 7.5 : 5.8)
            : (city.dx ?? 9),
        )}
        y={Math.min(-10, (city.dy ?? -8) - 14)}
        width={labels ? city.name.length * (city.major ? 7.5 : 5.8) + 22 : 20}
        height={
          labels
            ? Math.max(10, (city.dy ?? -8) + 4) -
              Math.min(-10, (city.dy ?? -8) - 14)
            : 20
        }
        rx="3"
      />
      <circle className="city-dot" r={city.major ? 4.3 : 2.7} />
      {labels && (
        <text
          x={city.dx ?? 9}
          y={city.dy ?? -8}
          textAnchor={(city.dx ?? 9) < 0 ? "end" : "start"}
        >
          {city.name}
        </text>
      )}
      <title>{city.name}</title>
    </g>
  );
}

export function Map({
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

  return (
    <div className="map-viewport">
      <svg
        ref={svgRef}
        className="map"
        data-detail={view.width < 700}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        role="group"
        tabIndex={0}
        aria-label="Mapa de la península ibérica. Arrastra para mover; usa las flechas o los controles para explorar."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onKeyDown={keyPan}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <title>España, ciudad a ciudad</title>
        <BaseLayers
          geography={geography}
          highways={state.layers.highways}
          layers={state.layers}
        />
        {state.layers.highways && state.layers.labels && view.width < 300 && (
          <g className="road-labels" aria-hidden="true">
            {geography.highways
              .filter(
                (road) =>
                  road.ref !== "Sin referencia" &&
                  road.ref !== "Red principal" &&
                  road.ref.length < 15 &&
                  road.x > view.x &&
                  road.x < view.x + view.width &&
                  road.y > view.y &&
                  road.y < view.y + view.height,
              )
              .map((road) => (
                <g
                  key={road.ref}
                  transform={`translate(${road.x} ${road.y}) scale(${cityScale})`}
                >
                  <rect
                    x={-road.ref.length * 3.4 - 4}
                    y="-9"
                    width={road.ref.length * 6.8 + 8}
                    height="18"
                    rx="3"
                  />
                  <text textAnchor="middle" y="3">
                    {road.ref}
                  </text>
                </g>
              ))}
          </g>
        )}
        <g className="sea-labels" aria-hidden="true">
          <text x="10" y="360" transform="rotate(-90 10 360)">
            OCÉANO ATLÁNTICO
          </text>
          <text x="950" y="730" transform="rotate(-55 950 730)">
            MAR MEDITERRÁNEO
          </text>
        </g>
        <NatureLabels
          nature={geography.nature}
          state={state}
          scale={cityScale}
        />
        {state.layers.cities && (
          <g className="cities">
            {[...geography.cities]
              .sort((a, b) => Number(a.major) - Number(b.major))
              .map((city) => (
                <CityMarker
                  key={city.name}
                  city={city}
                  selected={state.selectedCity === city.name}
                  labels={state.layers.labels}
                  scale={cityScale}
                  controller={controller}
                />
              ))}
          </g>
        )}
      </svg>
    </div>
  );
}
