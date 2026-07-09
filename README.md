# Snap Cam

A browser-based webcam app — view your live camera feed, capture a photo, and download it. No accounts, no backend, no data ever leaves your browser.

## Live demo
Deployed via GitHub Pages: (https://shehryar-92.github.io/snap-cam/)

## How it works
Everything runs client-side using the browser's [`getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) API:

1. Camera only turns on when you click **Turn On Camera** — never automatically.
2. The live feed is rendered directly to a `<video>` element and never sent anywhere.
3. **Capture Photo** draws the current frame to an in-memory `<canvas>`.
4. **Download Photo** turns that canvas into a real PNG file saved to your device.
5. The camera is released the moment you close or navigate away from the tab.

## File structure

```
.
├── index.html              Markup + Tailwind design tokens only
├── styles.css              The handful of custom rules Tailwind doesn't cover
├── camera-helpers.js        Pure logic — no DOM, no browser APIs. Fully unit tested.
├── camera.js                DOM wiring: connects camera-helpers.js to getUserMedia/canvas/downloads
└── tests/
    └── camera-helpers.test.js   Plain Node test suite (no dependencies)
```

The split matters: `camera-helpers.js` contains every decision that can be reasoned about without a real camera or a real browser (what error message to show, what filename to generate, which device to switch to next, whether to mirror the preview). Because it has zero DOM dependencies, it can be tested with plain `node`, the same pattern used in the QR Snap project's `url-helper.js`.

`camera.js` is intentionally "dumb" — it just calls `navigator.mediaDevices.getUserMedia`, wires button clicks, and defers every actual decision to the helpers.

## Running the tests

No install step, no dependencies:

```bash
node tests/camera-helpers.test.js
```

Currently: **25 passing tests** covering error-message mapping, filename generation/sanitization, device-switching edge cases (0, 1, and many cameras), constraint building, and mirroring logic.

## Security & privacy notes

- **No backend, no network calls** other than loading Tailwind/fonts from their CDNs. There is nothing to send your photo *to*.
- **No storage**: no cookies, no `localStorage`, no `sessionStorage`, no analytics. Captured photos exist only as an in-memory blob URL until you download or leave the page.
- **Content-Security-Policy** meta tag in `index.html` restricts what the page is allowed to load/run (scripts limited to self + Tailwind's CDN, no inline scripts, no `object-src`), so even if a bug were introduced later, its blast radius is contained.
- **Audio is never requested.** `buildConstraints()` always sets `audio: false` — this is enforced by a test (`never requests audio, under any input`).
- **Filenames are sanitized**: `generateFilename()` only ever accepts a numeric timestamp and fixed prefix/extension, so there's no path-traversal or injection surface in the generated download name.
- **Requires HTTPS**: browsers only grant camera access on secure origins (or `localhost`). This works automatically on GitHub Pages; it will not work if you open `index.html` via `file://`.
- **Graceful permission handling**: denied permissions, missing cameras, and cameras already in use by another app each show a clear, specific message instead of failing silently (see `mapGetUserMediaError`).

## Deploying
Push this folder to a GitHub repo and enable GitHub Pages (Settings → Pages → deploy from branch). No build step required.
