/* =============================================================
   72H ECSS · CCQ Unité 8 — Interactions légères
   Vanilla JS, aucune dépendance, compatible Android entrée de gamme
   ============================================================= */

(function () {
  'use strict';

  // ============== Highlight de la nav ancre selon le scroll ==============
  const nav = document.querySelector('.anchor-nav');
  if (!nav) return;

  const links = nav.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  const sections = Array.from(links)
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  // IntersectionObserver pour marquer la section visible
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            links.forEach((link) => {
              const isActive = link.getAttribute('href') === '#' + id;
              link.classList.toggle('is-active', isActive);
              if (isActive) {
                // Scrolle la nav horizontalement pour garder l'item actif visible sur mobile
                link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            });
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ============== Style is-active appliqué via JS (pour ne pas l'écraser au hover) ==============
  const style = document.createElement('style');
  style.textContent = `
    .anchor-nav a.is-active {
      background: var(--marine);
      color: var(--white);
    }
  `;
  document.head.appendChild(style);

})();
