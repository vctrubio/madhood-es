import type { Metadata } from "next";
import { MadridExperience } from "@/components/map/MadridExperience";
import { applyHoodRegistry } from "@/components/map/HoodRegistry";
import geography from "@/public/data/madrid.json";
import registry from "@/config/hoods.json";

export const metadata: Metadata = {
  title: "MAD Hood",
  description:
    "Explora los barrios de Madrid, sus calles principales, la M-30 y la M-40.",
};

export default function Home() {
  const madrid = applyHoodRegistry(geography, registry);

  return <MadridExperience geography={madrid} />;
}
