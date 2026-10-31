import { globeArt } from "./covers";
import type { PreviewSpec, Script } from "./projects";

/**
 * A card's moving preview. It sits over the cover at opacity 0 and only sets
 * data-playing once a real frame is on screen, so the crossfade never shows a
 * blank frame. The animation loop calls play() and pause(); both are cheap to
 * call repeatedly.
 */
export type PreviewCtl = { play(): void; pause(): void; destroy(): void };

export function mountPreview(host: HTMLElement, spec: PreviewSpec): PreviewCtl {
  host.removeAttribute("data-playing");
  host.removeAttribute("data-run");
  host.replaceChildren();
  const shown = () => host.setAttribute("data-playing", "");
  switch (spec.kind) {
    case "video":
      return video(host, spec.src, shown);
    case "terminal":
      return terminal(host, spec.script, shown);
    case "pan":
      return css(host, spec.images.map((src, i) => img(src, `pan pan-${i}`)), shown);
    case "drift":
      return css(host, [img(spec.image, "drift")], shown);
    case "globe":
      return css(host, [globe()], shown);
  }
}

function video(host: HTMLElement, src: string, shown: () => void): PreviewCtl {
  const v = document.createElement("video");
  Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "none", src });
  v.setAttribute("muted", "");
  v.addEventListener("playing", shown);
  host.append(v);
  let on = false;
  return {
    play() {
      if (on) return;
      on = true;
      v.play().catch(() => (on = false));
    },
    pause() {
      if (!on) return;
      on = false;
      v.pause();
    },
    destroy() {
      v.pause();
      v.removeAttribute("src");
      v.load();
    },
  };
}

/** CSS-animated previews: running is just animation-play-state. */
function css(host: HTMLElement, nodes: Element[], shown: () => void): PreviewCtl {
  host.append(...nodes);
  const images = nodes.flatMap((n) => (n instanceof HTMLImageElement ? [n] : [...n.querySelectorAll("img")]));
  let on = false, started = false, dead = false;
  return {
    play() {
      if (on) return;
      on = true;
      host.setAttribute("data-run", "");
      if (started) return;
      started = true;
      Promise.all(images.map((i) => i.decode().catch(() => {}))).then(() => {
        if (!dead) requestAnimationFrame(shown);
      });
    },
    pause() {
      if (!on) return;
      on = false;
      host.removeAttribute("data-run");
    },
    destroy() {
      dead = true;
    },
  };
}

function img(src: string, className: string) {
  const i = new Image();
  i.src = src;
  i.alt = "";
  i.className = className;
  i.draggable = false;
  return i;
}

function globe() {
  const wrap = document.createElement("div");
  wrap.className = "globe";
  const meridians = Array.from({ length: 6 }, (_, i) => `<ellipse class="meridian" style="animation-delay:${(-i * 9) / 6}s" cx="270" cy="400" rx="190" ry="190"/>`).join("");
  wrap.innerHTML = `<svg viewBox="0 0 540 960" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="orange" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fed7aa"/><stop offset="1" stop-color="#ea580c"/></linearGradient>
    <radialGradient id="gbg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2b1507"/><stop offset="1" stop-color="#050403"/></radialGradient></defs>
    <rect width="540" height="960" fill="url(#gbg)"/>
    ${globeArt(270, 400, 190, false).replace(/<ellipse cx="270" cy="400" rx="[\d.]+" ry="190"\/>/g, "")}
    <g fill="none" stroke="url(#orange)" stroke-width="2.6">${meridians}</g>
    <g class="pins">${[[200, 330], [330, 380], [250, 470], [372, 300]].map(([x, y], i) => `<circle class="pin-ring" style="animation-delay:${i * 0.6}s" cx="${x}" cy="${y}" r="8"/><circle cx="${x}" cy="${y}" r="6.5" fill="#fff7ed"/>`).join("")}</g>
  </svg>`;
  return wrap;
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ESC[c]);
const MAX_LINES = 15;

/** Replays a terminal session: prompts appear, answers get typed. */
function terminal(host: HTMLElement, script: Script, shown: () => void): PreviewCtl {
  const pre = document.createElement("pre");
  pre.className = "term";
  host.append(pre);

  let lines: string[] = []; // rendered html
  let index = 0, typed = 0, wait = 0, typing = false;
  let timer = 0, started = false;

  const step = () => {
    if (wait > 0) return void wait--;
    if (index >= script.length) {
      lines = [];
      index = 0;
      return;
    }
    const line = script[index];
    const cut = line.indexOf("§");
    if (cut < 0) {
      lines.push(esc(line));
      index++;
      wait = line === "" ? 3 : 0;
      return;
    }
    const answer = line.slice(cut + 1);
    if (!typing) {
      lines.push(esc(line.slice(0, cut)));
      typing = true;
      wait = 6;
      return;
    }
    typed++;
    lines[lines.length - 1] = esc(line.slice(0, cut)) + `<b>${esc(answer.slice(0, typed))}</b>`;
    if (typed >= answer.length) {
      typing = false;
      typed = 0;
      index++;
      wait = 8;
    }
  };
  const render = () => {
    pre.innerHTML = lines.slice(-MAX_LINES).join("\n") + '<span class="caret"></span>';
  };

  // Start partway in, so the first frame already looks like a session.
  const offset = Math.floor(script.length * 0.3);
  while (index < offset) step();
  render();

  return {
    play() {
      if (timer) return;
      timer = window.setInterval(() => {
        step();
        render();
      }, 55);
      host.setAttribute("data-run", "");
      if (!started) {
        started = true;
        requestAnimationFrame(shown);
      }
    },
    pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = 0;
      host.removeAttribute("data-run");
    },
    destroy() {
      clearInterval(timer);
      timer = 0;
    },
  };
}
