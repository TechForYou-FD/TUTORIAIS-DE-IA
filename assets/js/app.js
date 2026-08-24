(() => {
  'use strict';

  const root = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Theme toggle
  --------------------------------------------------------- */
  const themeToggle = document.getElementById('theme-toggle');
  const STORAGE_KEY = 'tfy-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle?.setAttribute('aria-pressed', String(theme === 'light'));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f6fc' : '#050a14');
  }

  function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) { applyTheme(stored); return; }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }

  themeToggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });

  initTheme();

  /* ---------------------------------------------------------
     Sticky header shadow
  --------------------------------------------------------- */
  const header = document.getElementById('site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     Mobile nav
  --------------------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  navToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  const animated = document.querySelectorAll('[data-animate]');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    animated.forEach(el => io.observe(el));
  } else {
    animated.forEach(el => el.classList.add('in-view'));
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Video modal
  --------------------------------------------------------- */
  const modal = document.getElementById('video-modal');
  const modalFrame = document.getElementById('video-modal-frame');
  let lastFocused = null;

  function openVideo(videoId) {
    lastFocused = document.activeElement;
    modalFrame.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="Vídeo do YouTube" allow="accelerate-magnetometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.video-modal-close')?.focus();
  }

  function closeVideo() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalFrame.innerHTML = '';
    lastFocused?.focus();
  }

  modal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeVideo();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeVideo();
  });

  /* ---------------------------------------------------------
     Card tilt (subtle, desktop only, respects reduced motion)
  --------------------------------------------------------- */
  function attachTilt(el) {
    if (prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `translateY(-6px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  }

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */
  const dateFmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateTimeFmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function playIconSvg() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.35)"/><path d="M10 8.5l6 3.5-6 3.5v-7z" fill="#fff"/></svg>';
  }

  function videoCard(video) {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Reproduzir: ${video.title}`);
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${video.thumbnail}" alt="" loading="lazy" width="480" height="270">
        <div class="video-play">${playIconSvg()}</div>
      </div>
      <div class="video-body">
        <h4 class="video-title">${escapeHtml(video.title)}</h4>
        <p class="video-date">${video.publishedAt ? dateFmt.format(new Date(video.publishedAt)) : ''}</p>
      </div>`;
    const trigger = () => openVideo(video.id);
    card.addEventListener('click', trigger);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
    });
    attachTilt(card);
    return card;
  }

  function skeletonGrid(n = 6) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'skeleton';
      frag.appendChild(s);
    }
    return frag;
  }

  /* ---------------------------------------------------------
     Playlists (tabs + grids)
  --------------------------------------------------------- */
  const tabsEl = document.getElementById('playlist-tabs');
  const panelsEl = document.getElementById('playlist-panels');
  const tabIndicator = tabsEl?.querySelector('.tab-indicator');

  function moveIndicator(btn) {
    if (!tabIndicator || !btn) return;
    tabIndicator.style.width = btn.offsetWidth + 'px';
    tabIndicator.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
  }

  function activateTab(slug) {
    tabsEl.querySelectorAll('.tab-btn').forEach(b => {
      const active = b.dataset.slug === slug;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
      if (active) moveIndicator(b);
    });
    panelsEl.querySelectorAll('.panel').forEach(p => {
      p.classList.toggle('is-active', p.dataset.slug === slug);
    });
  }

  function renderPlaylists(data) {
    if (!tabsEl || !panelsEl) return;
    tabsEl.querySelectorAll('.tab-btn').forEach(b => b.remove());
    panelsEl.innerHTML = '';

    let totalVideos = 0;

    data.playlists.forEach((playlist, i) => {
      totalVideos += playlist.videos.length;

      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'tab-btn';
      tabBtn.dataset.slug = playlist.slug;
      tabBtn.setAttribute('role', 'tab');
      tabBtn.setAttribute('aria-selected', String(i === 0));
      tabBtn.textContent = playlist.title;
      tabBtn.addEventListener('click', () => activateTab(playlist.slug));
      tabsEl.insertBefore(tabBtn, tabIndicator);

      const panel = document.createElement('div');
      panel.className = 'panel' + (i === 0 ? ' is-active' : '');
      panel.dataset.slug = playlist.slug;
      panel.setAttribute('role', 'tabpanel');

      const meta = document.createElement('div');
      meta.className = 'playlist-meta';
      meta.innerHTML = `<h3>${escapeHtml(playlist.title)}</h3><a href="${playlist.url}" target="_blank" rel="noopener">Ver playlist completa no YouTube →</a>`;
      panel.appendChild(meta);

      const grid = document.createElement('div');
      grid.className = 'video-grid';

      if (playlist.videos.length === 0) {
        grid.innerHTML = `<div class="empty-state"><strong>Ainda sem vídeos sincronizados</strong><span>Esta playlist é atualizada automaticamente — volta a passar por aqui em breve, ou vê-a diretamente no YouTube.</span></div>`;
      } else {
        playlist.videos.forEach(v => grid.appendChild(videoCard(v)));
      }
      panel.appendChild(grid);
      panelsEl.appendChild(panel);
    });

    requestAnimationFrame(() => {
      const activeBtn = tabsEl.querySelector('.tab-btn[aria-selected="true"]');
      moveIndicator(activeBtn);
    });
    window.addEventListener('resize', () => {
      const activeBtn = tabsEl.querySelector('.tab-btn[aria-selected="true"]');
      moveIndicator(activeBtn);
    });

    const statVideos = document.getElementById('stat-videos');
    if (statVideos) statVideos.textContent = totalVideos > 0 ? `${totalVideos}+` : '—';

    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
      lastUpdated.textContent = data.updatedAt
        ? `Sincronizado automaticamente · última atualização em ${dateTimeFmt.format(new Date(data.updatedAt))}`
        : 'A aguardar a primeira sincronização automática do canal.';
    }
  }

  function showPlaylistSkeleton() {
    if (!panelsEl) return;
    const panel = document.createElement('div');
    panel.className = 'panel is-active';
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    grid.appendChild(skeletonGrid());
    panel.appendChild(grid);
    panelsEl.appendChild(panel);
  }

  showPlaylistSkeleton();

  fetch('data/videos.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('videos.json indisponível'); return r.json(); })
    .then(renderPlaylists)
    .catch((err) => {
      console.warn('[TechForYou] Não foi possível carregar os vídeos:', err);
      panelsEl.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar os vídeos agora</strong><span>Tenta novamente mais tarde ou vê o canal diretamente no <a href="https://www.youtube.com/@TechForYou-ww3zt" target="_blank" rel="noopener" style="color:var(--primary)">YouTube</a>.</span></div>`;
    });

  /* ---------------------------------------------------------
     Tutorials grid
  --------------------------------------------------------- */
  const tutorialGrid = document.getElementById('tutorial-grid');

  function tutorialCard(t) {
    const a = document.createElement('a');
    a.className = 'tutorial-card';
    a.href = t.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="tutorial-icon">${escapeHtml(t.initials || t.title.slice(0, 2).toUpperCase())}</span>
      <h3>${escapeHtml(t.title)}</h3>
      <p>${escapeHtml(t.description)}</p>
      <span class="tutorial-arrow">Ler tutorial
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </span>`;
    attachTilt(a);
    return a;
  }

  if (tutorialGrid) {
    fetch('data/tutorials.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('tutorials.json indisponível'); return r.json(); })
      .then(list => {
        tutorialGrid.innerHTML = '';
        list.forEach(t => tutorialGrid.appendChild(tutorialCard(t)));
        const statTutorials = document.getElementById('stat-tutorials');
        if (statTutorials) statTutorials.textContent = list.length;
      })
      .catch((err) => {
        console.warn('[TechForYou] Não foi possível carregar os tutoriais:', err);
        tutorialGrid.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar os tutoriais agora</strong><span>Visita <a href="https://techforyou-fd.github.io" target="_blank" rel="noopener" style="color:var(--primary)">techforyou-fd.github.io</a> diretamente.</span></div>`;
      });
  }

})();
