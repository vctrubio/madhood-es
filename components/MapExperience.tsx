"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Map } from "./Map";
import { Controller } from "./Controller";
import { MapModel } from "@/map/MapModel";
import { MapController } from "@/map/MapController";
import type { Geography } from "@/map/types";

export function MapExperience({ geography }: { geography: Geography }) {
  const [controller] = useState(() => new MapController(new MapModel()));
  const state = useSyncExternalStore(
    controller.model.subscribe,
    controller.model.getSnapshot,
    controller.model.getServerSnapshot,
  );

  return (
    <main className="map-experience" data-detail={state.viewport.width < 700}>
      <header className="brand">
        <Link href="/" aria-label="Madhood España, inicio">
          m<span>a</span>dhood<span className="brand-period">.</span>
          <sup>ES</sup>
        </Link>
        <p>UN PAÍS. TODOS LOS CAMINOS.</p>
      </header>
      <Map geography={geography} controller={controller} state={state} />
      <Controller controller={controller} state={state} />
      <div className="map-caption">
        <span className="eyebrow">01 / TERRITORIO</span>
        <h1>
          España, <br />
          ciudad a ciudad.
        </h1>
        <p>El siguiente lugar empieza en el mapa.</p>
      </div>
      <div className="map-compass" aria-hidden="true">
        <span>N</span>
        <i>↑</i>
      </div>
      <footer className="map-footer">
        <div className="legend">
          <span>
            <i className="legend-city" />
            {geography.cities.length} ciudades
          </span>
          <span>
            <i className="legend-road" />
            Autovías y rondas
          </span>
          <span>
            <i className="legend-park" />
            Parques
          </span>
          <span>
            <i className="legend-water" />
            Agua
          </span>
          <span>
            <i className="legend-landscape" />
            Paisajes
          </span>
        </div>
        <p className="map-hint" aria-live="polite">
          {state.selectedCity ?? "Arrastra para explorar · Pulsa una ciudad"}
        </p>
        <small>
          <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>{" "}
          · <a href="https://openfreemap.org/">OpenFreeMap</a> ·{" "}
          <a href="https://openmaptiles.org/">OpenMapTiles</a> ·{" "}
          <a href="https://www.naturalearthdata.com/about/terms-of-use/">
            Natural Earth
          </a>
        </small>
      </footer>
    </main>
  );
}
