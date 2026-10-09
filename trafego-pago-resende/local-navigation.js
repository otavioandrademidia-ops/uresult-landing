/* Reposiciona links diretos após fontes e restauração de rolagem do navegador. */
(() => {
  if (!window.location.hash) return;

  window.addEventListener('pageshow', async () => {
    if (document.fonts) await document.fonts.ready;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      let id;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      const header = document.querySelector('header');
      if (target && header && target.getBoundingClientRect().top < header.getBoundingClientRect().bottom) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }));
  }, { once: true });
})();
