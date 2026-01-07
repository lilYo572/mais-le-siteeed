// script.js — gestion badge / thèmes / overlays / ep-cards / lecteur vidéo

document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const overlay = $('#overlay');
  const overlayInner = $('#overlay-inner');
  const overlayContent = $('#overlay-content');
  const overlayClose = $('#overlay-close');

  const newsBtn = $('#btn-news');
  const newsBadge = $('#news-badge');

  const ovalLearn = $('#oval-learn');
  const themeToggle = $('#theme-toggle');
  const THEME_KEY = 'brad_theme_pref';
  // NEWS_VERSION: increment this string when you publish a new "Nouveautés" entry
  const NEWS_VERSION = '1'; // <-- bump to '2' on next update to make the badge reappear for all users
  const NEWS_READ_KEY = 'brad_news_seen_version';

  // Panels content (welcome = en savoir plus)
  const PANELS = {
    welcome: `
      <h2>En savoir plus</h2>
      <p>
        C'est ici que l'univers de Brad Bitt prend vie. Sur ce site vous trouverez des articles de développement, 
        des aperçus exclusifs des prochains projets, des coulisses et des contenus réservés aux visiteurs curieux.
        Nous partageons des notes de design, des prototypes, et des inspirations qui façonnent l'expérience.
      </p>
      <p>
        N'hésitez pas à revenir régulièrement — de nouvelles pages, vidéos et prototypes sont ajoutés au fil du temps.
        Abonnez-vous aux mises à jour ou repassez de temps à autre pour découvrir les nouveautés.
      </p>
    `,
    news: `
      <h2>Nouveautés</h2>
      <p>C’est ici que vous trouverez les dernières mises à jour du site et des contenus ajoutés récemment.</p>
    `,
    game: `
      <h2>Brad Bitt — Le jeu</h2>
      <p>Aperçu du jeu, mécaniques et notes de développement. Screens, sprites et petits aperçus.</p>
    `
  };

  /* NEWS badge logic */
  function refreshNewsBadge() {
    try {
      const seen = localStorage.getItem(NEWS_READ_KEY);
      if (!newsBadge) return;
      newsBadge.hidden = (seen === NEWS_VERSION);
    } catch (e) { /* ignore */ }
  }
  refreshNewsBadge();

  // Mark news as read (store the current version)
  function markNewsRead() {
    try {
      localStorage.setItem(NEWS_READ_KEY, NEWS_VERSION);
      if (newsBadge) newsBadge.hidden = true;
    } catch (e) {}
  }

  // Clicking the news button opens the panel and marks read
  if (newsBtn) {
    newsBtn.addEventListener('click', () => {
      markNewsRead();
      openPanel('news');
    });
  }
  // Clicking the badge itself should also mark it read
  if (newsBadge) {
    newsBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      markNewsRead();
    });
  }

  /* Overlay open/close + video player injection */
  let lastFocused = null;
  function openPanel(key, options = {}) {
    if (!overlay || !overlayContent || !overlayInner) return;
    const html = PANELS[key] || (options.html || `<p>Contenu à venir</p>`);
    overlayContent.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    lastFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    overlayInner.focus();

    // If opening news panel, mark news as read
    if (key === 'news') markNewsRead();
  }
  function closePanel() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    // stop embedded video by clearing content
    if (overlayContent) overlayContent.innerHTML = '';
  }
  if (overlayClose) overlayClose.addEventListener('click', closePanel);
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) closePanel(); });

  /* open 'welcome' from the oval button (En savoir plus) */
  if (ovalLearn) {
    ovalLearn.addEventListener('click', () => openPanel('welcome'));
  }

  /* ep-card flip & visionner handler */
  $$('.ep-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      card.classList.toggle('flipped');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.classList.toggle('flipped');
        e.preventDefault();
      }
    });
  });

  // handle Visionner / Voir button clicks (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-visionner');
    if (!btn) return;
    const videoId = btn.getAttribute('data-video') || btn.closest('.ep-card')?.getAttribute('data-video');
    if (!videoId) {
      openPanel(null, { html: '<p>Vidéo indisponible.</p>' });
      return;
    }
    const playerHtml = `
      <h2>Lecture</h2>
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1" 
                title="Vidéo" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
      </div>
      <p style="margin-top:12px;color:var(--muted)">Fermez la fenêtre pour revenir au site.</p>
    `;
    openPanel(null, { html: playerHtml });
  });

  /* Theme init + toggle (light/dark/auto) */
  function applyTheme(pref, save = true) {
    try {
      const root = document.documentElement;
      if (pref === 'light') {
        root.setAttribute('data-theme', 'light');
      } else if (pref === 'dark') {
        root.removeAttribute('data-theme');
      } else {
        // auto
        const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        if (isLight) root.setAttribute('data-theme', 'light');
        else root.removeAttribute('data-theme');
      }

      // update toggle visuals
      if (themeToggle) {
        themeToggle.classList.remove('is-light','is-dark');
        if (pref === 'light') themeToggle.classList.add('is-light');
        else if (pref === 'dark') themeToggle.classList.add('is-dark');
        // title
        const title = pref === 'auto' ? 'Mode : automatique' : (pref === 'light' ? 'Mode : clair' : 'Mode : sombre');
        themeToggle.setAttribute('title', title);
        themeToggle.setAttribute('aria-label', title);
      }

      if (save) {
        try { localStorage.setItem(THEME_KEY, pref); } catch(e) {}
      }
    } catch (e) { /* ignore */ }
  }

  // initial read
  try {
    const saved = localStorage.getItem(THEME_KEY) || 'auto';
    applyTheme(saved, false);
  } catch(e){ applyTheme('auto', false); }

  // cycle through modes on click: auto -> light -> dark -> auto
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = localStorage.getItem(THEME_KEY) || 'auto';
      const order = ['auto','light','dark'];
      const next = order[(order.indexOf(current) + 1) % order.length];
      applyTheme(next, true);
    });
  }

  /* helper to aid future deployments */
  window.__brad_setNewsVersion = (ver) => {
    try { localStorage.removeItem(NEWS_READ_KEY); } catch (e) {}
    console.log('To show the badge to users, update NEWS_VERSION in script and deploy with new version:', ver);
  };

  /* --- Fix: reveal elements on load --- */
  // Les éléments avec la classe .reveal sont initialement masqués (opacity:0).
  // On active leur visibilité en ajoutant .visible après le chargement.
  (function revealOnLoad() {
    const reveals = $$('.reveal');
    if (!reveals.length) return;
    // léger décalage/stagger pour l'effet
    reveals.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 80 * i);
    });
  })();

});
