import type { HoodRegistryEntry, MadridGeography } from "./MadridTypes";

export function applyHoodRegistry(
  geography: MadridGeography,
  registry: HoodRegistryEntry[],
): MadridGeography {
  const slugs = new Set<string>();
  const geometry = new Map(geography.hoods.map((hood) => [hood.code, hood]));
  for (const entry of registry) {
    if (
      !entry.slug ||
      !entry.name ||
      typeof entry.activo !== "boolean" ||
      slugs.has(entry.slug)
    ) {
      throw new Error(
        `Invalid or duplicate entry in config/hoods.json: ${entry.slug}`,
      );
    }
    slugs.add(entry.slug);
  }
  const hoods = registry
    .filter((entry) => entry.activo)
    .map((entry) => {
      const hood = geometry.get(entry.slug);
      if (!hood)
        throw new Error(`Missing map geometry for active hood: ${entry.slug}`);
      return { ...hood, name: entry.name };
    });
  return { ...geography, hoods };
}
