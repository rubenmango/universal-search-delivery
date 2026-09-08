<script lang="ts">
  // Universal search status messages — no-results / error / loading.
  // Visual language matches Search open empty copy (storm-400 / 14px body).
  import Icon from '$lib/components/Icon.svelte';

  export type SearchStatusKind = 'no-results' | 'error' | 'loading';

  interface Props {
    kind: SearchStatusKind;
    /** Quoted in no-results copy. */
    query?: string;
    onRetry?: () => void;
  }

  let { kind, query = '', onRetry }: Props = $props();
</script>

{#if kind === 'loading'}
  <div
    class="flex w-full flex-col gap-2"
    data-search-status="loading"
    role="status"
    aria-live="polite"
    aria-label="Loading search results"
  >
    <div class="px-3">
      <p class="text-[12px] leading-[22px] text-storm-grey-400">Results</p>
    </div>
    <div
      class="flex w-full flex-col overflow-hidden rounded-2xl border border-storm-grey-25 bg-storm-grey-25"
    >
      {#each [0, 1, 2] as i (i)}
        <div class="flex h-12 w-full items-center justify-between px-3">
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="size-6 animate-pulse rounded bg-storm-grey-50"></span>
            <span class="h-3.5 w-40 animate-pulse rounded bg-storm-grey-50"></span>
          </span>
          <span class="h-3 w-20 animate-pulse rounded bg-storm-grey-50"></span>
        </div>
      {/each}
    </div>
  </div>
{:else if kind === 'no-results'}
  <div
    class="flex w-full flex-col items-center gap-2 px-3 py-8 text-center"
    data-search-status="no-results"
    role="status"
  >
    <Icon name="search" size={20} alt="" />
    <p class="text-[14px] font-medium tracking-[-0.154px] text-storm-grey-700">
      No results{#if query.trim()} for “{query.trim()}”{/if}
    </p>
    <p class="max-w-[320px] text-[12px] leading-[18px] tracking-[-0.132px] text-storm-grey-400">
      Try another name, owner, or switch filters.
    </p>
  </div>
{:else}
  <div
    class="flex w-full flex-col items-center gap-3 px-3 py-8 text-center"
    data-search-status="error"
    role="alert"
  >
    <Icon name="info" size={20} alt="" />
    <div class="flex flex-col gap-2">
      <p class="text-[14px] font-medium tracking-[-0.154px] text-storm-grey-700">
        Something went wrong
      </p>
      <p class="max-w-[320px] text-[12px] leading-[18px] tracking-[-0.132px] text-storm-grey-400">
        We couldn’t load search results. Check your connection and try again.
      </p>
    </div>
    {#if onRetry}
      <button
        type="button"
        class="flex h-8 items-center rounded-lg border border-storm-grey-100 bg-white px-3 text-[12px] font-medium text-storm-grey-700 transition-colors hover:bg-storm-grey-25"
        onclick={onRetry}
      >
        Try again
      </button>
    {/if}
  </div>
{/if}
