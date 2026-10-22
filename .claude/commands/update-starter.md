---
description: Pull the latest changes from the tanstart template into this site, keeping the site's own design, name and content
---

Update this project from the template repo https://github.com/yansusanto/tanstart (branch `main`).

Rules: never touch the site's own identity. Do not commit. Leave the changes in the working tree so they can be reviewed.

1. **Remote.** If no git remote named `template` exists, add it: `git remote add template https://github.com/yansusanto/tanstart.git`. Run `git fetch template`.
2. **Baseline.** Read `.starter-sync` (one line: the last template commit applied). If it does not exist, use the newest template commit made before this project's first commit: `git rev-list -1 --before="$(git log --reverse --format=%cI | head -1)" template/main`. Show the baseline and ask for confirmation if it looks wrong.
3. **What changed.** Run `git diff --stat <baseline> template/main` and `git log --oneline <baseline>..template/main`. If nothing changed, say so and stop.
4. **Protected files (site-specific, never overwrite):**
   - `src/theme.css`, `DESIGN.md`, `themes/` (the site's design)
   - `src/routes/*` page content (take only structural fixes, such as meta handling in `__root.tsx`, and apply them by hand without losing the site's titles, descriptions and content)
   - `README.md`, `public/` assets the site replaced (favicon, images)
   - `name` in `package.json` and `wrangler.jsonc`, and any `routes`/domains in `wrangler.jsonc`
5. **Everything else** (scripts, `src/components/`, `src/styles.css`, `scripts/`, `.claude/commands/`, `AGENTS.md`, `biome.json`, config files): apply the template's change for each file that differs between the baseline and `template/main`. If the site also changed the same file since the baseline, merge by hand and keep both intents. Use `git diff <baseline> template/main -- <file>` and apply it with `git apply --3way` where possible.
6. **Dependencies.** Apply new or bumped entries from the template's `package.json` (dependencies, devDependencies, scripts) without changing the site's name or its own extra packages. Then run `yarn install`.
7. **Check.** Run `yarn build` and `yarn check`. Fix anything the update broke.
8. **Record.** Write the template's current commit (`git rev-parse template/main`) to `.starter-sync`.
9. **Report** in a short list: commits applied, files changed, files skipped as protected, conflicts resolved by hand, and anything the user should look at. Do not commit or push.
