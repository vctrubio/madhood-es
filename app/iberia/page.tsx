import type { Metadata } from "next";
import { MapExperience } from "@/components/map/MapExperience";
import geography from "@/public/data/iberia.json";

import nature from "@/public/data/nature.json";

export const metadata: Metadata = {
  title: "MAD Hood",
  description:
    "Explora la península ibérica: ciudades de España, autovías, rondas, parques y paisajes.",
};

export default function IberiaPage() {
  return <MapExperience key="iberia" geography={{ ...geography, nature }} />;
}
