/**
 * <s-screen-lock> — Homepage wheel scrolling for mice and trackpads: continuous, but one section per gesture.
 *
 * Child markup:
 *   .screen — each section. The site footer is the final one.
 *
 * The page follows the wheel smoothly (it moves as you turn it), but a gesture can never travel further than the
 * next resting point: the start of the next section, or the last screen of a section taller than the viewport.
 * When the wheel goes quiet between sections, the page finishes the move to the next section (or eases back if
 * the turn was tiny). Inside a tall section the page simply rests where the wheel stops. Trackpad inertia belongs
 * to the gesture that caused it, so a hard flick cannot skip sections. Touch scrolls freely and stops at the end of each section (see setupTouch); keyboard and
 * scrollbar stay native. With reduced motion the page moves without easing.
 */
/** Share of the remaining distance covered per 60fps frame (~600ms to settle across one screen). */
const EASE = 0.12;
/** Wheel silence that ends a gesture. */
const QUIET_MS = 170;
/** A turn this long (px) or this share of the way completes the move to the next section. */
const COMMIT_PX = 40;
const COMMIT_SHARE = 0.1;

class ScreenLock extends HTMLElement {
  #controller = null;
  #frame = 0;
  #lastFrame = 0;
  #current = 0;
  #target = 0;
  #gesture = null;
  #quietTimer = 0;
  #lastMagnitude = 0;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    window.addEventListener('s-dialog:opening', () => {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
      clearTimeout(this.#quietTimer);
      clearTimeout(this.#releaseTimer);
      this.#release();
      this.#touching = false;
      this.#touchBase = null;
      this.#gesture = null;
      this.#current = this.#target = window.scrollY;
    }, { signal });
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.#setupTouch(signal);
      return;
    }
    this.#current = this.#target = window.scrollY;
    window.addEventListener('wheel', (event) => this.#onWheel(event), { passive: false, signal });
    // Keyboard, scrollbar and anchor jumps stay native; pick up wherever they leave the page.
    window.addEventListener('scroll', () => {
      if (!this.#frame) this.#current = this.#target = window.scrollY;
    }, { passive: true, signal });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    clearTimeout(this.#releaseTimer);
    this.#release();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    clearTimeout(this.#quietTimer);
    clearTimeout(this.#idleTimer);
  }

  get #offset() {
    return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  }

  /** Resting points (scroll positions) and the free ranges inside tall sections. */
  #layout(selector = '.screen') {
    const offset = this.#offset;
    const view = window.innerHeight - offset;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const stops = [...this.querySelectorAll(selector)];
    const footer = document.querySelector('footer');
    if (footer) stops.push(footer);

    const points = [0, max];
    const free = [];
    for (const stop of stops) {
      const rect = stop.getBoundingClientRect();
      const top = Math.min(max, Math.max(0, Math.round(rect.top + window.scrollY - offset)));
      points.push(top);
      if (rect.height > view + 8) {
        const end = Math.min(max, Math.round(top + rect.height - view));
        points.push(end);
        free.push([top, end]);
      }
    }
    const sorted = [...new Set(points)].sort((a, b) => a - b);
    return { points: sorted, free, max };
  }

  #onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();

    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * scale;
    const magnitude = Math.abs(delta);
    const direction = Math.sign(delta);
    if (!direction) return;

    // A new gesture: after silence, or a clearly stronger push once the page already rests at its limit.
    const atLimit = this.#gesture && Math.abs(this.#target - this.#gesture.limit) < 2;
    const fresh = !this.#gesture
      || (atLimit && magnitude > this.#lastMagnitude * 1.5 + 4)
      || (atLimit && direction !== this.#gesture.direction);
    this.#lastMagnitude = magnitude;
    if (fresh) this.#startGesture(direction);

    const { from, limit } = this.#gesture;
    const low = Math.min(from, limit);
    const high = Math.max(from, limit);
    this.#target = Math.min(high, Math.max(low, this.#target + delta));
    this.#run();

    clearTimeout(this.#quietTimer);
    this.#quietTimer = setTimeout(() => this.#endGesture(), QUIET_MS);
  }

  #startGesture(direction) {
    const { points, free } = this.#layout();
    const from = Math.round(this.#target);
    const limit = direction > 0
      ? points.find((point) => point > from + 1) ?? from
      : [...points].reverse().find((point) => point < from - 1) ?? from;
    // Inside a tall section the page may rest anywhere; between sections it always lands on one.
    const inFree = free.some(([start, end]) => Math.min(from, limit) >= start - 1 && Math.max(from, limit) <= end + 1);
    this.#gesture = { direction, from, limit, inFree };
  }

  #endGesture() {
    const gesture = this.#gesture;
    this.#gesture = null;
    this.#lastMagnitude = 0;
    if (!gesture || gesture.inFree) return;
    const travelled = Math.abs(this.#target - gesture.from);
    const distance = Math.abs(gesture.limit - gesture.from);
    if (travelled < 1 || travelled >= distance - 1) return;
    // Preserve the position reached: a short wheel gesture must never pull back or jump ahead.
    return;
  }

  #run() {
    if (this.#frame) return;
    this.#lastFrame = performance.now();
    this.#frame = requestAnimationFrame(this.#tick);
  }

  #tick = (time) => {
    if (document.querySelector('dialog[open]')) {
      this.#frame = 0;
      this.#gesture = null;
      this.#current = this.#target = window.scrollY;
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frames = Math.min(4, (time - this.#lastFrame) / (1000 / 60));
    this.#lastFrame = time;
    const share = reduce ? 1 : 1 - (1 - EASE) ** frames;
    this.#current += (this.#target - this.#current) * share;
    if (Math.abs(this.#target - this.#current) < 0.5) this.#current = this.#target;
    window.scrollTo({ top: this.#current, behavior: 'instant' });
    if (this.#current !== this.#target) {
      this.#frame = requestAnimationFrame(this.#tick);
    } else {
      this.#frame = 0;
    }
  };

  /* ---- Touch: free scrolling with a stop at the end of each section ---------------------------------------- */
  #touchBase = null;
  #touching = false;
  #held = false;
  #points = [];
  #releaseTimer = 0;
  #idleTimer = 0;

  /**
   * Phones and tablets scroll natively with full momentum. The only intervention: a gesture (finger plus its
   * momentum) that reaches the end of a section stops there, so the next screen sits exactly in place; the next
   * gesture is free again. Small moves are never pulled back (no snapping).
   */
  #setupTouch(signal) {
    const root = document.documentElement;
    window.addEventListener('touchstart', (event) => {
      clearTimeout(this.#releaseTimer);
      clearTimeout(this.#idleTimer);
      this.#release();
      if (event.touches.length !== 1 || document.querySelector('dialog[open]')) {
        this.#touchBase = null;
        this.#touching = false;
        return;
      }
      this.#touching = true;
      this.#touchBase = window.scrollY;
      this.#points = this.#layout('.screen, .snap-stop').points;
    }, { passive: true, signal });
    const end = () => {
      this.#touching = false;
      if (this.#held) this.#releaseTimer = setTimeout(() => this.#release(), 180);
      else this.#scheduleIdle();
    };
    window.addEventListener('touchend', end, { passive: true, signal });
    window.addEventListener('touchcancel', end, { passive: true, signal });
    window.addEventListener('scroll', () => {
      if (this.#touchBase === null || this.#held) return;
      if (document.querySelector('dialog[open]')) {
        this.#touchBase = null;
        return;
      }
      if (!this.#touching) this.#scheduleIdle();
      const base = this.#touchBase;
      const y = window.scrollY;
      let stop = null;
      if (y > base) {
        stop = this.#points.find((point) => point > base + 2 && point <= y) ?? null;
      } else if (y < base) {
        stop = [...this.#points].reverse().find((point) => point < base - 2 && point >= y) ?? null;
      }
      if (stop === null) return;
      this.#held = true;
      root.classList.add('touch-hold');
      window.scrollTo({ top: stop, behavior: 'instant' });
      if (!this.#touching) this.#releaseTimer = setTimeout(() => this.#release(), 180);
    }, { passive: true, signal });
  }

  #scheduleIdle() {
    clearTimeout(this.#idleTimer);
    // Disarm after momentum settles: closing a panel, anchor jumps and focus scrolling are not touch gestures.
    this.#idleTimer = setTimeout(() => { this.#touchBase = null; }, 180);
  }

  #release() {
    if (!this.#held) return;
    this.#held = false;
    document.documentElement.classList.remove('touch-hold');
    this.#touchBase = null;
  }
}

if (!customElements.get('s-screen-lock')) customElements.define('s-screen-lock', ScreenLock);
