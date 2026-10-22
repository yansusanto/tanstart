# tanstart

A starter for new websites: TanStack Start on Cloudflare Workers, with a design you pick from a collection of ready-made design systems. Scores 100 on all four Lighthouse categories out of the box.

**Stack:** TanStack Start (React, file-based routing, server functions), Tailwind CSS v4, shadcn/ui, TanStack Query, Biome, Cloudflare Workers.

## Start a new site

1. On GitHub, click **Use this template** and create the new repo, then clone it.
2. Install and run the setup:

   ```bash
   yarn install
   yarn init-site
   ```

3. Enter the project name, then pick a design. Type a number, a brand name, or any text to filter the list (for example `dark` or `bank`). Press Enter to keep the default, **Cursor**.
4. Start the dev server:

   ```bash
   yarn dev
   ```

   The site runs at http://localhost:4000.

`yarn init-site` sets `name` in `package.json` and `wrangler.jsonc`, so each site becomes its own Worker and never overwrites another.

## Designs

Designs come from [awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design), downloaded with the [`getdesign`](https://www.npmjs.com/package/getdesign) CLI. A design is a `DESIGN.md` file that describes colors, typography, shape and components.

| Command | What it does |
|---|---|
| `yarn design:list` | Lists the available brands. |
| `yarn design <brand>` | Downloads `DESIGN.md` for that brand. Add `--force` to replace the current one. |
| `/apply-design <brand>` | Claude Code command. Downloads the design and rewrites `src/theme.css` from it. |

**How switching works.** `src/theme.css` is the only file that holds colors, fonts and radius. Components use theme tokens through Tailwind classes (`bg-primary`, `text-muted-foreground`, `rounded-lg`) and never hardcode colors, so changing the design is a one-file change.

Themes that have been applied before are saved in `themes/` (`cursor`, `opencode.ai`, `claude`), so switching back is instant. A new design is mapped by Claude the first time and saved there. Ask Claude "apply stripe" or run `/apply-design stripe`.

The designs are unofficial, inspired-by starting points. Adapt them into an original identity rather than copying a brand.

### Fonts

Fonts are self-hosted through `@fontsource-variable/*` packages imported at the top of `src/theme.css`. Do not use Google Fonts links, because they block rendering and lower the Lighthouse score. Several designs name paid fonts, so the themes use free substitutes (Inter, Newsreader, JetBrains Mono).

### Heading style

The starter leaves headings plain. Each theme still defines `--font-display`, `--heading-weight` and `--heading-tracking`, so a real site can opt in by adding this to `src/styles.css`:

```css
@layer base {
  h1, h2, h3 {
    font-family: var(--font-heading);
    font-weight: var(--heading-weight);
    letter-spacing: var(--heading-tracking);
  }
}
```

The `font-heading` utility class is also available for single elements.

### Dark mode

Press **d** to toggle dark mode. The page follows the system setting until toggled, then remembers the choice. The hotkey is ignored while typing in a field.

## Deploy

Deploys target Cloudflare Workers.

```bash
yarn deploy
```

This runs `yarn build` and `wrangler deploy`. Run `npx wrangler login` first if the machine is not signed in.

**Automatic deploys.** In the Cloudflare dashboard, open **Workers & Pages**, choose the Worker, and connect the Git repo under **Settings**, then **Builds**. Each push to `main` then builds and deploys.

**Domains.** Add the domain under the Worker's **Settings**, then **Domains & Routes**, then **Custom domain**. To redirect `www` to the apex domain, add a proxied `CNAME` for `www` and a redirect rule from `https://www.example.com/*` to `https://example.com/${1}` (301, preserve query string). Domains are set per site in the dashboard and are intentionally not stored in this template.

## Modules

Optional features live in `modules/<name>/`. A module has a `module.json` (packages, scripts, Cloudflare bindings, secrets, notes) and a `files/` tree that is copied into the site. `yarn init-site` offers them after the design, and the choice is recorded in `starter.json`.

```bash
yarn add-module          # list modules
yarn add-module auth     # add one to an existing site
```

| Module | What it adds |
|---|---|
| `auth` | Email and password accounts with [Better Auth](https://www.better-auth.com), stored in Cloudflare D1 through Drizzle. Adds `/login`, a protected `/account` page, `getSession` for route guards, and SQL migrations. |
| `dashboard` | A [shadcn/ui](https://ui.shadcn.com) sidebar dashboard inside `/account`: overview with stat cards and a table, a settings page that edits the profile name, and a user menu with sign out. Requires `auth`, which is added automatically. |

**Auth setup.** Locally it works right after the module is added: run `yarn dev` and open `/login`. A random `BETTER_AUTH_SECRET` is written to `.dev.vars` and the local D1 database is migrated. For production, run `yarn auth:setup` once. It creates the D1 database, saves its id in `wrangler.jsonc`, applies the migrations and prints a secret to add to the Worker (dashboard: **Settings**, then **Variables and secrets**). Commit `wrangler.jsonc` afterwards. Protect a page by copying the `beforeLoad` guard from `src/routes/account.tsx`.

**Dashboard.** Pages live in `src/routes/account/`. To add one, create the route file, then add it to the `items` list in `src/components/app-sidebar.tsx` and to `titles` in `src/routes/account.tsx`. The overview numbers are placeholders. The sidebar follows the site's design tokens, so it restyles with every design.

To change the auth tables, edit `src/db/schema.ts`, run `yarn db:generate`, then `yarn db:migrate:local` and `yarn db:migrate:remote`.

## Updating a site from the template

GitHub templates copy the files once, so a site does not receive later starter changes on its own. In the site, run the Claude Code command:

```
/update-starter
```

It adds this repo as a `template` remote, works out what changed since the site was last synced (recorded in `.starter-sync`), and applies those changes. It never overwrites the site's design (`src/theme.css`, `DESIGN.md`, `themes/`), name, domains or page content. It runs the build, leaves the changes uncommitted for review, and reports what it did. Sites created before this command existed need the file `.claude/commands/update-starter.md` copied in once.

## Project structure

```
src/
  routes/            File-based routes. __root.tsx holds the document shell and default meta tags.
  components/ui/     shadcn/ui components.
  components/        Site components (theme-hotkey.tsx).
  theme.css          Design tokens: colors, fonts, radius. The file that changes per design.
  styles.css         Maps tokens into Tailwind. Rarely changes.
themes/              Saved theme.css files, one per design.
scripts/init.mjs     The yarn init-site prompt.
scripts/modules.mjs  Adds a module (yarn add-module).
modules/             Optional features: auth, and more over time.
starter.json         Modules installed in this site.
.claude/commands/    The /apply-design and /update-starter commands.
DESIGN.md            The active design, downloaded by getdesign.
AGENTS.md            Project rules for Claude and other coding agents.
```

Add shadcn/ui components with `npx shadcn@latest add <component>`. They already read the theme tokens.

## Scripts

| Script | Purpose |
|---|---|
| `yarn dev` | Dev server on port 4000. |
| `yarn build` | Production build. |
| `yarn preview` | Serve the production build locally. |
| `yarn deploy` | Build and deploy to Cloudflare. |
| `yarn check` | Biome lint and format check. |
| `yarn init-site` | First-run setup: project name, design and modules. |
| `yarn add-module <name>` | Add a module to this site. |
| `yarn design <brand>` | Download a `DESIGN.md`. |
| `yarn design:list` | List available designs. |

## Keeping the Lighthouse score at 100

- Give every route a `description` meta tag. The root route has a default.
- Keep text contrast at 4.5:1 or better. When a design's brand color fails with white text, use its darker shade (Cursor uses `#d04200`).
- Avoid render-blocking third-party requests. The production build inlines the CSS.
- Keep a favicon in `public/`.

## Notes

- Dev port is 4000, to avoid clashing with other projects on 3000.
- The TanStack devtools panel appears in development only and is removed from production builds.
