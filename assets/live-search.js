/**
 * Interactive Universal Search palette — vanilla HTML/JS port of DashboardSearch.svelte.
 * Used by delivery index.html (no build).
 */
(function () {
  const now = Date.now();
  const RESULTS = [
    {
      id: 'd1',
      title: 'Team process 2026',
      kind: 'diagram',
      owner: 'Martin',
      updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'd2',
      title: 'Process David proposal',
      kind: 'diagram',
      owner: 'David',
      updatedAt: now - 14 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'd3',
      title: 'Process draft website architecture',
      kind: 'flow',
      owner: 'Martin',
      updatedAt: now - 26 * 24 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'pr1',
      title: 'pr-review-architecture',
      kind: 'diagram',
      owner: 'rubenmango',
      updatedAt: now - 4 * 24 * 60 * 60 * 1000,
      pr: '356',
      entity: 'person',
    },
    {
      id: 't1',
      title: 'App team roadmap',
      kind: 'document',
      owner: 'App team',
      updatedAt: now - 7 * 24 * 60 * 60 * 1000,
      entity: 'team',
    },
  ];

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'diagrams', label: 'Diagrams' },
    { id: 'flows', label: 'Flows' },
    { id: 'documents', label: 'Documents' },
    { id: 'person', label: 'Person' },
    { id: 'teams', label: 'Teams' },
  ];

  const state = {
    open: false,
    query: '',
    filter: 'all',
    activeIndex: 0,
    ownerView: null,
    prView: null,
    emptyMode: 'default',
    loadState: 'idle',
    toast: '',
  };

  const el = {
    overlay: null,
    panel: null,
    toast: null,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function normalizePr(pr) {
    return String(pr).replace(/^#/, '').trim();
  }

  function formatPr(pr) {
    const n = normalizePr(pr);
    return n ? `#${n}` : '';
  }

  function relativeTime(ts) {
    if (ts == null) return '';
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `Edited ${d}d`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo`;
    return `${Math.floor(d / 365)}y`;
  }

  function rewindTitle(title) {
    const parts = title.trim().split(/\s+/);
    if (parts.length < 2) return { lead: title, trail: '' };
    return { lead: parts.slice(0, -1).join(' '), trail: parts[parts.length - 1] };
  }

  function titleParts(title, q) {
    const query = q.trim();
    if (!query) return { before: '', match: title, after: '' };
    const i = title.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return { before: '', match: '', after: title };
    return {
      before: title.slice(0, i),
      match: title.slice(i, i + query.length),
      after: title.slice(i + query.length),
    };
  }

  function isTeamEntity(r) {
    if (r.entity === 'team') return true;
    if (r.entity === 'person') return false;
    const o = r.owner.toLowerCase();
    return o.includes('team') || o === 'app team';
  }

  function recentItems() {
    return RESULTS.slice(0, 2);
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    let base = RESULTS;
    if (state.ownerView) {
      base = RESULTS.filter((r) => r.owner.toLowerCase() === state.ownerView.toLowerCase());
    } else if (state.prView) {
      base = RESULTS.filter((r) => r.pr && normalizePr(r.pr) === state.prView);
    }
    return base.filter((r) => {
      if (state.filter === 'diagrams' && r.kind !== 'diagram') return false;
      if (state.filter === 'flows' && r.kind !== 'flow') return false;
      if (state.filter === 'documents' && r.kind !== 'document') return false;
      if (state.filter === 'person' && isTeamEntity(r)) return false;
      if (state.filter === 'teams' && !isTeamEntity(r)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        (r.pr != null && formatPr(r.pr).toLowerCase().includes(q))
      );
    });
  }

  function emptyRows() {
    if (state.emptyMode === 'team') {
      return [
        { id: 'shared-dolly', type: 'team' },
        { id: 'shared-app-team', type: 'team' },
        { id: 'create-team', type: 'team' },
      ];
    }
    const rows = recentItems().map((r) => ({ id: r.id, type: 'rewind' }));
    rows.push({ id: 'pull-github', type: 'rewind' });
    rows.push({ id: 'create-diagram', type: 'action' });
    rows.push({ id: 'create-flow', type: 'action' });
    rows.push({ id: 'pull-github-action', type: 'action' });
    return rows;
  }

  function isEmptyQuery() {
    return state.query.trim() === '';
  }

  function isDrillIn() {
    return state.ownerView != null || state.prView != null;
  }

  function navCount() {
    if (isDrillIn()) return filtered().length;
    if (isEmptyQuery()) return emptyRows().length;
    return filtered().length;
  }

  function showToast(msg) {
    state.toast = msg;
    if (el.toast) {
      el.toast.textContent = msg;
      el.toast.hidden = !msg;
    }
  }

  function openPalette(seed) {
    if (seed) {
      state.query = seed.query ?? '';
      state.filter = seed.filter ?? 'all';
      state.emptyMode = seed.emptyMode ?? 'default';
      state.loadState = seed.loadState ?? 'idle';
      state.ownerView = seed.ownerView ?? null;
      state.prView = seed.prView ?? null;
    }
    state.open = true;
    state.activeIndex = 0;
    render();
    requestAnimationFrame(() => {
      const input = $('.live-input', el.panel);
      input?.focus();
    });
  }

  function closePalette() {
    state.open = false;
    state.query = '';
    state.filter = 'all';
    state.activeIndex = 0;
    state.ownerView = null;
    state.prView = null;
    state.emptyMode = 'default';
    state.loadState = 'idle';
    render();
  }

  function openOwner(name) {
    state.prView = null;
    state.ownerView = name;
    state.query = '';
    state.filter = 'all';
    state.activeIndex = 0;
    render();
  }

  function openPr(pr) {
    state.ownerView = null;
    state.prView = normalizePr(pr);
    state.query = '';
    state.filter = 'all';
    state.activeIndex = 0;
    render();
  }

  function exitDrillIn() {
    state.ownerView = null;
    state.prView = null;
    state.activeIndex = 0;
    render();
  }

  function runEmptyAction(id) {
    if (id === 'shared-dolly') return openOwner('Dolly Parton');
    if (id === 'shared-app-team') return openOwner('App team');
    if (id === 'create-team') {
      showToast('Create team');
      return closePalette();
    }
    if (id === 'pull-github' || id === 'pull-github-action') {
      showToast('Pull GitHub diagrams');
      return closePalette();
    }
    if (id === 'create-diagram') {
      showToast('Create new diagram');
      return closePalette();
    }
    if (id === 'create-flow') {
      showToast('Create new Flow');
      return closePalette();
    }
    const item = RESULTS.find((r) => r.id === id);
    showToast(item ? `Open · ${item.title}` : `Open · ${id}`);
    closePalette();
  }

  function selectActive() {
    if (isDrillIn()) {
      const item = filtered()[state.activeIndex];
      if (!item) return;
      showToast(`Open · ${item.title}`);
      return closePalette();
    }
    if (isEmptyQuery()) {
      const row = emptyRows()[state.activeIndex];
      if (row) runEmptyAction(row.id);
      return;
    }
    const item = filtered()[state.activeIndex];
    if (!item) return;
    showToast(`Open · ${item.title}`);
    closePalette();
  }

  function iconGlyph(kind) {
    if (kind === 'flow') return '▤';
    if (kind === 'document') return '☰';
    return '◈';
  }

  function ghIcon() {
    return `<span class="icon-box gh" aria-hidden="true" style="mask:url('./assets/icons/github.svg') center/contain no-repeat;-webkit-mask:url('./assets/icons/github.svg') center/contain no-repeat;background:var(--deep-800)"></span>`;
  }

  function searchIcon() {
    return `<img src="./assets/icons/search.svg" alt="" width="16" height="16" />`;
  }

  function highlightTitle(title) {
    const p = titleParts(title, state.query);
    if (!p.match && p.after) return escapeHtml(p.after);
    if (!state.query.trim()) {
      const rw = rewindTitle(title);
      return `<strong>${escapeHtml(rw.lead)}</strong>${rw.trail ? ` <span class="dim">${escapeHtml(rw.trail)}</span>` : ''}`;
    }
    return `${escapeHtml(p.before)}<strong>${escapeHtml(p.match)}</strong>${escapeHtml(p.after)}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rowMeta(item, opts) {
    const bits = [];
    if (item.pr) {
      bits.push(
        `<button type="button" class="badge meta-pr" data-pr="${escapeHtml(item.pr)}">${escapeHtml(formatPr(item.pr))}</button>`,
      );
    }
    bits.push(
      `<button type="button" class="owner" data-owner="${escapeHtml(item.owner)}">${escapeHtml(item.owner)}</button>`,
    );
    if (item.updatedAt != null) {
      bits.push(`<span class="time">${escapeHtml(relativeTime(item.updatedAt))}</span>`);
    }
    if (opts && opts.open) {
      return `<span class="open-chip">Open</span>`;
    }
    return `<span class="meta-row">${bits.join('')}</span>`;
  }

  function renderFilters() {
    return `<div class="filters" role="tablist" aria-label="Search filters">${FILTERS.map(
      (f) =>
        `<button type="button" role="tab" class="filter${state.filter === f.id ? ' active' : ''}" data-filter="${f.id}" aria-selected="${state.filter === f.id}">${f.label}</button>`,
    ).join('')}</div>`;
  }

  function renderHeader() {
    if (state.ownerView) {
      const initials = state.ownerView
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return `<div class="field drill">
        <div class="drill-left">
          <button type="button" class="back" aria-label="Back">←</button>
          <span class="avatar">${escapeHtml(initials)}</span>
          <span class="q">${escapeHtml(state.ownerView)}</span>
        </div>
        <span class="badge">Shared</span>
      </div>`;
    }
    if (state.prView) {
      return `<div class="field drill">
        <div class="drill-left">
          <button type="button" class="back" aria-label="Back">←</button>
          ${ghIcon()}
          <span class="q">${escapeHtml(formatPr(state.prView))}</span>
        </div>
        <span class="badge">Connection</span>
      </div>`;
    }
    return `<div class="field">
      <div class="field-left">
        <span class="search-ic" aria-hidden="true">${searchIcon()}</span>
        <input class="live-input" type="search" placeholder="What are you looking for" value="${escapeHtml(state.query)}" aria-label="Search" />
      </div>
      <span class="chip">${isEmptyQuery() ? '⌘K' : '↵'}</span>
    </div>`;
  }

  function renderEmptyDefault() {
    const rows = emptyRows();
    const recent = recentItems();
    let recentHtml = recent
      .map((item) => {
        const idx = rows.findIndex((r) => r.id === item.id);
        const active = state.activeIndex === idx;
        return `<div class="row${active ? ' is-active' : ''}" role="option" data-action="${item.id}" data-idx="${idx}">
          <span><span class="icon-box">${iconGlyph(item.kind)}</span> ${highlightTitle(item.title)}</span>
          ${rowMeta(item)}
        </div>`;
      })
      .join('');

    const pullIdx = rows.findIndex((r) => r.id === 'pull-github');
    recentHtml += `<button type="button" class="row${state.activeIndex === pullIdx ? ' is-active' : ''}" role="option" data-action="pull-github" data-idx="${pullIdx}">
      <span>${ghIcon()} <strong>Pull GitHub diagrams</strong></span>
      <span class="badge">Connection</span>
    </button>`;

    const actions = [
      { id: 'create-diagram', label: '<strong>Create new diagram</strong>', badge: 'Create', icon: '◈' },
      {
        id: 'create-flow',
        label: '<strong>Create</strong> new Flow',
        badge: 'New',
        badgeClass: 'new',
        icon: '▤',
      },
      {
        id: 'pull-github-action',
        label: '<strong>Pull GitHub diagrams</strong>',
        badge: 'Connection',
        gh: true,
      },
    ]
      .map((a) => {
        const idx = rows.findIndex((r) => r.id === a.id);
        const active = state.activeIndex === idx;
        const icon = a.gh ? ghIcon() : `<span class="icon-box">${a.icon}</span>`;
        return `<button type="button" class="row${active ? ' is-active' : ''}" role="option" data-action="${a.id}" data-idx="${idx}">
          <span>${icon} ${a.label}</span>
          <span class="badge${a.badgeClass ? ' ' + a.badgeClass : ''}">${a.badge}</span>
        </button>`;
      })
      .join('');

    return `
      <div class="block">
        <p class="sec-title">Recent</p>
        <div class="list" role="listbox">${recentHtml}</div>
      </div>
      <div class="block">
        <p class="sec-title">Quick actions</p>
        <div class="list plain" role="listbox">${actions}</div>
      </div>`;
  }

  function renderEmptyTeam() {
    const rows = emptyRows();
    const items = [
      { id: 'shared-dolly', title: 'Dolly Parton', badge: 'Shared with you' },
      { id: 'shared-app-team', title: 'App team', badge: 'Shared with you' },
      { id: 'create-team', title: 'Create a new team', badge: 'Share a shared space' },
    ]
      .map((a) => {
        const idx = rows.findIndex((r) => r.id === a.id);
        return `<button type="button" class="row${state.activeIndex === idx ? ' is-active' : ''}" data-action="${a.id}" data-idx="${idx}">
          <span><span class="icon-box">◎</span> <strong>${escapeHtml(a.title)}</strong></span>
          <span class="badge">${escapeHtml(a.badge)}</span>
        </button>`;
      })
      .join('');
    return `<div class="block">
      <p class="sec-title">Explore your team’s shared files</p>
      <div class="list plain" role="listbox">${items}</div>
    </div>`;
  }

  function renderResultsBody() {
    if (state.loadState === 'loading') {
      return `<div class="block">
        <p class="sec-title">Results</p>
        <div class="list">
          <div class="row"><span class="skel" style="width:160px"></span><span class="skel" style="width:72px"></span></div>
          <div class="row"><span class="skel" style="width:140px"></span><span class="skel" style="width:64px"></span></div>
          <div class="row"><span class="skel" style="width:180px"></span><span class="skel" style="width:80px"></span></div>
        </div>
      </div>`;
    }
    if (state.loadState === 'error') {
      return `<div class="msg">
        <strong>Something went wrong</strong>
        <p>We couldn’t load search results. Check your connection and try again.</p>
        <button type="button" class="retry" data-retry>Try again</button>
      </div>`;
    }
    const list = filtered();
    if (list.length === 0) {
      const q = state.query.trim() || 'that query';
      return `<div class="msg">
        <strong>No results for “${escapeHtml(q)}”</strong>
        <p>Nothing in this view matched that query.</p>
      </div>`;
    }

    if (isDrillIn()) {
      const groups = [
        { label: 'Diagrams', items: list.filter((r) => r.kind === 'diagram') },
        { label: 'Flows', items: list.filter((r) => r.kind === 'flow') },
        { label: 'Documents', items: list.filter((r) => r.kind === 'document') },
      ];
      return groups
        .filter((g) => g.items.length)
        .map((g) => {
          const rows = g.items
            .map((item) => {
              const idx = list.findIndex((r) => r.id === item.id);
              const active = state.activeIndex === idx;
              return `<button type="button" class="row${active ? ' is-active' : ''}" data-open="${item.id}" data-idx="${idx}">
                <span><span class="icon-box">${iconGlyph(item.kind)}</span> ${highlightTitle(item.title)}</span>
                ${active ? '<span class="open-chip">Open</span>' : rowMeta(item)}
              </button>`;
            })
            .join('');
          return `<div class="block"><p class="sec-title">${g.label}</p><div class="list">${rows}</div></div>`;
        })
        .join('');
    }

    const rows = list
      .map((item, idx) => {
        const active = state.activeIndex === idx;
        const inner = `<span><span class="icon-box">${iconGlyph(item.kind)}</span> ${highlightTitle(item.title)}</span>${active ? '<span class="open-chip">Open</span>' : rowMeta(item)}`;
        if (active) {
          return `<div class="row active-wrap" data-open="${item.id}" data-idx="${idx}"><div class="row active">${inner}</div></div>`;
        }
        return `<button type="button" class="row" data-open="${item.id}" data-idx="${idx}">${inner}</button>`;
      })
      .join('');

    return `<div class="block"><p class="sec-title">Results</p><div class="list" role="listbox">${rows}</div></div>`;
  }

  function renderBody() {
    if (isDrillIn()) return renderResultsBody();
    if (isEmptyQuery()) {
      return state.emptyMode === 'team' ? renderEmptyTeam() : renderEmptyDefault();
    }
    return renderResultsBody();
  }

  function renderFooter() {
    return `<div class="palette-footer">
      <span>Navigate <kbd>↑</kbd> <kbd>↓</kbd></span>
      <span>Select <kbd>↵</kbd></span>
      <span>Close <kbd>Esq</kbd></span>
    </div>`;
  }

  function render() {
    if (!el.overlay || !el.panel) return;
    el.overlay.hidden = !state.open;
    document.body.style.overflow = state.open ? 'hidden' : '';
    if (!state.open) return;

    el.panel.innerHTML = `
      ${renderHeader()}
      ${isDrillIn() ? '' : renderFilters()}
      ${renderBody()}
      ${renderFooter()}
    `;

    bindPanelEvents();
  }

  function bindPanelEvents() {
    const panel = el.panel;
    const input = $('.live-input', panel);
    input?.addEventListener('input', (e) => {
      state.query = e.target.value;
      state.activeIndex = 0;
      state.loadState = 'idle';
      render();
      const again = $('.live-input', el.panel);
      if (again) {
        again.focus();
        const len = again.value.length;
        again.setSelectionRange(len, len);
      }
    });

    panel.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filter = btn.getAttribute('data-filter');
        state.activeIndex = 0;
        render();
      });
    });

    panel.querySelectorAll('.back').forEach((btn) => {
      btn.addEventListener('click', exitDrillIn);
    });

    panel.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => runEmptyAction(btn.getAttribute('data-action')));
      btn.addEventListener('mouseenter', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (!Number.isNaN(idx) && idx !== state.activeIndex) {
          state.activeIndex = idx;
          render();
        }
      });
    });

    panel.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open');
        const item = RESULTS.find((r) => r.id === id);
        showToast(item ? `Open · ${item.title}` : `Open · ${id}`);
        closePalette();
      });
      btn.addEventListener('mouseenter', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (!Number.isNaN(idx) && idx !== state.activeIndex) {
          state.activeIndex = idx;
          render();
        }
      });
    });

    panel.querySelectorAll('[data-owner]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openOwner(btn.getAttribute('data-owner'));
      });
    });

    panel.querySelectorAll('[data-pr]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPr(btn.getAttribute('data-pr'));
      });
    });

    panel.querySelectorAll('[data-retry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.loadState = 'idle';
        render();
      });
    });
  }

  function onKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (state.open) closePalette();
      else openPalette();
      return;
    }
    if (!state.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isDrillIn()) exitDrillIn();
      else closePalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.activeIndex = Math.min(state.activeIndex + 1, Math.max(0, navCount() - 1));
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.activeIndex = Math.max(state.activeIndex - 1, 0);
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectActive();
    }
  }

  const SEEDS = {
    empty: { query: '', loadState: 'idle', emptyMode: 'default' },
    results: { query: 'Process', loadState: 'idle', emptyMode: 'default' },
    'no-results': { query: 'zzzz not found', loadState: 'idle', emptyMode: 'default' },
    error: { query: 'Process team', loadState: 'error', emptyMode: 'default' },
    loading: { query: 'Process team', loadState: 'loading', emptyMode: 'default' },
    team: { query: '', loadState: 'idle', emptyMode: 'team' },
  };

  function init() {
    el.overlay = document.getElementById('live-overlay');
    el.panel = document.getElementById('live-panel');
    el.toast = document.getElementById('live-toast');
    if (!el.overlay || !el.panel) return;

    document.getElementById('live-trigger')?.addEventListener('click', () => openPalette());
    el.overlay.addEventListener('click', (e) => {
      if (e.target === el.overlay) closePalette();
    });

    document.querySelectorAll('[data-seed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-seed');
        const seed = SEEDS[key];
        if (!seed) return;
        document.querySelectorAll('[data-seed]').forEach((b) => b.classList.remove('is-on'));
        btn.classList.add('is-on');
        openPalette(seed);
      });
    });

    window.addEventListener('keydown', onKeydown);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
