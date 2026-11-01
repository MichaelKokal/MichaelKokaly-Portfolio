# Portfolio

My portfolio homepage: [portfolio.michaelkokaly.com](https://portfolio.michaelkokaly.com)

While the page loads, a deck of project cards is dealt out around a small tilted ring. Then every card travels from its place on the ring into a row of big, flat cards that fills the screen and slowly slides from left to right. You can drag, swipe or scroll the row, and click any card to open that project on GitHub.

Built with React, TypeScript, Motion and plain CSS 3D transforms. No WebGL.

## How it works

- Every card's position comes from pure functions with unit tests: `reelPose` places it on the ring, `stripPose` places it in the row, and `mixPose` carries it from one to the other.
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
