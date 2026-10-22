# Project notes

## Design system

Each site picks one design from the awesome-claude-design collection (https://github.com/VoltAgent/awesome-claude-design).

- `yarn design:list` lists the available brands.
- `yarn design <brand>` writes `DESIGN.md` at the project root. Add `--force` to replace it.
- `/apply-design <brand>` (Claude command in `.claude/commands/`) downloads the design and rewrites `src/theme.css` from it. Use this to switch designs.
- `yarn init-site` runs once on a new project: sets the project name, lists the designs, and applies the one chosen (Enter keeps Cursor, the default). Themes already saved in `themes/` apply instantly. Others are mapped by Claude through `/apply-design` and then saved to `themes/`.
- `src/theme.css` is the only file that holds colors, fonts and radius. `src/styles.css` maps those tokens into Tailwind and rarely changes.
- Components and routes must use theme tokens through Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`). Never hardcode hex colors, font names or pixel radii in components. This keeps a design switch to one file.
- Add UI with shadcn/ui (`npx shadcn@latest add <component>`), which already reads these tokens.
- The DESIGN.md files are unofficial, inspired-by starting points. Adapt them into an original identity and do not copy a brand directly.

## Stack

TanStack Start, React, Tailwind v4, shadcn/ui, TanStack Query, Biome. Dev server runs on port 4000. Deploys to Cloudflare Workers with `yarn deploy`. Set a unique `name` in `wrangler.jsonc` and `package.json` for each new site.
