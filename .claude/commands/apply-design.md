---
description: Switch the site to a design from awesome-claude-design (usage /apply-design <brand>)
argument-hint: <brand, e.g. linear.app>
---

Apply the design "$ARGUMENTS" to this project.

1. Run `yarn design $ARGUMENTS --force` to write the new `DESIGN.md`. If the brand is unknown, run `yarn design:list` and ask which one was meant.
2. If `themes/<brand>.css` already exists, copy it to `src/theme.css`, run `yarn build` and stop.
3. Otherwise read `DESIGN.md` in full: the front matter (colors, typography, rounded) and the Colors, Typography, Shapes and Do's and Don'ts sections.
4. Rewrite ONLY `src/theme.css`:
   - Map the palette to the shadcn tokens (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--card`, `--chart-*`) in `:root` and `.dark`. If the design is dark-only, make `:root` dark and keep `.dark` identical. If it is light-only, derive a sensible `.dark`.
   - Set `--font-body`, `--font-display` and the Google Fonts `@import` at the top. Use a free substitute when the design names a paid font, as the DESIGN.md suggests.
   - Set `--radius` from the design's default rounded value.
   - Update the "Current design" line in the header comment.
5. If the design needs a style that tokens cannot express (gradients, shadows, uppercase headings), add a small, named rule to `src/styles.css` under `@layer base`, not inline in components.
6. Do not edit components or routes to restyle them. If a component hardcodes a color, fix it to use a token.
7. Save a copy of the finished theme as `themes/<brand>.css`, so the next switch is instant. Run `yarn build`, then report the tokens that changed in a short list and anything in the design that could not be mapped.
