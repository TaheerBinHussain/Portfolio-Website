# Taheer Bin Hussain - portfolio

Static site: plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html          all content (semantic, readable without JS)
css/styles.css      design tokens, layout, responsive rules, motion
js/main.js          header state, nav, stack explorer, project tabs, timeline filter, copy-email, reveals, letter/word animations, count-up numbers, monitor tilt, local clock
js/lenis.min.js     smooth, weighted scrolling on desktop (Lenis, MIT); skipped for touch and reduced motion
js/buddy.js         Kiko, the 3D fox in the contact section (three.js, bundled; loads only near the end of the page)
src/buddy-src.js    readable source for js/buddy.js
assets/             photo (webp + jpg, 1x/2x), favicon, OG image, self-hosted fonts
assets/logos/       brand and tool logos (Devicon, MIT; Simple Icons, CC0)
404.html            branded not-found page (Netlify, Vercel and GitHub Pages pick it up automatically)
```

## Kiko
Kiko is built from simple 3D shapes with three.js and follows the cursor anywhere on the page. Click it to make it hop.
To change it, edit `src/buddy-src.js`, then rebuild:

    npm i three esbuild
    npx esbuild src/buddy-src.js --bundle --minify --format=esm --outfile=js/buddy.js

Kiko loads as a JavaScript module, so open the site through a web server (below), not by double-clicking index.html.

## Design system
Tokens follow the "Dylanbrouwer" style reference (monochrome + ember orange #ff6436).
The reference's commercial fonts are swapped for free, self-hosted stand-ins:

| Reference            | Used here     | Role                                 |
|----------------------|---------------|--------------------------------------|
| ABC Gravity Variable | Anton         | Monument display type (96px and up)  |
| Die Grotesk B        | Geist, 500    | Body and headings                    |
| IBM Plex Mono        | IBM Plex Mono | Uppercase labels, nav, metadata      |

If you license the originals, add their @font-face rules and change `--font-display` / `--font-text` in css/styles.css.

## Run locally
    python3 -m http.server 8080     # then open http://localhost:8080

## Deploy
Upload the folder as-is to GitHub Pages, Netlify, Vercel or any static host.
After deploying, change `og:image` / `twitter:image` in index.html to the full URL
(e.g. https://yourdomain/assets/og-image.jpg) so link previews show the image,
and add `<link rel="canonical" href="https://yourdomain/">`.

## Editing content
- New internship case study: copy one `<article class="case">` block and add a matching
  `<button role="tab">` in `.track` (ids must match `aria-controls`).
- Hero stack layers (inside the monitor): edit the `.layer-detail` blocks and the matching `.layer` button.
- Timeline: add `<li class="ev" data-type="work|research|project|academic">` inside the right year.

## Extras
- Press Ctrl+K (Cmd+K on Mac) or "/" to open the command palette and jump to any section, project or action.
- Repository links show live language, last-update month and stars from the public GitHub API.
  Results are cached for an hour per visit; if GitHub does not answer, nothing is shown.
- Kiko dozes off after 15 quiet seconds and wakes on the next movement.

## Accessibility and motion
- Every animation is skipped for visitors who turn on "reduce motion" in their system settings.
- The hero demo stops the moment a visitor moves into the screen, clicks, scrolls, taps or presses a key.
- Checked with axe-core (0 violations) and Lighthouse.
- Printing the page produces a clean document with every case study expanded.

## Logos
Company and tool logos are used to identify the certifications and tools named on the page.
They belong to their owners (Amazon Web Services, Coursera, The Linux Foundation and the listed projects).
