<script lang="ts">
  // Dashboard command search — Figma Dashboard Expansion
  //   4014:7524 trigger · 4014:7623 results · 4014:7842 empty (Rewind + Quick actions)
  import { base } from '$app/paths';
  import Icon from '$lib/components/Icon.svelte';
  import PopupOverlay from '$lib/components/popup/PopupOverlay.svelte';
  import RepoPrTag from '$lib/components/RepoPrTag.svelte';
  import SearchStatusMessage from '$lib/components/SearchStatusMessage.svelte';

  export type SearchResult = {
    id: string;
    title: string;
    kind: 'diagram' | 'flow' | 'document';
    fileType: string;
    owner: string;
    /** Epoch ms — drives compact timeline (1h · 5d · 1mo). */
    updatedAt?: number;
    /** Present when linked to a GitHub PR — show chip; # reveals on hover. */
    pr?: string;
    prStatus?: 'open' | 'merged';
    /** Optional entity hint for Person / Teams filters. */
    entity?: 'person' | 'team';
  };

  type FilterId = 'all' | 'diagrams' | 'flows' | 'documents' | 'person' | 'teams';
  type EmptyRowId =
    | 'rewind-0'
    | 'rewind-1'
    | 'pull-github'
    | 'create-diagram'
    | 'create-flow'
    | 'shared-dolly'
    | 'shared-app-team'
    | 'create-team';
  type EmptyMode = 'default' | 'team';
  export type SearchLoadState = 'idle' | 'loading' | 'error';

  interface Props {
    results?: SearchResult[];
    /** Recent items for the empty-state Rewind list (defaults to first 2 of results). */
    recentResults?: SearchResult[];
    /** When `team`, empty query shows explore shared people/teams (Figma 4014:8061). */
    emptyMode?: EmptyMode;
    /** Label for team-space tip (e.g. General). */
    teamSpaceLabel?: string;
    /** Bindable palette open — parent can open on team-space nav. */
    open?: boolean;
    /** Simulated / real fetch status for results body. */
    loadState?: SearchLoadState;
    /** Optional query seeded when the palette opens (delivery / demos). */
    seedQuery?: string;
    onOpenResult?: (id: string) => void;
    onCreateDiagram?: () => void;
    onCreateFlow?: () => void;
    onPullGithub?: () => void;
    onCreateTeam?: () => void;
    onRetrySearch?: () => void;
  }

  let {
    results = [],
    recentResults,
    emptyMode = 'default',
    teamSpaceLabel = 'Team',
    open = $bindable(false),
    loadState = 'idle',
    seedQuery = '',
    onOpenResult,
    onCreateDiagram,
    onCreateFlow,
    onPullGithub,
    onCreateTeam,
    onRetrySearch,
  }: Props = $props();

  let query = $state('');
  let filter = $state<FilterId>('all');
  let activeIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();
  /** Figma 4014:9127 — browse an owner's shared designs. */
  let ownerView = $state<string | null>(null);
  /** Drill-in: all diagrams linked to this PR number (normalized, no #). */
  let prView = $state<string | null>(null);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'diagrams', label: 'Diagrams' },
    { id: 'flows', label: 'Flows' },
    { id: 'documents', label: 'Documents' },
    { id: 'person', label: 'Person' },
    { id: 'teams', label: 'Teams' },
  ];

  let isEmptyQuery = $derived(query.trim() === '');
  let isDrillIn = $derived(ownerView != null || prView != null);

  function normalizePr(pr: string): string {
    return pr.replace(/^#/, '').trim();
  }

  function formatPr(pr: string): string {
    const n = normalizePr(pr);
    return n ? `#${n}` : '';
  }

  let rewindItems = $derived(
    (recentResults && recentResults.length > 0 ? recentResults : results).slice(0, 2),
  );

  /** Empty-state navigable rows: team explore OR rewind + quick actions. */
  let emptyRows = $derived.by((): { id: EmptyRowId | string; type: 'rewind' | 'action' | 'team' }[] => {
    if (emptyMode === 'team') {
      return [
        { id: 'shared-dolly', type: 'team' },
        { id: 'shared-app-team', type: 'team' },
        { id: 'create-team', type: 'team' },
      ];
    }
    const rows: { id: EmptyRowId | string; type: 'rewind' | 'action' | 'team' }[] = [];
    for (const r of rewindItems) rows.push({ id: r.id, type: 'rewind' });
    rows.push({ id: 'pull-github', type: 'rewind' });
    rows.push({ id: 'create-diagram', type: 'action' });
    rows.push({ id: 'create-flow', type: 'action' });
    rows.push({ id: 'pull-github-action', type: 'action' });
    return rows;
  });

  function isTeamEntity(r: SearchResult): boolean {
    if (r.entity === 'team') return true;
    if (r.entity === 'person') return false;
    const o = r.owner.toLowerCase();
    return o.includes('team') || o === 'app team';
  }

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const ov = ownerView;
    const pv = prView;
    const baseList = ov
      ? results.filter((r) => r.owner.toLowerCase() === ov.toLowerCase())
      : pv
        ? results.filter((r) => r.pr != null && normalizePr(r.pr) === pv)
        : results;
    return baseList.filter((r) => {
      if (filter === 'diagrams' && r.kind !== 'diagram') return false;
      if (filter === 'flows' && r.kind !== 'flow') return false;
      if (filter === 'documents' && r.kind !== 'document') return false;
      if (filter === 'person' && isTeamEntity(r)) return false;
      if (filter === 'teams' && !isTeamEntity(r)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        (r.pr != null && formatPr(r.pr).toLowerCase().includes(q))
      );
    });
  });

  let ownerDiagrams = $derived(filtered.filter((r) => r.kind === 'diagram'));
  let ownerFlows = $derived(filtered.filter((r) => r.kind === 'flow'));
  let ownerDocuments = $derived(filtered.filter((r) => r.kind === 'document'));

  let navCount = $derived(
    isDrillIn
      ? filtered.length
      : isEmptyQuery
        ? emptyRows.length
        : filtered.length,
  );

  $effect(() => {
    void navCount;
    activeIndex = 0;
  });

  function openPalette() {
    open = true;
    if (seedQuery) query = seedQuery;
    queueMicrotask(() => inputEl?.focus());
  }

  function closePalette() {
    open = false;
    query = '';
    filter = 'all';
    activeIndex = 0;
    ownerView = null;
    prView = null;
  }

  /** Focus input when parent opens via bind:open (e.g. team-space nav). */
  $effect(() => {
    if (open) {
      if (seedQuery) query = seedQuery;
      queueMicrotask(() => inputEl?.focus());
    }
  });

  function openOwner(name: string, e?: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    prView = null;
    ownerView = name;
    query = '';
    filter = 'all';
    activeIndex = 0;
  }

  function openPr(pr: string, e?: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    ownerView = null;
    prView = normalizePr(pr);
    query = '';
    filter = 'all';
    activeIndex = 0;
  }

  function exitDrillIn() {
    ownerView = null;
    prView = null;
    activeIndex = 0;
  }

  function ownerInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return (name.slice(0, 2) || '?').toUpperCase();
  }

  function runEmptyAction(id: string) {
    if (id === 'shared-dolly') {
      openOwner('Dolly Parton');
      return;
    }
    if (id === 'shared-app-team') {
      openOwner('App team');
      return;
    }
    if (id === 'create-team') {
      onCreateTeam?.();
      closePalette();
      return;
    }
    if (id === 'pull-github' || id === 'pull-github-action') {
      onPullGithub?.();
      closePalette();
      return;
    }
    if (id === 'create-diagram') {
      onCreateDiagram?.();
      closePalette();
      return;
    }
    if (id === 'create-flow') {
      onCreateFlow?.();
      closePalette();
      return;
    }
    onOpenResult?.(id);
    closePalette();
  }

  function selectActive() {
    if (isDrillIn) {
      const item = filtered[activeIndex];
      if (!item) return;
      onOpenResult?.(item.id);
      closePalette();
      return;
    }
    if (isEmptyQuery) {
      const row = emptyRows[activeIndex];
      if (row) runEmptyAction(row.id);
      return;
    }
    const item = filtered[activeIndex];
    if (!item) return;
    onOpenResult?.(item.id);
    closePalette();
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (open) closePalette();
      else openPalette();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, Math.max(0, navCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectActive();
    }
  }

  function titleParts(title: string): { before: string; match: string; after: string } {
    const q = query.trim();
    if (!q) return { before: '', match: title, after: '' };
    const i = title.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return { before: '', match: '', after: title };
    return {
      before: title.slice(0, i),
      match: title.slice(i, i + q.length),
      after: title.slice(i + q.length),
    };
  }

  function kindIcon(kind: SearchResult['kind']): string {
    if (kind === 'document') return 'news';
    if (kind === 'flow') return 'hub';
    return 'account_tree';
  }

  function emptyRowIndex(id: string): number {
    return emptyRows.findIndex((r) => r.id === id);
  }

  /** Figma Rewind title: leading words medium, trailing word muted. */
  function rewindTitle(title: string): { lead: string; trail: string } {
    const parts = title.trim().split(/\s+/);
    if (parts.length < 2) return { lead: title, trail: '' };
    return { lead: parts.slice(0, -1).join(' '), trail: parts[parts.length - 1] ?? '' };
  }

  /** Compact timeline: now · 2m · 1h · Edited 5d · 1mo (Figma mix). */
  function relativeTime(ts: number | undefined): string {
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

  let pullGithubIdx = $derived(emptyRowIndex('pull-github'));
  let createDiagramIdx = $derived(emptyRowIndex('create-diagram'));
  let createFlowIdx = $derived(emptyRowIndex('create-flow'));
  let pullGithubActionIdx = $derived(emptyRowIndex('pull-github-action'));
  let sharedDollyIdx = $derived(emptyRowIndex('shared-dolly'));
  let sharedAppTeamIdx = $derived(emptyRowIndex('shared-app-team'));
  let createTeamIdx = $derived(emptyRowIndex('create-team'));
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- Compact trigger — Figma 4014:7524 -->
<button
  type="button"
  class="flex h-[34px] w-full items-center justify-between rounded-lg border border-storm-grey-50 bg-storm-grey-25 transition-colors hover:border-storm-grey-100"
  data-node-id="4014:7524"
  data-dashboard-search-trigger
  aria-label="Search anything"
  onclick={openPalette}
>
  <span class="flex items-center pl-1 pr-2">
    <span class="relative flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
      <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
    </span>
    <span class="px-1.5 text-[12px] leading-none text-storm-grey-400">Search anything</span>
  </span>
  <span
    class="mr-1 flex h-6 items-center rounded-lg px-2 text-[12px] font-medium leading-none text-storm-grey-400"
  >
    ⌘K
  </span>
</button>

{#if open}
  <PopupOverlay onBackdropClick={closePalette}>
    <div
      class="flex w-[511px] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
      data-node-id={ownerView
        ? '4014:9127'
        : prView
          ? '4034:21258'
          : isEmptyQuery && emptyMode === 'team'
            ? '4014:8061'
            : isEmptyQuery
              ? '2233:35142'
              : '4105:10700'}
      data-dashboard-search-open
      data-empty={isEmptyQuery && !isDrillIn ? 'true' : undefined}
      data-empty-mode={isEmptyQuery && !isDrillIn ? emptyMode : undefined}
      data-owner-view={ownerView ?? undefined}
      data-pr-view={prView ?? undefined}
      data-load-state={loadState}
    >
      {#if ownerView}
        <!-- Owner profile header — Figma 4014:9127 -->
        <div
          class="flex h-12 w-full items-center justify-between rounded-xl bg-white/95 py-1"
        >
          <div class="flex min-w-0 items-center gap-2">
            <button
              type="button"
              class="flex size-7 shrink-0 items-center justify-center rounded text-storm-grey-400 transition-colors hover:bg-storm-grey-50 hover:text-storm-grey-700"
              aria-label="Back"
              onclick={exitDrillIn}
            >
              <Icon name="arrow_back" size={16} alt="" />
            </button>
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-deep-purple-50 text-[11px] font-medium text-deep-purple-800"
              aria-hidden="true"
            >
              {ownerInitials(ownerView)}
            </span>
            <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
              >{ownerView}</span
            >
          </div>
          <span
            class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
          >
            Shared
          </span>
        </div>
      {:else if prView}
        <!-- PR drill-in — same shell as owner profile -->
        <div
          class="flex h-12 w-full items-center justify-between rounded-xl bg-white/95 py-1"
        >
          <div class="flex min-w-0 items-center gap-2">
            <button
              type="button"
              class="flex size-7 shrink-0 items-center justify-center rounded text-storm-grey-400 transition-colors hover:bg-storm-grey-50 hover:text-storm-grey-700"
              aria-label="Back"
              onclick={exitDrillIn}
            >
              <Icon name="arrow_back" size={16} alt="" />
            </button>
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-lg p-1"
              aria-hidden="true"
            >
              <span
                class="inline-flex size-5 bg-deep-purple-800"
                style="mask: url('{base}/icons/github.svg') center / contain no-repeat; -webkit-mask: url('{base}/icons/github.svg') center / contain no-repeat;"
              ></span>
            </span>
            <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
              >{formatPr(prView)}</span
            >
          </div>
          <span
            class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
          >
            Connection
          </span>
        </div>
      {:else}
        <div
          class="flex h-12 w-full items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3 py-1"
        >
          <div class="flex min-w-0 flex-1 items-center">
            <span class="relative flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
              <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
            </span>
            <input
              bind:this={inputEl}
              bind:value={query}
              type="search"
              placeholder="What are you looking for"
              class="min-w-0 flex-1 bg-transparent px-1.5 text-[14px] text-storm-grey-800 outline-none placeholder:text-storm-grey-400"
              aria-label="Search"
            />
          </div>
          <span
            class="flex h-6 shrink-0 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
          >
            {isEmptyQuery ? '⌘K' : '↵'}
          </span>
        </div>
      {/if}

      <div class="flex gap-1 rounded-lg" role="tablist" aria-label="Search filters">
        {#each filters as f (f.id)}
          <button
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            class="flex h-7 items-center justify-center rounded-[7px] px-3 py-2 text-[12px] leading-[22px] transition-colors {filter ===
            f.id
              ? 'border border-storm-grey-100 bg-white text-black'
              : 'text-storm-grey-400 hover:text-storm-grey-600'}"
            onclick={() => (filter = f.id)}
          >
            {f.label}
          </button>
        {/each}
      </div>

      {#if isDrillIn}
        <!-- Owner / PR designs — Figma 4014:9127 -->
        {#each [
          { label: 'Diagrams', items: ownerDiagrams },
          { label: 'Flows', items: ownerFlows },
          { label: 'Documents', items: ownerDocuments },
        ] as section (section.label)}
          {#if section.items.length > 0 && (filter === 'all' || (filter === 'diagrams' && section.label === 'Diagrams') || (filter === 'flows' && section.label === 'Flows') || (filter === 'documents' && section.label === 'Documents'))}
            <div class="flex w-full flex-col gap-2">
              <div class="px-3">
                <p class="text-[12px] leading-[22px] text-storm-grey-400">{section.label}</p>
              </div>
              <div
                class="flex w-full flex-col overflow-hidden rounded-2xl border border-storm-grey-25 bg-storm-grey-25"
                role="listbox"
                aria-label={section.label}
              >
                {#each section.items as item (item.id)}
                  {@const idx = filtered.findIndex((r) => r.id === item.id)}
                  {@const parts = rewindTitle(item.title)}
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    class="flex h-12 w-full items-center justify-between px-3 text-left {activeIndex ===
                    idx
                      ? 'bg-storm-grey-50'
                      : ''}"
                    onmouseenter={() => (activeIndex = idx)}
                    onclick={() => {
                      onOpenResult?.(item.id);
                      closePalette();
                    }}
                  >
                    <span class="flex min-w-0 items-center">
                      <Icon name={kindIcon(item.kind)} size={16} alt="" />
                      <span class="truncate px-1.5 text-[14px]">
                        <span class="font-medium text-storm-grey-700">{parts.lead}</span
                        >{#if parts.trail}<span class="text-storm-grey-400">
                            {parts.trail}</span
                          >{/if}
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2 text-[12px] font-light">
                      <span class="text-storm-grey-600">{item.owner}</span>
                      {#if item.updatedAt != null}
                        <span
                          class="tabular-nums text-storm-grey-400"
                          title={new Date(item.updatedAt).toLocaleString()}
                          >{relativeTime(item.updatedAt)}</span
                        >
                      {/if}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
        {#if filtered.length === 0}
          <div class="px-3 py-6 text-center text-[13px] text-storm-grey-400">
            {#if ownerView}
              No shared files from {ownerView}.
            {:else}
              No diagrams linked to {formatPr(prView ?? '')}.
            {/if}
          </div>
        {/if}
      {:else if isEmptyQuery && emptyMode === 'team'}
        <!-- Team explore — Figma 4014:8061 (lives in search, not page) -->
        <div class="flex w-full flex-col gap-2">
          <div class="px-3">
            <p class="text-[12px] leading-[22px] text-storm-grey-400">
              Explore your team’s shared files
            </p>
          </div>
          <div class="flex w-full flex-col gap-1" role="listbox" aria-label="Shared people and teams">
            <button
              type="button"
              role="option"
              aria-selected={activeIndex === sharedDollyIdx}
              class="flex h-12 w-full items-center justify-between rounded-xl px-3 text-left transition-colors {activeIndex ===
              sharedDollyIdx
                ? 'bg-storm-grey-50'
                : 'hover:bg-storm-grey-25'}"
              onmouseenter={() => (activeIndex = sharedDollyIdx)}
              onclick={() => runEmptyAction('shared-dolly')}
            >
              <span class="flex min-w-0 items-center">
                <span class="relative size-7 shrink-0 overflow-hidden rounded-full border border-white">
                  <img
                    src="{base}/avatars/dolly.png"
                    alt=""
                    class="size-full object-cover"
                  />
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >Dolly Parton</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Shared with you
              </span>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={activeIndex === sharedAppTeamIdx}
              class="flex h-12 w-full items-center justify-between rounded-xl px-3 text-left transition-colors {activeIndex ===
              sharedAppTeamIdx
                ? 'bg-storm-grey-50'
                : 'hover:bg-storm-grey-25'}"
              onmouseenter={() => (activeIndex = sharedAppTeamIdx)}
              onclick={() => runEmptyAction('shared-app-team')}
            >
              <span class="flex min-w-0 items-center">
                <span class="relative flex items-center pr-2">
                  <span
                    class="relative z-[3] size-7 shrink-0 overflow-hidden rounded-full border border-white"
                  >
                    <img src="{base}/avatars/team-1.png" alt="" class="size-full object-cover" />
                  </span>
                  <span
                    class="relative z-[2] -ml-[11px] size-7 shrink-0 overflow-hidden rounded-full border border-white"
                  >
                    <img src="{base}/avatars/team-2.png" alt="" class="size-full object-cover" />
                  </span>
                  <span
                    class="relative z-[1] -ml-[11px] size-7 shrink-0 overflow-hidden rounded-full border border-white"
                  >
                    <img src="{base}/avatars/team-3.png" alt="" class="size-full object-cover" />
                  </span>
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >App team</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Shared with you
              </span>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={activeIndex === createTeamIdx}
              class="flex h-12 w-full items-center justify-between rounded-xl px-3 text-left transition-colors {activeIndex ===
              createTeamIdx
                ? 'bg-storm-grey-50'
                : 'hover:bg-storm-grey-25'}"
              onmouseenter={() => (activeIndex = createTeamIdx)}
              onclick={() => runEmptyAction('create-team')}
            >
              <span class="flex min-w-0 items-center">
                <span class="relative flex items-center pr-2" aria-hidden="true">
                  <span
                    class="relative z-[3] size-7 shrink-0 rounded-full border border-white bg-storm-grey-200"
                  ></span>
                  <span
                    class="relative z-[2] -ml-[11px] size-7 shrink-0 rounded-full border border-white bg-storm-grey-100"
                  ></span>
                  <span
                    class="relative z-[1] -ml-[11px] size-7 shrink-0 rounded-full border border-white bg-storm-grey-50"
                  ></span>
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >Create a new team</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Share a shared space
              </span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 text-[12px] text-storm-grey-400">
          <Icon name="info" size={16} alt="" />
          <span
            >Invite people to {teamSpaceLabel} to start sharing diagrams and documents.</span
          >
        </div>
      {:else if isEmptyQuery}
        <!-- Empty state — Figma 2233:35142 (Recent + Quick actions) -->
        <div class="flex w-full flex-col gap-2">
          <div class="px-0">
            <p class="text-[12px] leading-[22px] text-storm-grey-400">Recent</p>
          </div>
          <div
            class="flex w-full flex-col overflow-hidden rounded-2xl border border-storm-grey-50 bg-storm-grey-25"
            role="listbox"
            aria-label="Recent"
          >
            {#each rewindItems as item (item.id)}
              {@const idx = emptyRowIndex(item.id)}
              {@const parts = rewindTitle(item.title)}
              <div
                role="option"
                tabindex="-1"
                aria-selected={activeIndex === idx}
                class="group/row flex h-12 w-full cursor-pointer items-center justify-between px-3 text-left {activeIndex ===
                idx
                  ? 'bg-storm-grey-50'
                  : ''}"
                onmouseenter={() => (activeIndex = idx)}
                onclick={() => runEmptyAction(item.id)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    runEmptyAction(item.id);
                  }
                }}
              >
                <span class="flex min-w-0 items-center">
                  <Icon name={kindIcon(item.kind)} size={16} alt="" />
                  <span class="truncate px-1.5 text-[14px]">
                    <span class="font-medium text-storm-grey-700">{parts.lead}</span
                    >{#if parts.trail}<span class="text-storm-grey-400"> {parts.trail}</span>{/if}
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2 text-[12px] font-light">
                  {#if item.pr}
                    <RepoPrTag
                      pr={item.pr}
                      status={item.prStatus ?? 'open'}
                      variant="meta"
                      onclick={(e) => openPr(item.pr!, e)}
                    />
                  {/if}
                  <a
                    href="#owner"
                    class="text-storm-grey-600 underline-offset-2 hover:underline"
                    onclick={(e) => openOwner(item.owner, e)}
                  >
                    {item.owner}
                  </a>
                  {#if item.updatedAt != null}
                    <span
                      class="tabular-nums text-storm-grey-400"
                      title={new Date(item.updatedAt).toLocaleString()}
                      >{relativeTime(item.updatedAt)}</span
                    >
                  {/if}
                </span>
              </div>
            {/each}
            <button
              type="button"
              role="option"
              aria-selected={activeIndex === pullGithubIdx}
              class="flex h-12 w-full items-center justify-between px-3 text-left {activeIndex ===
              pullGithubIdx
                ? 'bg-storm-grey-50'
                : ''}"
              onmouseenter={() => (activeIndex = pullGithubIdx)}
              onclick={() => runEmptyAction('pull-github')}
            >
              <span class="flex min-w-0 items-center">
                <span class="flex w-7 shrink-0 items-start rounded-lg p-1" aria-hidden="true">
                  <span
                    class="inline-flex h-5 w-full bg-deep-purple-800"
                    style="mask: url('{base}/icons/github.svg') center / contain no-repeat; -webkit-mask: url('{base}/icons/github.svg') center / contain no-repeat;"
                  ></span>
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >Pull GitHub diagrams</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Connection
              </span>
            </button>
          </div>
        </div>

        <div class="flex w-full flex-col gap-2">
          <div class="px-0">
            <p class="text-[12px] leading-[22px] text-storm-grey-400">Quick actions</p>
          </div>
          <div
            class="flex w-full flex-col overflow-hidden rounded-2xl border border-storm-grey-50"
            role="listbox"
            aria-label="Quick actions"
          >
            <button
              type="button"
              role="option"
              aria-selected={activeIndex === createDiagramIdx}
              class="flex h-12 w-full items-center justify-between px-3 text-left {activeIndex ===
              createDiagramIdx
                ? 'bg-storm-grey-50'
                : ''}"
              onmouseenter={() => (activeIndex = createDiagramIdx)}
              onclick={() => runEmptyAction('create-diagram')}
            >
              <span class="flex min-w-0 items-center">
                <span
                  class="flex shrink-0 items-start rounded-lg bg-deep-purple-50 p-1 text-deep-purple-800"
                  aria-hidden="true"
                >
                  <Icon name="account_tree" size={16} alt="" />
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >Create new diagram</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Create
              </span>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={activeIndex === createFlowIdx}
              class="flex h-12 w-full items-center justify-between px-3 text-left {activeIndex ===
              createFlowIdx
                ? 'bg-storm-grey-50'
                : ''}"
              onmouseenter={() => (activeIndex = createFlowIdx)}
              onclick={() => runEmptyAction('create-flow')}
            >
              <span class="flex min-w-0 items-center">
                <span
                  class="flex w-7 shrink-0 items-start rounded-lg bg-deep-purple-50 p-1 text-deep-purple-800"
                  aria-hidden="true"
                >
                  <Icon name="note_stack" size={16} alt="" />
                </span>
                <span class="truncate px-1.5 text-[14px] text-storm-grey-700">
                  <span class="font-medium">Create</span>
                  <span class="font-normal"> new Flow</span>
                </span>
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-[#b20e45] bg-[#fedfed] px-2 text-[12px] font-medium text-[#991824]"
              >
                New
              </span>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={activeIndex === pullGithubActionIdx}
              class="flex h-12 w-full items-center justify-between px-3 text-left {activeIndex ===
              pullGithubActionIdx
                ? 'bg-storm-grey-50'
                : ''}"
              onmouseenter={() => (activeIndex = pullGithubActionIdx)}
              onclick={() => runEmptyAction('pull-github-action')}
            >
              <span class="flex min-w-0 items-center">
                <span
                  class="flex w-7 shrink-0 items-start rounded-lg bg-deep-purple-50 p-1"
                  aria-hidden="true"
                >
                  <span
                    class="inline-flex h-5 w-full bg-deep-purple-800"
                    style="mask: url('{base}/icons/github.svg') center / contain no-repeat; -webkit-mask: url('{base}/icons/github.svg') center / contain no-repeat;"
                  ></span>
                </span>
                <span class="truncate px-1.5 text-[14px] font-medium text-storm-grey-700"
                  >Pull GitHub diagrams</span
                >
              </span>
              <span
                class="flex h-6 shrink-0 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
              >
                Connection
              </span>
            </button>
          </div>
        </div>
      {:else if loadState === 'loading'}
        <SearchStatusMessage kind="loading" />
      {:else if loadState === 'error'}
        <SearchStatusMessage kind="error" onRetry={onRetrySearch} />
      {:else}
        <!-- Typed search results — Figma 4105:10700 -->
        {#if filtered.length === 0}
          <SearchStatusMessage kind="no-results" query={query} />
        {:else}
          <div class="flex w-full flex-col gap-2">
            <div class="px-0">
              <p class="text-[12px] leading-[22px] text-storm-grey-400">Results</p>
            </div>
            <div
              class="flex w-full flex-col overflow-hidden rounded-2xl border border-storm-grey-25 bg-storm-grey-25"
              role="listbox"
              aria-label="Search results"
            >
              {#each filtered as item, i (item.id)}
                {@const parts = titleParts(item.title)}
                <div
                  role="option"
                  tabindex="-1"
                  aria-selected={i === activeIndex}
                  class="group/row flex h-12 w-full cursor-pointer items-center justify-between text-left {i ===
                  activeIndex
                    ? 'px-1.5'
                    : 'px-3 py-1'}"
                  onmouseenter={() => (activeIndex = i)}
                  onclick={() => {
                    onOpenResult?.(item.id);
                    closePalette();
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenResult?.(item.id);
                      closePalette();
                    }
                  }}
                >
                  {#if i === activeIndex}
                    <span
                      class="flex flex-1 items-center justify-between rounded-lg bg-storm-grey-50 p-1.5"
                    >
                      <span class="flex min-w-0 items-center">
                        <Icon name={kindIcon(item.kind)} size={16} alt="" />
                        <span class="truncate px-1.5 text-[14px]">
                          {#if parts.match}
                            <span class="text-storm-grey-400">{parts.before}</span><span
                              class="font-medium text-storm-grey-700">{parts.match}</span
                            ><span class="text-storm-grey-400">{parts.after}</span>
                          {:else}
                            <span class="font-medium text-storm-grey-700">{item.title}</span>
                          {/if}
                        </span>
                      </span>
                      <span class="flex shrink-0 items-center gap-2">
                        {#if item.pr}
                          <RepoPrTag
                            pr={item.pr}
                            status={item.prStatus ?? 'open'}
                            variant="meta"
                            onclick={(e) => openPr(item.pr!, e)}
                          />
                        {/if}
                        <a
                          href="#owner"
                          class="text-[12px] font-light text-storm-grey-600 underline"
                          onclick={(e) => openOwner(item.owner, e)}
                        >
                          {item.owner}
                        </a>
                        <span
                          class="flex h-6 shrink-0 items-center rounded bg-white px-2 text-[12px] font-medium text-storm-grey-400"
                        >
                          Open
                        </span>
                      </span>
                    </span>
                  {:else}
                    <span class="flex min-w-0 items-center">
                      <Icon name={kindIcon(item.kind)} size={16} alt="" />
                      <span class="truncate px-1.5 text-[14px]">
                        {#if parts.match}
                          <span class="text-storm-grey-400">{parts.before}</span><span
                            class="font-medium text-storm-grey-700">{parts.match}</span
                          ><span class="text-storm-grey-400">{parts.after}</span>
                        {:else}
                          <span class="font-medium text-storm-grey-700">{item.title}</span>
                        {/if}
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2 text-[12px] font-light">
                      {#if item.pr}
                        <RepoPrTag
                          pr={item.pr}
                          status={item.prStatus ?? 'open'}
                          variant="meta"
                          onclick={(e) => openPr(item.pr!, e)}
                        />
                      {/if}
                      <a
                        href="#owner"
                        class="text-storm-grey-600 underline"
                        onclick={(e) => openOwner(item.owner, e)}
                      >
                        {item.owner}
                      </a>
                      {#if item.updatedAt != null}
                        <span
                          class="tabular-nums text-storm-grey-400"
                          title={new Date(item.updatedAt).toLocaleString()}
                          >{relativeTime(item.updatedAt)}</span
                        >
                      {/if}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/if}

      {#if !isDrillIn || filtered.length > 0}
        <div
          class="flex h-12 w-full items-center gap-6 rounded-xl bg-white/95 px-3 py-1 text-[12px] font-medium text-storm-grey-400"
          data-node-id="2231:27885"
        >
          <span class="flex items-center gap-2.5">
            Navigate
            <span class="flex items-center gap-1">
              <kbd
                class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                >↑</kbd
              >
              <kbd
                class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                >↓</kbd
              >
            </span>
          </span>
          <span class="flex items-center gap-2.5">
            Select
            <kbd
              class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
              >↵</kbd
            >
          </span>
          <span class="flex items-center gap-2.5">
            Close
            <kbd
              class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
              >Esq</kbd
            >
          </span>
        </div>
      {/if}
    </div>
  </PopupOverlay>
{/if}
