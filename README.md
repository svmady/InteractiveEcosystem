
# Interactive Ecosystem

Interactive Ecosystem is a small Vite + React starter project for building interactive, browser-based ecosystem visualizations and simulations.

Key goals:

- Fast development with Vite HMR
- Minimal React component structure (see `src/App.jsx`)
- Lightweight build and preview scripts

## Demo

Open the project locally (see instructions below) to run the interactive demo served by Vite.

## Prerequisites

- Node.js v16 or newer
- npm (or yarn/pnpm)

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

- Edit `src/App.jsx` to change the main UI and behavior.
- Use the browser devtools to profile and inspect canvas/SVG rendering.
- Keep components small and stateless where practical for easier testing.

## Contributing

Contributions are welcome. Open an issue to discuss major changes, then send a PR. Keep commits focused and add short descriptions.

## License

This repository includes a top-level `LICENSE` file — see it for license details.

---