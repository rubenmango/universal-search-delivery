# Integration guide — Universal Search

This **public** Pages package is handoff only (slide · screenshots · live palette ·
password gate). **Product source is private.**

## Where the code lives

| | |
|---|---|
| **Private Mermaid repo** | [`Mermaid-Chart/app-team`](https://github.com/Mermaid-Chart/app-team) (org access required) |
| **Canonical `src/`** | [`handoffs/universal-search/src/`](https://github.com/Mermaid-Chart/app-team/tree/main/handoffs/universal-search/src) |
| **This package** | Visual delivery only — https://rubenmango.github.io/universal-search-delivery/ |

```bash
git clone git@github.com:Mermaid-Chart/app-team.git
cd app-team/handoffs/universal-search
```

## Components to copy

From the private handoff → product `src/lib/components/`:

| File | Role |
|---|---|
| `DashboardSearch.svelte` | ⌘K trigger + palette (empty, results, drill-ins, statuses) |
| `SearchStatusMessage.svelte` | no-results / error / loading |
| `RepoPrTag.svelte` | `variant="status"` (cards) · `variant="meta"` (search) |

Dependencies already expected in the product app:

- `Icon.svelte`, `PopupOverlay.svelte`
- `$app/paths` `base`
- Design tokens: `storm-grey-*`, `deep-purple-*`, radius / spacing utilities

## Wire-up (dashboard)

```svelte
<script lang="ts">
  import DashboardSearch from '$lib/components/DashboardSearch.svelte';

  let searchOpen = $state(false);
  let loadState = $state<'idle' | 'loading' | 'error'>('idle');
</script>

<DashboardSearch
  bind:open={searchOpen}
  results={searchResults}
  loadState={loadState}
  emptyMode={activeSection === 'team' ? 'team' : 'default'}
  teamSpaceLabel={activeTeamSpace?.label ?? 'Team'}
  onOpenResult={handleSearchOpen}
  onCreateDiagram={() => openEditor(true)}
  onCreateFlow={() => openEditor(true)}
  onPullGithub={openConnectRepo}
  onCreateTeam={() => handleAction('team')}
  onRetrySearch={refetchSearch}
/>
```

### Opening from team space

```ts
function openTeamSpace(id: string) {
  activeSection = 'team';
  activeTeamSpaceId = id;
  searchOpen = true; // emptyMode=team → explore list
}
```

### Result shape

```ts
type SearchResult = {
  id: string;
  title: string;
  kind: 'diagram' | 'flow' | 'document';
  fileType: string;
  owner: string;
  updatedAt?: number;
  pr?: string;
  prStatus?: 'open' | 'merged';
  entity?: 'person' | 'team';
};
```

## Acceptance checklist

- [ ] Empty query shows **Recent** + **Quick actions**
- [ ] Filters: All · Diagrams · Flows · Documents · Person · Teams
- [ ] Typed query: match bold, owner underline → drill-in, focused row shows **Open**
- [ ] Footer: Navigate / Select / Close (**Esq**)
- [ ] `#PR` meta chip → PR drill-in
- [ ] Loading / no-results / error (+ retry) behave as in the live slide
- [ ] Dashboard cards still use status (green/purple) PR chip

## Figma

https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700&m=dev
