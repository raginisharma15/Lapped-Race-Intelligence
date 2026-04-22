class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+<>_';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    this.original = newText;
    this.queue = [];
    const length = newText.length;
    for (let i = 0; i < length; i++) {
      const from = '';
      const to = newText[i];
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40) + 10;
      this.queue.push({ from, to, start, end, char: null });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.frameRequest = requestAnimationFrame(this.update);
  }

  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += '';
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      cancelAnimationFrame(this.frameRequest);
      // ensure final text is plain (no spans)
      this.el.textContent = this.original;
    } else {
      this.frameRequest = requestAnimationFrame(this.update.bind(this));
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

export function initTextReveal() {
  const items = Array.from(document.querySelectorAll('[data-reveal]'));
  const scramblers = new WeakMap();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // create scrambler for this element if missing
        let s = scramblers.get(el);
        if (!s) {
          s = new TextScramble(el);
          scramblers.set(el, s);
        }
        // stagger by index so decodes don't all happen at once
        const idx = items.indexOf(el);
        const delay = (idx % 6) * 80 + Math.floor(Math.random() * 120);
        const originalText = el.textContent.trim();
        setTimeout(() => s.setText(originalText), delay);
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );

  items.forEach((el) => {
    // leave element content intact but ensure text-only
    el.setAttribute('data-orig-text', el.textContent.trim());
    io.observe(el);
  });
}
