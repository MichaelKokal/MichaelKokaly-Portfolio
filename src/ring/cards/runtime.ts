/**
 * Remembers the last value written for every style and attribute, and skips the
 * write when nothing changed. Settled and off-screen cards then cost nothing.
 */
export function createWriter() {
  const cache = new WeakMap<Element, Map<string, string | null>>();
  const of = (el: Element) => {
    let c = cache.get(el);
    if (!c) cache.set(el, (c = new Map()));
    return c;
  };
  return {
    style(el: HTMLElement, prop: string, value: string) {
      const c = of(el);
      if (c.get(prop) === value) return;
      c.set(prop, value);
      el.style.setProperty(prop, value);
    },
    attr(el: Element, name: string, value: string | null) {
      const c = of(el);
      const key = "@" + name;
      if (c.get(key) === value) return;
      c.set(key, value);
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, value);
    },
  };
}

export type Pointer = { x: number; y: number; inside: boolean; dragging: boolean };

type Handlers = {
  /** Horizontal movement since the last call, in px. */
  drag(dx: number): void;
  /** px per second, or 0 if the pointer paused before letting go. */
  release(velocity: number): void;
  wheel(delta: number): void;
};

const DRAG_THRESHOLD = 10;
const PAUSE_CANCELS_FLICK = 80;

/** Drag, swipe and wheel on one element. Returns the live pointer state. */
export function attachGestures(root: HTMLElement, h: Handlers, enabled: () => boolean) {
  const pointer: Pointer = { x: 0, y: 0, inside: false, dragging: false };
  let id = -1, startX = 0, lastX = 0, moved = false;
  let samples: { t: number; x: number }[] = [];

  const down = (e: PointerEvent) => {
    moved = false;
    if (!enabled() || (e.pointerType === "mouse" && e.button !== 0)) return;
    id = e.pointerId;
    startX = lastX = e.clientX;
    samples = [{ t: performance.now(), x: e.clientX }];
  };
  const move = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.inside = true;
    if (e.pointerId !== id) return;
    if (!moved && Math.abs(e.clientX - startX) > DRAG_THRESHOLD) {
      // Only capture once it is really a drag, so a plain tap still reaches the link.
      moved = pointer.dragging = true;
      root.setPointerCapture(id);
      root.setAttribute("data-dragging", "");
    }
    if (!moved) return;
    h.drag(e.clientX - lastX);
    lastX = e.clientX;
    const now = performance.now();
    samples.push({ t: now, x: e.clientX });
    while (samples.length > 2 && now - samples[0].t > 120) samples.shift();
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    if (!moved) return;
    const now = performance.now();
    const last = samples[samples.length - 1];
    let v = 0;
    if (now - last.t <= PAUSE_CANCELS_FLICK) {
      const first = samples.find((s) => last.t - s.t <= 100) ?? samples[0];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.008) v = (last.x - first.x) / dt;
    }
    pointer.dragging = false;
    root.removeAttribute("data-dragging");
    if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
    h.release(v);
  };
  // A drag must never open the card it started on.
  const click = (e: MouseEvent) => {
    if (!moved) return;
    e.preventDefault();
    e.stopPropagation();
    moved = false;
  };
  // Only a sideways wheel or trackpad swipe moves the row. Up and down scroll the page.
  const wheel = (e: WheelEvent) => {
    // A trackpad scrolling up or down wobbles a little sideways too: ignore that.
    if (Math.abs(e.deltaX) < 3 || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 2) return;
    e.preventDefault();
    if (!enabled()) return;
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    h.wheel(e.deltaX * scale);
  };
  const leave = () => (pointer.inside = false);
  const noDrag = (e: Event) => e.preventDefault();

  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerup", up);
  root.addEventListener("pointercancel", up);
  root.addEventListener("pointerleave", leave);
  // Opening a link in a new tab fires no pointerleave, so coming back would leave the
  // last card hovered (buttons showing, wheel held still) until the mouse moved.
  window.addEventListener("blur", leave);
  root.addEventListener("click", click, true);
  root.addEventListener("wheel", wheel, { passive: false });
  root.addEventListener("dragstart", noDrag);

  return {
    pointer,
    detach() {
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      root.removeEventListener("click", click, true);
      root.removeEventListener("wheel", wheel);
      root.removeEventListener("dragstart", noDrag);
    },
  };
}

/** Which card slot is under the pointer. Read this before the frame's writes. */
export function hitSlot(p: Pointer) {
  if (!p.inside || p.dragging) return -1;
  const el = document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>("[data-slot]");
  return el ? Number(el.dataset.slot) : -1;
}

export function prefersReducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
