# Ambi

**Browser-based tool for creating 3D-printable [ambigrams](https://en.wikipedia.org/wiki/Ambigram) from two words of the same length.**

👉 **[Live demo → ambi.janosilles.com](https://ambi.janosilles.com)**

Successor to [3dwords.rekettye.com](https://3dwords.rekettye.com/) ([GitHub](https://github.com/ijanos/two-words-one-stl)).

## Features

- 3D ambigram generation from any two equal-length words
- Multiple fonts with per-side font selection (some combos may yield weird results)
- Adjustable letter spacing
- STL export for 3D printing
- Optional base platform with configurable height
- Perspective and orthographic camera modes
- Normal vector and wireframe visualizations
- Warnings for floating-geometry issues

## How it works

Everything runs client-side. No server, no tracking, no cookies.

[Three.js](https://threejs.org/) handles 3D rendering, STL export, and font outline loading. Solid creation, rotation, and Boolean intersections happen in [Manifold](https://manifoldcad.org/)'s WebAssembly module. The UI is vanilla TypeScript transpiled to JavaScript, built with [Vite](https://vite.dev/).

## Browser support

Requires WebGL and WebAssembly.

## Installation & development

```sh
npm install
npm run dev      # start dev server
npm run build    # type-check, lint, and build for production
npm run preview  # preview the production build
```

### Adding fonts

Fonts are stored as `*.typeface.json` files in `src/assets/fonts/`. The catalog is auto-generated during `npm run dev` and `npm run build` via the `generate:fonts` script.

To add a new font, drop a valid typeface JSON file into `src/assets/fonts/` and rebuild. Fonts are sourced from [components-ai/typefaces](https://github.com/components-ai/typefaces), Three.js and Google Fonts. Converted with [facetype.js](https://gero3.github.io/facetype.js/) when needed.

## License

Source code is dual-licensed under either of:

- Apache License, Version 2.0 ([LICENSE](LICENSE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE](LICENSE) or http://opensource.org/licenses/MIT)

at your option.

Font files have their own licenses mentioned in the `*.typeface.json` files.
