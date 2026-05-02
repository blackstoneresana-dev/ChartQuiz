// Utilitaires UI partagés — inclus sur toutes les pages quiz

(function () {
  const overlay  = document.getElementById('chart-fullscreen');
  const imgEl    = document.getElementById('chart-fullscreen-img');
  const closeBtn = document.getElementById('chart-fullscreen-close');

  function open(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    imgEl.src = '';
  }

  // Clic sur l'image directement — fonctionne sur les images chargées dynamiquement
  document.addEventListener('click', e => {
    const img = e.target.closest('.chart-img');
    if (!img) return;
    if (img.src && img.src !== window.location.href) open(img.src, img.alt);
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();
