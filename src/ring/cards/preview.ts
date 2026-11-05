import type { PreviewSpec, Script } from "./projects";

/**
 * A card's moving preview. It sits over the cover at opacity 0 and only sets
 * data-playing once a real frame is on screen, so the crossfade never shows a
 * blank frame. Pausing fades it back out to the cover. The animation loop calls
 * play() and pause(); both are cheap to call repeatedly.
 */
export type PreviewCtl = { play(): void; pause(): void; destroy(): void };

export function mountPreview(host: HTMLElement, spec: PreviewSpec): PreviewCtl {
  host.removeAttribute("data-playing");
  host.removeAttribute("data-run");
  host.replaceChildren();
  const shown = () => host.setAttribute("data-playing", "");
  const hidden = () => host.removeAttribute("data-playing");
  switch (spec.kind) {
    case "terminal":
      return terminal(host, spec.script, shown, hidden);
    case "pan":
      return css(host, spec.images.map((src, i) => img(src, `pan pan-${i}`)), shown, hidden);
    case "drift":
      return css(host, [img(spec.image, "drift")], shown, hidden);
  }
}

/** CSS-animated previews: running is just animation-play-state. */
function css(host: HTMLElement, images: HTMLImageElement[], shown: () => void, hidden: () => void): PreviewCtl {
  host.append(...images);
  let on = false, started = false, dead = false;
  return {
    play() {
      if (on) return;
      on = true;
      host.setAttribute("data-run", "");
      if (started) return void requestAnimationFrame(shown);
      started = true;
      Promise.all(images.map((i) => i.decode().catch(() => {}))).then(() => {
        if (!dead && on) requestAnimationFrame(shown);
      });
    },
    pause() {
      if (!on) return;
      on = false;
      host.removeAttribute("data-run");
      hidden();
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

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ESC[c]);
const MAX_LINES = 15;

/** Replays a terminal session: prompts appear, answers get typed. */
function terminal(host: HTMLElement, script: Script, shown: () => void, hidden: () => void): PreviewCtl {
  const pre = document.createElement("pre");
  pre.className = "term";
  host.append(pre);

  let lines: string[] = []; // rendered html
  let index = 0, typed = 0, wait = 0, typing = false;
  let timer = 0;

  /** Advances one tick. Returns false when the text didn't change. */
  const step = (): boolean => {
    if (wait > 0) {
      wait--;
      return false;
    }
    if (index >= script.length) {
      lines = [];
      index = 0;
      return true;
    }
    const line = script[index];
    const cut = line.indexOf("§");
    if (cut < 0) {
      lines.push(esc(line));
      index++;
      wait = line === "" ? 3 : 0;
      return true;
    }
    const answer = line.slice(cut + 1);
    if (!typing) {
      lines.push(esc(line.slice(0, cut)));
      typing = true;
      wait = 6;
      return true;
    }
    typed++;
    lines[lines.length - 1] = esc(line.slice(0, cut)) + `<b>${esc(answer.slice(0, typed))}</b>`;
    if (typed >= answer.length) {
      typing = false;
      typed = 0;
      index++;
      wait = 8;
    }
    return true;
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
      // Redraw only when text changed: each redraw repaints the whole card.
      timer = window.setInterval(() => step() && render(), 55);
      host.setAttribute("data-run", "");
      requestAnimationFrame(shown);
    },
    pause() {
      if (!timer) return;
      clearInterval(timer);
      timer = 0;
      host.removeAttribute("data-run");
      hidden();
    },
    destroy() {
      clearInterval(timer);
      timer = 0;
    },
  };
}
