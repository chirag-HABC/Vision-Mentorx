Revert the light theme back to the previous light-blue palette (undo the cream-white change).

## Change
- `src/styles.css` `:root, .light` block: restore light-blue tokens.
  - `--background`, `--card`, `--popover`, `--muted`, `--secondary`, `--accent`, `--input`: cool light-blue tones (hue ~240–250)
  - `--border`: soft blue tint
  - `--foreground`: deep navy (unchanged for contrast)
  - `--primary` / `--ring`: vivid blue
  - Restore gradients (`--gradient-cyber`, `--gradient-aurora`, `--gradient-glow`) and shadows (`--shadow-glow`, `--shadow-neon`, `--shadow-cyber`) to blue tint
- Dark theme untouched. No component changes.