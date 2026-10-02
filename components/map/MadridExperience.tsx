"use client";

import { useState, useSyncExternalStore } from "react";
import content from "@/config/madrid.json";
import { MadridController } from "./MadridController";
import { MadridDirectory } from "./MadridDirectory";
import { MadridConstructionLegend } from "./MadridConstruction";
import { MadridCanvas } from "./MadridCanvas";
import { MadridToolbar, MadridZoomControls } from "./MadridToolbar";
import type { MadridGeography, MadridState } from "./MadridTypes";

function MapHeader() {
  return (
    <header className="flex h-24 shrink-0 items-center justify-end border-b border-map-line px-6 text-xs text-muted">
      <span className="hidden tracking-widest md:block">
        {content.overview}
      </span>
    </header>
  );
}

function MapAttribution() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 flex justify-between gap-3 border-t border-map-line bg-map-paper px-4 py-3 text-xs text-muted">
      <span className="hidden md:inline">{content.roads}</span>
      <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>
      <span className="hidden md:inline">Geometría: Madhood original</span>
    </footer>
  );
}

function MadridMapPanel({
  controller,
  state,
}: {
  controller: MadridController;
  state: MadridState;
}) {
  return (
    <section className="relative order-first min-h-0 flex-1 overflow-hidden bg-map-paper md:order-last">
      <MadridCanvas controller={controller} state={state} />
      <MadridToolbar controller={controller} state={state} />
      <MadridZoomControls controller={controller} />
      <MadridConstructionLegend
        projects={controller.geography.construction}
        visible={state.layers.construction}
      />
      <MapAttribution />
    </section>
  );
}

export function MadridExperience({
  geography,
}: {
  geography: MadridGeography;
}) {
  const [controller] = useState(() => new MadridController(geography));
  const state = useSyncExternalStore(
    controller.model.subscribe,
    controller.model.getSnapshot,
    controller.model.getServerSnapshot,
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-paper text-ink">
      <MapHeader />
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <MadridDirectory controller={controller} state={state} />
        <MadridMapPanel controller={controller} state={state} />
      </main>
    </div>
  );
}
