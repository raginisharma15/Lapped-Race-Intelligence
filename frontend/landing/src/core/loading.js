export function createLoadingScreen() {
  const el = document.createElement('div');
  el.id = 'loading-screen';
  el.innerHTML = `
    <p class="loading-logo">LAP<em>PED</em></p>
    <div class="loading-bar-wrap">
      <div class="loading-bar" id="loading-bar"></div>
    </div>
    <p class="loading-label" id="loading-label">Initializing race systems…</p>
  `;
  document.body.prepend(el);
  console.log('[LAPPED] Loading screen created');
}

export function setLoadingProgress(pct, label) {
  const bar = document.getElementById('loading-bar');
  const lbl = document.getElementById('loading-label');
  if (bar) bar.style.width = `${pct}%`;
  if (lbl && label) lbl.textContent = label;
}

export function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (!el) {
    console.warn('[LAPPED] Loading screen element not found');
    return;
  }
  console.log('[LAPPED] Hiding loading screen');
  el.classList.add('fade-out');
  setTimeout(() => {
    el.remove();
    console.log('[LAPPED] Loading screen removed');
  }, 900);
}
