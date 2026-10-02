# Madrid map migration

Status: implemented locally; latest frontend review delegated to the user at their explicit request.

Source: `/Users/trtp/kode/ai-personal-agent/madhood`, HEAD `85093681b868a2e6bae1e8275a8180dfdb03fa5c`. Source workspace had unrelated edits; no source files were modified. Copied original generated geometry, hood registry, provenance and street-label placement algorithm. Target: `madhood-es`, current working branch.

User overrides: keep the feature in `components/map/`, use standard Tailwind and named tokens, keep component returns structural, preserve MAD Hood branding, and leave browser testing to the user. These override the migration skill's default folder/CSS conventions.

Retained: local streets, neighbourhood selection/search, active registry, pan/zoom, key streets, M-30 and outbound roads. Added: sourced M-40 and A-4, Soto residential outline, Pozuelo locality point, Retiro park, two rail-station points and three place markers. No transit routes migrated yet. No claims of property inventory or services.

Editable ownership: `config/hoods.json` for active visibility; `config/madrid-areas.json`, `madrid-stations.json`, `madrid-monuments.json`, `madrid-parks.json` for geographic additions; `config/madrid.json` for UI. Runtime geometry: `public/data/madrid.json`. Build script and checked-in sources reproduce it without network access.

Checks: lint and production build passed. Pure checks covered duplicate/missing registry entries, disabled areas, projection consistency, camera limits, selection/reset, M-40 containment, 34 active-area references, park/area closed geometry, A-4 presence, and stable station/monument IDs. Earlier desktop/mobile migration and dropdown checks completed; latest additions received no browser testing, as requested.

Limits: inherited editorial area names are not necessarily official units. Soto is a land-use outline. Pozuelo and La Moraleja are markers. OSM road/park snapshots are not live navigation. No train lines or live transport service information. Original source remains available for rollback; there were no database writes, deployments or Git pushes.
