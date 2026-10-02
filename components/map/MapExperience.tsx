"use client";

import { useState, useSyncExternalStore } from "react";
import { MapView } from "./MapView";
import { MapToolbar } from "./MapToolbar";
import Link from "next/link";
import { INITIAL_STATE, MapModel } from "@/components/map/MapModel";
import { MapController } from "@/components/map/MapController";
import type { Geography } from "@/components/map/types";
import "./MapExperience.css";

function MapCaption() {
  return (
    <div className="map-caption">
      <span className="eyebrow">01 / TERRITORIO</span>
      <h1>
        España,
        <br />
        ciudad a ciudad.
      </h1>
      <p>El siguiente lugar empieza en el mapa.</p>
    </div>
  );
}

function MapCompass() {
  return (
    <div className="map-compass" aria-hidden="true">
      <span>N</span>
      <i>↑</i>
    </div>
  );
}

function MapLegend({ cityCount }: { cityCount: number }) {
  return (
    <div className="legend">
      <span>
        <i className="legend-city" />
        {cityCount} ciudades
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
  );
}

function MapAttribution() {
  return (
    <small>
      <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> ·{" "}
      <a href="https://openfreemap.org/">OpenFreeMap</a> ·{" "}
      <a href="https://openmaptiles.org/">OpenMapTiles</a> ·{" "}
      <a href="https://www.naturalearthdata.com/about/terms-of-use/">
        Natural Earth
      </a>
    </small>
  );
}

function MapFooter({
  cityCount,
  selectedCity,
}: {
  cityCount: number;
  selectedCity: string | null;
}) {
  const hint = selectedCity ?? "Arrastra para explorar · Pulsa una ciudad";

  return (
    <footer className="map-footer">
      <MapLegend cityCount={cityCount} />
      <p className="map-hint" aria-live="polite">
        {hint}
      </p>
      <nav aria-label="Mapas">
        <Link href="/">Madrid</Link>
        {" · "}
        <Link href="/iberia" prefetch={false}>
          Iberia
        </Link>
        {" · "}
        <Link href="/dev">Desarrollo</Link>
      </nav>
      <MapAttribution />
    </footer>
  );
}

type MapExperienceProps = { geography: Geography; initialCity?: string };

function createMapController(geography: Geography, initialCity?: string) {
  const city = geography.cities.find((city) => city.name === initialCity);
  if (!city) return new MapController(new MapModel());

  const initialState = {
    ...INITIAL_STATE,
    viewport: { x: city.x - 40, y: city.y - 32, width: 80, height: 64 },
    selectedCity: city.name,
  };
  return new MapController(new MapModel(initialState));
}

export function MapExperience({ geography, initialCity }: MapExperienceProps) {
  const [controller] = useState(() =>
    createMapController(geography, initialCity),
  );
  const state = useSyncExternalStore(
    controller.model.subscribe,
    controller.model.getSnapshot,
    controller.model.getServerSnapshot,
  );
  const detailed = state.viewport.width < 700;
  const cityCount = geography.cities.length;

  return (
    <main className="map-experience" data-detail={detailed}>
      <MapView geography={geography} controller={controller} state={state} />
      <MapToolbar controller={controller} state={state} />
      <MapCaption />
      <MapCompass />
      <MapFooter cityCount={cityCount} selectedCity={state.selectedCity} />
    </main>
  );
}
