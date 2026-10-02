import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import type { MadridController } from "./MadridController";
import type { MadridState, MadridViewport } from "./MadridTypes";
import {
  HoodAreas,
  HoodNames,
  MadridBackground,
  MadridHighways,
  MadridRoadBadges,
  MadridStreetNames,
  MadridStreets,
} from "./MadridLayers";
import {
  MadridConstructionAreas,
  MadridConstructionNames,
} from "./MadridConstruction";
import { MadridMarkers } from "./MadridMarkers";
import "./MadridCanvas.css";

type CanvasProps = { controller: MadridController; state: MadridState };
type Drag = {
  id: number;
  x: number;
  y: number;
  viewport: MadridViewport;
  scale: number;
};

function MadridGeometry({
  controller,
  state,
  scale,
}: CanvasProps & { scale: number }) {
  const geography = controller.geography;
  return (
    <>
      <HoodAreas geography={geography} controller={controller} state={state} />
      <MadridBackground geography={geography} visible={state.layers.parks} />
      <MadridConstructionAreas
        projects={geography.construction}
        visible={state.layers.construction}
      />
      <MadridStreets geography={geography} visible={state.layers.streets} />
      <MadridHighways
        roads={geography.highways}
        visible={state.layers.highways}
      />
      <HoodNames geography={geography} state={state} scale={scale} />
      <MadridStreetNames geography={geography} state={state} scale={scale} />
      <MadridRoadBadges geography={geography} state={state} scale={scale} />
      <MadridConstructionNames
        projects={geography.construction}
        visible={state.layers.construction && state.layers.labels}
        scale={scale}
      />
      <MadridMarkers geography={geography} state={state} scale={scale} />
    </>
  );
}

export function MadridCanvas({ controller, state }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const view = state.viewport;
  const scale = Math.max(
    view.width / dimensions.width,
    view.height / dimensions.height,
  );
  const viewBox = `${view.x} ${view.y} ${view.width} ${view.height}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    function wheel(event: WheelEvent) {
      event.preventDefault();
      controller.zoom(event.deltaY > 0 ? 1.1 : 1 / 1.1);
    }
    observer.observe(svg);
    svg.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      svg.removeEventListener("wheel", wheel);
    };
  }, [controller]);

  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || drag.current) return;
    moved.current = false;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      viewport: view,
      scale,
    };
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const origin = drag.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (!moved.current && Math.hypot(dx, dy) < 5) return;
    moved.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    controller.setViewport({
      ...origin.viewport,
      x: origin.viewport.x - dx * origin.scale,
      y: origin.viewport.y - dy * origin.scale,
    });
  }
  function stop(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function lostCapture() {
    drag.current = null;
  }
  function captureClick(event: MouseEvent<SVGSVGElement>) {
    if (!moved.current) return;
    event.stopPropagation();
    moved.current = false;
  }
  function keyPan(event: KeyboardEvent<SVGSVGElement>) {
    const moves: Record<string, number[]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = moves[event.key];
    if (!direction) return;
    event.preventDefault();
    controller.pan(
      direction[0] * view.width * 0.08,
      direction[1] * view.height * 0.08,
    );
  }

  return (
    <svg
      ref={svgRef}
      className="madrid-canvas"
      viewBox={viewBox}
      role="group"
      tabIndex={0}
      aria-label="Mapa de barrios de Madrid. Arrastra para mover y usa las flechas para navegar."
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={lostCapture}
      onClickCapture={captureClick}
      onKeyDown={keyPan}
    >
      <MadridGeometry controller={controller} state={state} scale={scale} />
    </svg>
  );
}
