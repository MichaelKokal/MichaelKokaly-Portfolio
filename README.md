# Portfolio

My portfolio homepage: [portfolio.michaelkokaly.com](https://portfolio.michaelkokaly.com)

While the page loads, a deck of project cards is dealt into a fan, then opens into a slowly turning wheel. You can drag, swipe or scroll to turn it, and click any card to open that project on GitHub. There's also a second layout where the cards sit around the inside of a ring.

Built with React, TypeScript, Motion and plain CSS 3D transforms. No WebGL.

## How it works

- Every card's position comes from one pure function: `dealPose` for the wheel and `reelPose` for the ring. Both have unit tests.
- The whole entrance is driven by two numbers that go from 0 to 1. One deals the cards, the other opens the scene. The reveal waits until the cards are dealt and the images have actually loaded, and the progress counter shows real loading progress.
- All cards are moved by a single animation loop that only writes a style when its value changed. Cards that are out of view are hidden, so they cost nothing.
- Press Escape or Tab, or use the skip button, to jump past the intro. With reduced motion turned on, the page starts in its final state and nothing moves on its own.

## Run it

```
npm install
npm run dev     # http://localhost:5190
npm test
npm run build
```
