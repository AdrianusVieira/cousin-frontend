# Cousin mark

Shinx with a `$` in place of its tail star and three electric sparks echoing the three
Chandelure flames in Mute's mark. Generated with the built-in image tool, then traced
from the two-ink production master into SVG contours. The character was not redrawn.

- `shinx-sparks-master.png`: generated production master. White is the full silhouette;
  cyan identifies accents. Black is negative space, not part of the vector mark.
- `../../src/lib/brandGeometry.ts`: shared full silhouette and accent contours, with
  interior cutouts preserved using even-odd fills. Traced at source resolution with
  0.8-pixel contour simplification; tiny components below 24 square pixels discarded.
- `../../src/components/BrandIcon.tsx`: inline SVG inheriting appearance tokens.
- `../../src/lib/brand.ts`: standalone SVG serialization for the favicon.
- `../../public/favicon.svg`: static light-mode fallback before the app starts.
- `preview.html`: five-palette review. With Vite running, open `/docs/brand/preview.html`.

The mark's body follows `--color-text` through `--brand-body`; all accents use
`--color-net`. `--brand-glow` is 0.55 for colored dark palettes, 0.2 for Monochrome,
and 0 for Light. Glow is static and only applies to the mark. All appearances retain
identical geometry. The favicon resolves the active root tokens whenever the stored
appearance changes, including cross-tab updates.

## Generation prompt

Use case: logo-brand. Edit this approved Cousin Shinx icon into a clean production master for vector tracing and theme recoloring.
Preserve its recognizable Shinx face, seated pose, tuft, big round ears, eyes, paws, curved tail, and unmistakable $ replacing the star at the tail tip. Preserve the overall existing proportions and friendly expression.
Add THREE prominent electric sparks that play the role of Mute's three Chandelure flames: one jagged lightning discharge above the tuft, one to the upper right of the right ear, and one to the left of the $ tail. These are electricity shapes, NOT flames, jagged branched lightning silhouettes, compact, energetic, tastefully spaced, not scattered tiny particles. Allow a little extra canvas space around the character so every spark has comfortable margin and nothing touches the edge.
IMPORTANT production rendering: ONLY TWO INK COLORS on a perfectly solid BLACK background, flat sharp-edged artwork, no glow, no gradients, no shadows, no texture, no 3D. Main Shinx outline, eyes outer rings, paws and tail stem in PURE WHITE #ffffff. All accent details (electric sparks, ear markings, iris interiors, ankle bands, nose and the $ tail tip) in PURE CYAN #00ffff. Dark holes and interiors pure black. The final app will recolor the cyan accent shapes according to the user's selected appearance and add the glow itself.
Keep the $ large and legible. Simplify double outlines and tiny details enough for a small app icon while preserving this exact character concept. Single centered icon on square canvas, no frame, no labels, no writing except the $ tail.
