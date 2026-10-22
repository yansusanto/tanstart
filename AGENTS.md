# Project notes

## Design system

Each site picks one design from the awesome-claude-design collection (https://github.com/VoltAgent/awesome-claude-design).

- `yarn design:list` lists the available brands.
- `yarn design <brand>` writes `DESIGN.md` at the project root, for example `yarn design linear.app`. Add `--force` to replace an existing file.
- Before building or restyling UI, read `DESIGN.md` and apply its colors, typography and components through the Tailwind theme and shadcn/ui tokens in `src/styles.css`.
- The files are unofficial, inspired-by starting points. Adapt them into an original identity and do not copy a brand directly.

## Stack

TanStack Start, React, Tailwind v4, shadcn/ui, TanStack Query, Biome. Deploys to Cloudflare Workers with `yarn deploy`. Set a unique `name` in `wrangler.jsonc` for each new site.
