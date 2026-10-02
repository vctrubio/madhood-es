import { MapExperience } from "@/components/MapExperience";
import geography from "@/public/data/iberia.json";

import nature from "@/public/data/nature.json";

export default function Home() {
  return <MapExperience geography={{ ...geography, nature }} />;
}
