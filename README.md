# Avinity Signature Photo Maker

Self-serve tool for the Avinity Health team to prep portrait photos for their email signatures.

## What it does

1. Team member uploads a portrait (JPG/PNG/WebP)
2. Crops to fit the signature aspect ratio
3. Removes the background (client-side, `@imgly/background-removal`)
4. Previews against the actual Avinity signature layout
5. Downloads transparent PNG

The PNG is then uploaded as the avatar in Signature Hound.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (Avinity brand tokens: `#015A66` dark teal, `#1FA9B3` cyan, `#CFE6F7` light blue)
- `@imgly/background-removal` — runs the ONNX model in the browser, no server processing
- `react-easy-crop` for the crop step
- `@tabler/icons-react` for icons

Background removal model (~10MB) downloads to the user once, then caches. No photo ever leaves the browser.

## Develop

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

## Build + Deploy (Railway)

```bash
pnpm build
pnpm preview
```

Railway auto-detects via `railway.json`. Domain: `avinity.devalok.dev` (or similar).

## Files

- `src/App.tsx` — entire UI flow (upload → crop → process → ready)
- `public/logo.png` — Avinity dribbble mark
- `public/signature-bg.png` — combined bg used in the live signature, for the preview step
- `tailwind.config.js` — Avinity color tokens
