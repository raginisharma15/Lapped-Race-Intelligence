/** Phrase shown during halo zoom — last letter of each word styled in CSS (.halo-tail). */
export const HALO_PHRASE = 'Reinventing race logistics through AI-powered intelligence';

export function mountHaloText(container) {
  if (!container) {
    console.warn('[LAPPED] haloText container not found');
    return [];
  }
  const words = HALO_PHRASE.trim().split(/\s+/);
  const spans = [];

  container.innerHTML = words
    .map((word, i) => {
      if (!word.length) return '';
      const tail = word.slice(-1);
      const head = word.slice(0, -1);
      return `<span class="halo-word" data-word-index="${i}"><span class="halo-word-head">${head}</span><span class="halo-tail">${tail}</span></span>`;
    })
    .join(' ');

  const wordSpans = Array.from(container.querySelectorAll('.halo-word'));
  console.log('[LAPPED] Mounted halo text with', wordSpans.length, 'words');
  return wordSpans;
}
