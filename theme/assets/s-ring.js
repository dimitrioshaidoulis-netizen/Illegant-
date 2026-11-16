/**
 * <s-ring> — A 3D ring of photographs that turns slowly and can be spun by dragging.
 *
 * Markup contract: a child [data-ring-track] holding the cards. Each card positions itself with
 * rotateY(var(--ring-angle)) translateZ(var(--ring-radius) * var(--ring-spread)); this element writes
 * --ring-turn, --ring-spread and --ring-tilt on the track.
 *
 * Entrance: the cards fade in one by one (CSS) on a tighter ring that opens out while the spin settles
 * from quick to slow. CSS holds the same tighter ring before this element is defined, and connectedCallback keeps
 * holding it until the first frame, so nothing jumps. With a mouse, the ring leans gently toward the pointer.
 * Reduced motion: no entrance, no auto-rotation, no lean (drag still works).
 * Pauses when off screen or the tab is hidden.
 *
 * Timing: all per-frame motion (spin, drag inertia, lean easing) is scaled by the real time between
 * frames, so a 120Hz phone or laptop turns at the same speed as a 60Hz one.
 */
const INTRO_MS = 2200;
// Never fully gathered: cards sharing the centre would cut through each other and flicker.
const SPREAD_FROM = 0.78;
const BASE_TILT = -7;
// The constants below were tuned per frame at 60fps; step = elapsed / FRAME_MS converts them to time.
const FRAME_MS = 1000 / 60;
// After a stall (tab wake, long task) never jump more than three frames' worth.
const MAX_STEP = 3;

class Ring extends HTMLElement {
  #track = null;
  #angle = 0;
  #velocity = 0;
  #autoSpeed = 0.022;
  #hovering = false;
  #dragging = false;
  #lastX = 0;
  #frame = 0;
  #last = 0;
  #ready = false;
  #dragStart = 0;
  #visible = true;
  #observer = null;
  #controller = null;
  #reduced = false;
  #introStart = 0;
  #spread = 1;
  #tilt = BASE_TILT;
  #tiltTarget = BASE_TILT;

  connectedCallback() {
    this.#track = this.querySelector('[data-ring-track]');
    if (!this.#track) return;

    this.#reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.#reduced) {
      this.#autoSpeed = 0;
    } else {
      this.#spread = SPREAD_FROM;
      this.#introStart = performance.now();
      // Hold the starting ring from the moment this element is defined. Until the first frame runs (it waits for
      // the lead photograph to decode), nothing else carries the value: without it the cards sprang out to the
      // open ring and back in again on every slow load.
      this.#track.style.setProperty('--ring-spread', SPREAD_FROM.toFixed(4));
    }

    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.addEventListener('pointerdown', this.#onDown, { signal });
    this.addEventListener('pointermove', this.#onMove, { signal });
    this.addEventListener('pointerup', this.#onUp, { signal });
    this.addEventListener('pointercancel', this.#onUp, { signal });
    this.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') this.#hovering = true; }, { signal });
    this.addEventListener('pointerleave', () => {
      this.#hovering = false;
      this.#tiltTarget = BASE_TILT;
      this.#start();
    }, { signal });
    document.addEventListener('visibilitychange', this.#onVisibilityChange, { signal });

    this.#observer = new IntersectionObserver(([entry]) => {
      this.#visible = Boolean(entry?.isIntersecting);
      if (this.#visible) this.#start();
    });
    this.#observer.observe(this);
    const firstImage = this.querySelector('[data-ring-card] img');
    // Start the spatial entrance after the lead image is decoded, with a bounded fallback.
    const decoded = firstImage?.decode ? firstImage.decode().catch(() => {}) : Promise.resolve();
    Promise.race([decoded, new Promise(resolve => setTimeout(resolve, 1200))]).then(() => {
      if (signal.aborted) return;
      this.#ready = true;
      this.#introStart = performance.now();
      this.#start();
    });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#last = 0;
  }

  #onVisibilityChange = () => {
    if (!document.hidden && this.#visible) this.#start();
  };

  #start() {
    if (this.#frame || !this.#ready) return;
    // A fresh run has no previous frame: the first step counts as exactly one frame.
    this.#last = 0;
    this.#frame = requestAnimationFrame(this.#tick);
  }

  #tick = (now) => {
    this.#frame = 0;
    if (!this.#visible || document.hidden) {
      this.#last = 0;
      return;
    }

    const step = this.#last ? Math.min(MAX_STEP, Math.max(0, (now - this.#last) / FRAME_MS)) : 1;
    this.#last = now;

    // Entrance: ease-out quartic from gathered to open; the spin starts quicker and settles with it.
    let introBoost = 0;
    if (this.#spread < 1 && !this.#dragging) {
      const progress = Math.min(1, Math.max(0, (now - this.#introStart) / INTRO_MS));
      const eased = 1 - Math.pow(1 - progress, 4);
      this.#spread = SPREAD_FROM + (1 - SPREAD_FROM) * eased;
      introBoost = 0.04 * Math.pow(1 - progress, 3);
    }

    if (!this.#dragging) {
      this.#velocity *= Math.pow(0.95, step);
      const auto = this.#hovering ? this.#autoSpeed * 0.25 : this.#autoSpeed;
      this.#angle += (auto + introBoost + this.#velocity) * step;
    }

    if (!this.#reduced) this.#tilt += (this.#tiltTarget - this.#tilt) * (1 - Math.pow(0.94, step));

    const style = this.#track.style;
    style.setProperty('--ring-turn', `${this.#angle}deg`);
    style.setProperty('--ring-spread', this.#spread.toFixed(4));
    style.setProperty('--ring-tilt', `${this.#tilt.toFixed(3)}deg`);

    const settled =
      !this.#dragging &&
      this.#autoSpeed === 0 &&
      this.#spread >= 1 &&
      Math.abs(this.#velocity) < 0.001 &&
      Math.abs(this.#tiltTarget - this.#tilt) < 0.01;
    // Keep the loop going directly (not through #start) so the frame clock is not reset every frame.
    if (!settled) this.#frame = requestAnimationFrame(this.#tick);
  };

  #onDown = (event) => {
    if (!this.#ready || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.#dragStart = performance.now();
    this.#dragging = true;
    this.#lastX = event.clientX;
    this.#velocity = 0;
    this.setAttribute('data-dragging', '');
    this.setPointerCapture(event.pointerId);
  };

  #onMove = (event) => {
    if (event.pointerType === 'mouse' && !this.#reduced) {
      // Lean: the ring tips a few degrees toward the pointer's height over the scene.
      const rect = this.getBoundingClientRect();
      const y = rect.height ? (event.clientY - rect.top) / rect.height - 0.5 : 0;
      this.#tiltTarget = BASE_TILT + y * 8;
      this.#start();
    }
    if (!this.#dragging) return;
    const delta = (event.clientX - this.#lastX) * 0.25;
    this.#lastX = event.clientX;
    this.#angle += delta;
    this.#velocity = Math.max(-2, Math.min(2, delta));
    this.#start();
  };

  #onUp = (event) => {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#introStart += performance.now() - this.#dragStart;
    this.removeAttribute('data-dragging');
    if (this.hasPointerCapture(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.#start();
  };
}

if (!customElements.get('s-ring')) {
  customElements.define('s-ring', Ring);
}