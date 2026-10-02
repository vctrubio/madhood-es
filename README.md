# Madhood ES

Madhood — Madrid neighbourhoods.

A single Next.js landing page: an interactive SVG map of the Iberian peninsula, Spanish cities, and motorway connections. Portugal and France provide muted geographic context.

## Run

```sh
npm install
npm run dev -- --port 3001
```

Open http://localhost:3001. Production: `npm run build`, then `npm run start -- --port 3001`.

## Architecture

- `app/page.tsx`: loads the checked-in geography and renders the landing page.
- `map/MapModel.ts`: observable map state, independent of React and the DOM.
- `map/MapController.ts`: class exposing commands for layers, regional presets, camera movement, and city focus.
- `components/Map.tsx`: SVG view and pointer/keyboard input.
- `components/Controller.tsx`: top-right controller interface.
- `components/MapExperience.tsx`: connects model, controller, and views using `useSyncExternalStore`.
- `config/cities.json`: editable city coordinates, priorities, and label offsets.

One controller is created per mounted experience. Both the toolbar and map gestures use the same commands. To change visible content from a future feature, use the existing instance:

```ts
controller.setLayer("highways", false);
controller.setLayer("cities", true);
controller.setLayer("labels", true);
controller.setRegion("north");
controller.zoom(0.8);
controller.reset();
```

No mapping SDK, tiles, API key, database, or runtime geographic service is needed. Pan and zoom change the SVG viewBox. Country and road paths are simplified offline. City markers retain their screen size; secondary city names hide in the mobile overview and reappear when zoomed in.

## Geographic scope and sources

This is a **peninsular view**, so the islands, Ceuta, and Melilla are outside its scope. The city catalogue includes all 47 mainland provincial capitals and seven additional cities; this is an editorial selection, not a population ranking.

Country outlines: [Natural Earth 1:10m countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson), [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

Roads: [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors, ODbL, via [OpenFreeMap](https://openfreemap.org/) / [OpenMapTiles](https://openmaptiles.org/). The complete bounding-box OSM motorway snapshot supplies motorway geometry. The pinned September 27, 2026 tile release supplies the additional trunk network at zoom 9. Zoom 12 tiles around each city add primary, secondary, and tertiary roads named ronda or circunvalación, plus explicit VA-20/VA-30/Z-30/Z-40/M-30/M-40/M-50 references when present. Ramps and construction roads are excluded. Motorway ring roads are already part of the motorway layer. Clicking a city opens an urban view; road numbers appear at close zoom.

Roads are clipped to mainland Spain; Portuguese and French roads are not displayed. This is generalized source geometry, not turn-by-turn navigation or an exhaustive official inventory of every city's ring roads. Named urban roads are selected from a 3×3 tile area around each configured city; source naming and classification can omit secondary rings. Motorways and trunk roads are covered across the entire peninsula bounding box.

Compressed input snapshots and retrieval metadata live in `map/sources/`. `sourceDate` records the OSM base timestamp; the tile release date is recorded separately in provenance. Neither is the date an individual road was last updated. Country boundaries are generalized Natural Earth geometry, so clipping can affect roads immediately beside a coast or border.

Rebuild the map using Python 3 (standard library only):

```sh
python3 scripts/build-map.py map/sources/countries.geojson.gz map/sources/motorways.json.gz
```

Validation: `npm run lint` and `npm run build`.

To explicitly refresh the pinned tile import, install `mapbox-vector-tile` in a Python virtual environment and run `python3 scripts/import-roads.py`, then rebuild. This is a development-only import dependency. Change the pinned release in that script intentionally; runtime rendering stays entirely local.

## Natural features

`components/NatureLayers.tsx` renders the independent `parks`, `water`, and `landscapes` layers, controlled by the same MapController class. `public/data/nature.json` contains generalized OSM polygons clipped to mainland Spain: ten mainland national parks, other named natural and regional parks (including Sierra de Gredos), lakes/reservoirs and river surfaces, plus the protected Tabernas natural area. Dark and light greens distinguish national parks from other natural parks. Water geometry represents the source snapshot, not current water levels.

`config/landscapes.json` holds sourced editorial labels and symbolic anchors for Sierra de Gredos, Los Monegros, Tabernas, the Meseta Norte, La Mancha, and the Ebro and Guadalquivir valleys. These symbols do not delineate deserts or plains. Los Monegros is described as subdesert steppe by Aragón tourism. Source links, limitations, and the pinned tile release live in `map/sources/nature-provenance.json`. Island parks are outside this mainland view.

To regenerate natural polygons after the road tile import, run `python3 scripts/import-nature.py` in the same Python environment. It uses the local tile cache, `mapbox-vector-tile` and `shapely`; no new requests are needed. Compressed extracted source geometry is retained in `map/sources/nature.geojson.gz`.
