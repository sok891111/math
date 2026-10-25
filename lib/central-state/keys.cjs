// Shared by the server and the browser bundle; only personal progress is synced.
(function (root) {
  function groups(id) {
    return {
      island: ['seonyul-block-island-v1_' + id],
      runner: ['seonyul-sunshine-progress-v1_' + id, 'seonyul-sunshine-campaign-v1_' + id, 'seonyul-sunshine-best-v1_' + id, 'seonyul-map-deck-v1_' + id],
      creative: ['block-creative-bridge-v1:' + id, 'creative-monster-cards-v1:' + id],
      hanja: ['magic-hanja-v1:' + id],
      tralalerio: ['tralalerio-save-v1:' + id],
      english: ['magic-english-save-v1:' + id],
      world: ['magic-english-block-world-v1:' + id],
    };
  }
  if (typeof module !== 'undefined') module.exports = { groups };
  else root.BlockStateKeys = { groups };
})(typeof window !== 'undefined' ? window : globalThis);
