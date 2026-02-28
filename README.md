
# Interactive Ecosystem

Interactive Ecosystem is a real-time 3D particle dynamics visualization built with Vite, React, and Three.js. It features interactive physics-based particles that respond to cursor movement and dynamically connect based on proximity.

Key features:

- **3D Physics Simulation** — Particle dynamics with repulsion, mouse influence, and return forces
- **Interactive Controls** — Move your cursor to influence particle behavior in real-time
- **Multiple Color Themes** — Switch between 5 distinct visual themes (Mono, Blue, Purple, Cyan, Red)
- **Dynamic Connections** — Particles automatically connect with lines when within proximity
- **Smooth Rendering** — Three.js with fog effects and optimized WebGL rendering
- **Fast Development** — Vite HMR for instant feedback during development

## Demo

Run the interactive 3D visualization locally to see particles respond to your mouse movement and automatically form connections. The app includes real-time physics simulation with 5 selectable color themes.

## Prerequisites

- Node.js v16 or newer
- npm (or yarn/pnpm)
- Modern browser with WebGL support

## Install

Install dependencies:

```bash
npm install
```

## Development

Start the dev server with hot-reload:

```bash
npm run dev
```

Then open the URL shown by Vite (usually http://localhost:5173).

## Build & Preview

Create an optimized production build:

```bash
npm run build
```

Preview the built site locally:

```bash
npm run preview
```

## Project Structure

- `index.html` — app shell
- `vite.config.js` — Vite configuration
- `src/` — source files
	- `main.jsx` — app entry
	- `App.jsx` — main React component
	- `assets/` — images and static assets
- `public/` — static files copied to the build
- `package.json` — scripts and dependencies

## Development Tips

- **Customize Physics** — Edit particle count, mass ranges, repulsion forces, and mouse influence in `src/App.jsx`
- **Add Color Themes** — Define new themes in the `themes` object in `src/App.jsx`
- **Adjust Visual Properties** — Modify particle geometry, line rendering opacity, and fog density
- **Performance Tuning** — Use browser DevTools to profile frame rates and optimize particle count for your target hardware
- **Scene Behavior** — Camera orbits the scene while particles maintain position memory and return forces

## Contributing

Contributions are welcome. Open an issue to discuss major changes, then send a PR. Keep commits focused and add short descriptions.

## License

This repository includes a top-level `LICENSE` file — see it for license details.

---