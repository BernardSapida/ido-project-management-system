# Landing page images

Drop the architecture renders here to replace the brand-gradient placeholders on
the home page. Filenames must match exactly (referenced in `src/routes/index.tsx`):

| File                 | Where it appears        | Suggested size  |
| -------------------- | ----------------------- | --------------- |
| `ido-hero.jpg`       | Hero panel (right side) | ~1200×900 (4:3) |
| `ido-building-1.jpg` | Gallery — first tile    | ~800×600 (4:3)  |
| `ido-building-2.jpg` | Gallery — second tile   | ~800×600 (4:3)  |
| `ido-building-3.jpg` | Gallery — third tile    | ~800×600 (4:3)  |

Until the files exist, each panel shows the brand gradient (no broken image), so
the page always looks intentional. The overlay is painted from palette tokens
rather than a fixed colour, so it follows whatever `THEME.palette` is set to.

`logo.png` and the two `logo-lockup*.svg` files are the template's own brand
fixtures — the lockups exist so the site-header lab has a real horizontal asset
to size. They are not IDO assets.
