/**
 * <s-clock> — Live local time for the brand's home city (data-time-zone, default Europe/Athens), HH:MM.
 * The server renders a first value; this keeps it current once a minute. Static text, no motion.
 */
class Clock extends HTMLElement {
  #timer = 0;

  connectedCallback() {
    const output = this.querySelector('[data-clock-time]');
    if (!output) return;
    const format = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
      timeZone: this.dataset.timeZone || 'Europe/Athens',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const tick = () => {
      output.textContent = format.format(new Date());
    };
    tick();
    this.#timer = window.setInterval(tick, 30000);
  }

  disconnectedCallback() {
    window.clearInterval(this.#timer);
  }
}

if (!customElements.get('s-clock')) {
  customElements.define('s-clock', Clock);
}
