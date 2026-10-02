<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Use the clean-return skill: parent component returns compose named subcomponents. Keep calculations and event handlers above JSX.
- Colocate CSS with the component it styles. Keep `app/globals.css` limited to shared defaults, tokens and accessibility utilities.
- `components/map/MapController.ts` is the MVC command class. `components/map/MapToolbar.tsx` is the controls view; do not name a UI component Controller.
- Preserve the independent map model/controller architecture.
- Keep visitor copy in Spanish and editable editorial content in `config.json`.

- Use standard Tailwind utilities and named theme tokens for new UI; no arbitrary-value bracket classes. Keep special SVG rules colocated.
- Browser/frontend testing is user-owned: do not invoke browser agents unless explicitly requested again.
- The brand and all page titles are `MAD Hood`. Never label the product `MAD Madrid`.
