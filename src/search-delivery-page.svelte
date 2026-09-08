<script lang="ts">
  // Developer delivery — Universal search (Figma Universal-search / 4105:10700).
  // Static frames for every state + spacing tokens. Not part of the product nav.
  import { base } from '$app/paths';
  import Icon from '$lib/components/Icon.svelte';
  import SearchStatusMessage from '$lib/components/SearchStatusMessage.svelte';
  import DashboardSearch, {
    type SearchResult,
  } from '$lib/components/DashboardSearch.svelte';

  const now = Date.now();
  const demoResults: SearchResult[] = [
    {
      id: 'd1',
      title: 'Team process 2026',
      kind: 'diagram',
      fileType: 'Diagram',
      owner: 'Martin',
      updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'd2',
      title: 'Process David proposal',
      kind: 'diagram',
      fileType: 'Diagram',
      owner: 'David',
      updatedAt: now - 14 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'd3',
      title: 'Process draft website architecture',
      kind: 'flow',
      fileType: 'Flow',
      owner: 'Martin',
      updatedAt: now - 26 * 24 * 60 * 60 * 1000,
      entity: 'person',
    },
    {
      id: 'pr1',
      title: 'pr-review-architecture',
      kind: 'diagram',
      fileType: 'Diagram',
      owner: 'rubenmango',
      updatedAt: now - 11 * 60 * 1000,
      pr: '356',
      prStatus: 'open',
      entity: 'person',
    },
  ];

  type LiveDemo = 'results' | 'empty' | 'no-results' | 'error' | 'loading' | 'team';
  let liveDemo = $state<LiveDemo>('results');
  let liveOpen = $state(false);

  let liveResults = $derived(
    liveDemo === 'no-results' ? ([] as SearchResult[]) : demoResults,
  );
  let liveLoad = $derived(
    liveDemo === 'error' ? ('error' as const) : liveDemo === 'loading' ? ('loading' as const) : ('idle' as const),
  );
  let liveEmptyMode = $derived(liveDemo === 'team' ? ('team' as const) : ('default' as const));

  let liveSeed = $derived(
    liveDemo === 'no-results' || liveDemo === 'results' || liveDemo === 'loading' || liveDemo === 'error'
      ? 'Process team'
      : '',
  );

  const filters = ['All', 'Diagrams', 'Flows', 'Documents', 'Person', 'Teams'] as const;
</script>

<svelte:head>
  <title>Universal search — developer delivery</title>
</svelte:head>

<div class="min-h-screen bg-storm-grey-25 text-storm-grey-800">
  <header
    class="sticky top-0 z-10 flex items-center justify-between border-b border-storm-grey-50 bg-white px-6 py-4"
  >
    <div class="flex flex-col gap-1">
      <p class="text-[12px] font-medium uppercase tracking-wide text-storm-grey-400">
        Developer delivery
      </p>
      <h1 class="text-[20px] font-semibold tracking-[-0.2px] text-deep-purple-800">
        Universal search
      </h1>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="{base}/dashboard"
        class="rounded-lg border border-storm-grey-100 px-3 py-2 text-[12px] font-medium text-storm-grey-600 hover:bg-storm-grey-25"
      >
        Open dashboard
      </a>
      <a
        href="https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700"
        target="_blank"
        rel="noreferrer"
        class="rounded-lg bg-deep-purple-800 px-3 py-2 text-[12px] font-medium text-white"
      >
        Figma 4105:10700
      </a>
    </div>
  </header>

  <main class="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 py-8">
    <!-- Spec -->
    <section class="flex flex-col gap-4 rounded-2xl border border-storm-grey-50 bg-white p-6">
      <h2 class="text-[16px] font-semibold text-deep-purple-800">Spacing &amp; structure</h2>
      <ul class="grid gap-2 text-[13px] leading-5 text-storm-grey-600 md:grid-cols-2">
        <li>Panel: width 511 · padding 16 · gap 16 · radius 24 · border storm-50 · shadow XL</li>
        <li>Search field: height 48 · radius 16 · px 12 · border storm-100 · bg storm-25</li>
        <li>Filters: height 28 · gap 4 · active border storm-100 · text 12 / lh 22</li>
        <li>Result row: height 48 · px 12 · active inset px 6 + p 6 + Open chip</li>
        <li>Section title: 12 / lh 22 · storm-400 · gap 8 to list</li>
        <li>Footer controls: height 48 · gap 24 · key chips h 24 radius 4</li>
        <li>Typed query shows ↵ ; empty shows ⌘K · Close label uses “Esq” (Figma)</li>
        <li>Filters: All · Diagrams · Flows · Documents · Person · Teams</li>
      </ul>
      <p class="text-[12px] text-storm-grey-400">
        Note: Figma has no dedicated error frame — no-results / error / loading follow the same
        storm typography as empty drill-in copy so engineering has explicit message states.
      </p>
    </section>

    <!-- Live playground -->
    <section class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-[16px] font-semibold text-deep-purple-800">Live playground</h2>
        <div class="flex flex-wrap gap-2">
          {#each [
            ['results', 'Results'],
            ['empty', 'Empty + Quick actions'],
            ['no-results', 'No results'],
            ['loading', 'Loading'],
            ['error', 'Error'],
            ['team', 'Team explore'],
          ] as [id, label] (id)}
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-[12px] font-medium {liveDemo === id
                ? 'border-deep-purple-800 bg-deep-purple-800 text-white'
                : 'border-storm-grey-100 text-storm-grey-600 hover:bg-white'}"
              onclick={() => {
                liveDemo = id as LiveDemo;
                liveOpen = true;
              }}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>
      <div
        class="relative flex min-h-[120px] items-start justify-center rounded-2xl border border-dashed border-storm-grey-100 bg-white p-8"
      >
        <div class="w-60">
          <DashboardSearch
            bind:open={liveOpen}
            results={liveResults}
            loadState={liveLoad}
            emptyMode={liveEmptyMode}
            seedQuery={liveSeed}
            teamSpaceLabel="General"
            onRetrySearch={() => {
              liveDemo = 'results';
            }}
          />
        </div>
        <p class="absolute bottom-3 text-[11px] text-storm-grey-400">
          Pick a state above — palette opens over this page (⌘K also works).
        </p>
      </div>
    </section>

    <!-- Static frames -->
    <section class="flex flex-col gap-6">
      <h2 class="text-[16px] font-semibold text-deep-purple-800">Static frames</h2>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Empty + Quick actions -->
        <article class="flex flex-col gap-3 lg:col-span-2">
          <h3 class="text-[13px] font-medium text-storm-grey-600">
            Empty · Recent + Quick actions ·
            <span class="font-normal text-storm-grey-400">2233:35142</span>
          </h3>
          <div
            class="flex w-full max-w-[511px] flex-col gap-4 rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
          >
            <div
              class="flex h-12 items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3"
            >
              <span class="flex items-center">
                <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
                <span class="px-1.5 text-[14px] text-storm-grey-400">What are you looking for</span>
              </span>
              <span
                class="flex h-6 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                >⌘K</span
              >
            </div>
            <div class="flex gap-1">
              {#each filters as f, i (f)}
                <span
                  class="flex h-7 items-center rounded-[7px] px-3 text-[12px] leading-[22px] {i === 0
                    ? 'border border-storm-grey-100 bg-white text-black'
                    : 'text-storm-grey-400'}">{f}</span
                >
              {/each}
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-[12px] leading-[22px] text-storm-grey-400">Recent</p>
              <div
                class="flex flex-col overflow-hidden rounded-2xl border border-storm-grey-50 bg-storm-grey-25"
              >
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <Icon name="account_tree" size={16} alt="" />
                    <span class="px-1.5 text-[14px]"
                      ><span class="font-medium text-storm-grey-700">Team process</span
                      ><span class="text-storm-grey-400"> 2026</span></span
                    >
                  </span>
                  <span class="flex gap-2 text-[12px] font-light">
                    <span class="text-storm-grey-600 underline">Martin</span>
                    <span class="text-storm-grey-400">Edited 1d</span>
                  </span>
                </div>
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <Icon name="account_tree" size={16} alt="" />
                    <span class="px-1.5 text-[14px]"
                      ><span class="font-medium text-storm-grey-700">Team process</span
                      ><span class="text-storm-grey-400"> 2026</span></span
                    >
                  </span>
                  <span class="flex gap-2 text-[12px] font-light">
                    <span class="text-storm-grey-600 underline">Martin</span>
                    <span class="text-storm-grey-400">Edited 1d</span>
                  </span>
                </div>
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
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
                    class="flex h-6 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                    >Connection</span
                  >
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-[12px] leading-[22px] text-storm-grey-400">Quick actions</p>
              <div class="flex flex-col overflow-hidden rounded-2xl border border-storm-grey-50">
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <span
                      class="flex shrink-0 items-start rounded-lg bg-deep-purple-50 p-1 text-deep-purple-800"
                    >
                      <Icon name="account_tree" size={16} alt="" />
                    </span>
                    <span class="px-1.5 text-[14px] font-medium text-storm-grey-700"
                      >Create new diagram</span
                    >
                  </span>
                  <span
                    class="flex h-6 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                    >Create</span
                  >
                </div>
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <span
                      class="flex w-7 shrink-0 items-start rounded-lg bg-deep-purple-50 p-1 text-deep-purple-800"
                    >
                      <Icon name="note_stack" size={16} alt="" />
                    </span>
                    <span class="px-1.5 text-[14px] text-storm-grey-700"
                      ><span class="font-medium">Create</span>
                      <span class="font-normal"> new Flow</span></span
                    >
                  </span>
                  <span
                    class="flex h-6 items-center rounded border border-[#b20e45] bg-[#fedfed] px-2 text-[12px] font-medium text-[#991824]"
                    >New</span
                  >
                </div>
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <span class="flex w-7 shrink-0 items-start rounded-lg bg-deep-purple-50 p-1">
                      <span
                        class="inline-flex h-5 w-full bg-deep-purple-800"
                        style="mask: url('{base}/icons/github.svg') center / contain no-repeat; -webkit-mask: url('{base}/icons/github.svg') center / contain no-repeat;"
                      ></span>
                    </span>
                    <span class="px-1.5 text-[14px] font-medium text-storm-grey-700"
                      >Pull GitHub diagrams</span
                    >
                  </span>
                  <span
                    class="flex h-6 items-center rounded border border-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                    >Connection</span
                  >
                </div>
              </div>
            </div>

            <div
              class="flex h-12 items-center gap-6 rounded-xl px-3 text-[12px] font-medium text-storm-grey-400"
            >
              <span class="flex items-center gap-2.5"
                >Navigate
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↑</kbd
                >
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↓</kbd
                ></span
              >
              <span class="flex items-center gap-2.5"
                >Select
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↵</kbd
                ></span
              >
              <span class="flex items-center gap-2.5"
                >Close
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >Esq</kbd
                ></span
              >
            </div>
          </div>
        </article>

        <!-- Results -->
        <article class="flex flex-col gap-3">
          <h3 class="text-[13px] font-medium text-storm-grey-600">
            Results · <span class="font-normal text-storm-grey-400">4105:10700</span>
          </h3>
          <div
            class="flex w-full max-w-[511px] flex-col gap-4 rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
          >
            <div
              class="flex h-12 items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3"
            >
              <span class="flex items-center">
                <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
                <span class="px-1.5 text-[14px] text-storm-grey-800">Process team</span>
              </span>
              <span
                class="flex h-6 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                >↵</span
              >
            </div>
            <div class="flex gap-1">
              {#each filters as f, i (f)}
                <span
                  class="flex h-7 items-center rounded-[7px] px-3 text-[12px] leading-[22px] {i === 0
                    ? 'border border-storm-grey-100 bg-white text-black'
                    : 'text-storm-grey-400'}">{f}</span
                >
              {/each}
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-[12px] leading-[22px] text-storm-grey-400">Results</p>
              <div
                class="flex flex-col overflow-hidden rounded-2xl border border-storm-grey-25 bg-storm-grey-25"
              >
                <div class="flex h-12 items-center justify-between px-3">
                  <span class="flex items-center">
                    <Icon name="account_tree" size={16} alt="" />
                    <span class="px-1.5 text-[14px]"
                      ><span class="font-medium text-storm-grey-700">Team process</span
                      ><span class="text-storm-grey-400"> 2026</span></span
                    >
                  </span>
                  <span class="flex gap-2 text-[12px] font-light">
                    <span class="text-storm-grey-600 underline">Martin</span>
                    <span class="text-storm-grey-400">Edited 1d</span>
                  </span>
                </div>
                <div class="flex h-12 items-center justify-between px-1.5">
                  <span
                    class="flex flex-1 items-center justify-between rounded-lg bg-storm-grey-50 p-1.5"
                  >
                    <span class="flex items-center">
                      <Icon name="account_tree" size={16} alt="" />
                      <span class="px-1.5 text-[14px]"
                        ><span class="font-medium text-storm-grey-700">Process</span
                        ><span class="text-storm-grey-400"> draft website architecture</span></span
                      >
                    </span>
                    <span
                      class="flex h-6 items-center rounded bg-white px-2 text-[12px] font-medium text-storm-grey-400"
                      >Open</span
                    >
                  </span>
                </div>
              </div>
            </div>
            <div
              class="flex h-12 items-center gap-6 rounded-xl px-3 text-[12px] font-medium text-storm-grey-400"
            >
              <span class="flex items-center gap-2.5"
                >Navigate
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↑</kbd
                >
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↓</kbd
                ></span
              >
              <span class="flex items-center gap-2.5"
                >Select
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >↵</kbd
                ></span
              >
              <span class="flex items-center gap-2.5"
                >Close
                <kbd
                  class="flex h-6 items-center rounded border border-storm-grey-50 bg-storm-grey-25 px-2"
                  >Esq</kbd
                ></span
              >
            </div>
          </div>
        </article>

        <!-- No results -->
        <article class="flex flex-col gap-3">
          <h3 class="text-[13px] font-medium text-storm-grey-600">No results</h3>
          <div
            class="flex w-full max-w-[511px] flex-col gap-4 rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
          >
            <div
              class="flex h-12 items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3"
            >
              <span class="flex items-center">
                <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
                <span class="px-1.5 text-[14px] text-storm-grey-800">zzzz not found</span>
              </span>
              <span
                class="flex h-6 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                >↵</span
              >
            </div>
            <div class="flex gap-1">
              {#each filters as f, i (f)}
                <span
                  class="flex h-7 items-center rounded-[7px] px-3 text-[12px] leading-[22px] {i === 0
                    ? 'border border-storm-grey-100 bg-white text-black'
                    : 'text-storm-grey-400'}">{f}</span
                >
              {/each}
            </div>
            <SearchStatusMessage kind="no-results" query="zzzz not found" />
            <div
              class="flex h-12 items-center gap-6 rounded-xl px-3 text-[12px] font-medium text-storm-grey-400"
            >
              <span>Navigate ↑ ↓</span>
              <span>Select ↵</span>
              <span>Close Esq</span>
            </div>
          </div>
        </article>

        <!-- Error -->
        <article class="flex flex-col gap-3">
          <h3 class="text-[13px] font-medium text-storm-grey-600">Error</h3>
          <div
            class="flex w-full max-w-[511px] flex-col gap-4 rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
          >
            <div
              class="flex h-12 items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3"
            >
              <span class="flex items-center">
                <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
                <span class="px-1.5 text-[14px] text-storm-grey-800">Process team</span>
              </span>
              <span
                class="flex h-6 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                >↵</span
              >
            </div>
            <div class="flex gap-1">
              {#each filters as f, i (f)}
                <span
                  class="flex h-7 items-center rounded-[7px] px-3 text-[12px] leading-[22px] {i === 0
                    ? 'border border-storm-grey-100 bg-white text-black'
                    : 'text-storm-grey-400'}">{f}</span
                >
              {/each}
            </div>
            <SearchStatusMessage kind="error" onRetry={() => {}} />
            <div
              class="flex h-12 items-center gap-6 rounded-xl px-3 text-[12px] font-medium text-storm-grey-400"
            >
              <span>Navigate ↑ ↓</span>
              <span>Select ↵</span>
              <span>Close Esq</span>
            </div>
          </div>
        </article>

        <!-- Loading -->
        <article class="flex flex-col gap-3">
          <h3 class="text-[13px] font-medium text-storm-grey-600">Loading</h3>
          <div
            class="flex w-full max-w-[511px] flex-col gap-4 rounded-[24px] border border-storm-grey-50 bg-white p-4 shadow-[0_24px_48px_-8px_rgba(36,35,41,0.28)]"
          >
            <div
              class="flex h-12 items-center justify-between rounded-2xl border border-storm-grey-100 bg-storm-grey-25 px-3"
            >
              <span class="flex items-center">
                <img src="{base}/icons/search.svg" alt="" width="16" height="16" class="size-4" />
                <span class="px-1.5 text-[14px] text-storm-grey-800">Process team</span>
              </span>
              <span
                class="flex h-6 items-center rounded-lg bg-storm-grey-50 px-2 text-[12px] font-medium text-storm-grey-400"
                >↵</span
              >
            </div>
            <div class="flex gap-1">
              {#each filters as f, i (f)}
                <span
                  class="flex h-7 items-center rounded-[7px] px-3 text-[12px] leading-[22px] {i === 0
                    ? 'border border-storm-grey-100 bg-white text-black'
                    : 'text-storm-grey-400'}">{f}</span
                >
              {/each}
            </div>
            <SearchStatusMessage kind="loading" />
            <div
              class="flex h-12 items-center gap-6 rounded-xl px-3 text-[12px] font-medium text-storm-grey-400"
            >
              <span>Navigate ↑ ↓</span>
              <span>Select ↵</span>
              <span>Close Esq</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-2xl border border-storm-grey-50 bg-white p-6 text-[13px] text-storm-grey-600">
      <h2 class="mb-2 text-[16px] font-semibold text-deep-purple-800">Engineering notes</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>
          Interactive shell: <code class="text-storm-grey-800">DashboardSearch.svelte</code>
        </li>
        <li>
          Status messages: <code class="text-storm-grey-800">SearchStatusMessage.svelte</code>
          (`no-results` · `error` · `loading`)
        </li>
        <li>
          Prop <code class="text-storm-grey-800">loadState</code> drives loading/error; empty typed
          query with zero hits uses no-results.
        </li>
        <li>Owner name + PR meta chips drill into filtered lists (same as product).</li>
        <li>Wire real search API later: set <code>loadState</code> while fetching; map errors to
          <code>error</code>.</li>
      </ul>
    </section>
  </main>
</div>
