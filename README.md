# Portfolio

My portfolio: [portfolio.michaelkokaly.com](https://portfolio.michaelkokaly.com)

One page. It opens with a deck of project cards dealt around a small tilted ring, which then opens into a row of big cards that slides slowly across a sunset. Drag or swipe the row, or pick a language to spotlight its projects. Scrolling down tips the row forward, fades the sunset into the page, and the four featured projects drop out of the ring into their own sections. Below them are my experience, education, skills and contact details.

Built with React, TypeScript and plain CSS 3D transforms. No WebGL and no animation library.

## What's on the page

- **The ring.** The intro and the sliding row. It only moves on its own when the mouse isn't on a card, and only a drag, swipe or sideways scroll moves it by hand, so the page still scrolls normally.
- **Featured projects.** Each one has its own ring card. Hovering the card plays a short demo of the app on it: planes over Chicago for Chicago Sky Tracker, a search and a pin on the globe for Digital Footprint, a day being logged in MOMENTUM, and a terminal replay for Recall.
- **The rest of the ring.** The smaller projects in a carousel you can drag. Hovering a card plays its preview and clicking opens it on GitHub.
- **Experience, about, skills and contact.**

## How it works

- Every card's position comes from pure functions with unit tests: the ring pose, the row pose and the mix between them.
- The whole entrance is driven by two numbers that go from 0 to 1. One deals the cards, the other opens the scene. The reveal waits until the cards are dealt and the images have actually loaded.
- All ring cards are moved by one animation loop that only writes a style when its value changed. Cards out of view are hidden, so they cost nothing.
- Press Escape or Tab, or use the skip button, to jump past the intro. With reduced motion turned on, the page starts in its final state and nothing moves on its own.

## Run it

```
npm install
npm run dev     # http://localhost:5190
npm test
npm run build
```
