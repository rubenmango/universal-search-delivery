# Integration guide

How to land Universal Search in the Mermaid AI / dashboard codebase.

## Components to copy

From this package → product `src/lib/components/`:

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
  entity?: 'person' | 'team'; // Person / Teams filters
};
```

## Acceptance checklist

- [ ] Empty query shows **Recent** + **Quick actions**
- [ ] Filters: All · Diagrams · Flows · Documents · Person · Teams
- [ ] Typed query: match bold, owner underline → drill-in, focused row shows **Open**
- [ ] Footer: Navigate / Select / Close (**Esq**)
- [ ] `#PR` meta chip → PR drill-in
- [ ] Loading / no-results / error (+ retry) behave as in `delivery/index.html`
- [ ] Dashboard cards still use status (green/purple) PR chip

## Figma

https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700&m=dev
