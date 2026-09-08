# Universal Search — Developer Delivery

Shareable handoff package for **Mermaid Universal Search** (⌘K palette).

| | |
|---|---|
| **Figma** | [Universal-search · Search open `4105:10700`](https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700&m=dev) |
| **HTML delivery** | Open [`delivery/index.html`](./delivery/index.html) in a browser (no build) |
| **Product source** | Svelte components under [`src/components/`](./src/components/) |
| **Decisions** | [`docs/DECISIONS.md`](./docs/DECISIONS.md) |
| **Integration** | [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) |

---

## Quick start

```bash
# Option A — static handoff (designers / PMs / reviewers)
open delivery/index.html

# Option B — serve locally (shareable on LAN)
npx --yes serve delivery
```

GitHub Pages (after enabling in repo settings → Pages → Deploy from branch `/docs` or `/delivery`): the raw HTML also works from the repo’s **GitHub Pages** URL once enabled.

---

## What’s in this repo

```
universal-search-delivery/
├── delivery/index.html          ← self-contained delivery slide (share this)
├── assets/screenshots/          ← Figma captures of key states
├── assets/icons/                ← search / github / PR glyphs
├── src/components/              ← DashboardSearch, SearchStatusMessage, RepoPrTag
├── src/search-delivery-page.svelte  ← in-app playground page (SvelteKit)
├── docs/DECISIONS.md            ← why we chose what we chose
├── docs/INTEGRATION.md          ← how to wire into Mermaid AI / dashboard
└── README.md
```

---

## States covered

1. **Empty** — Recent + Quick actions (Create diagram / Flow / Pull GitHub)
2. **Results** — typed query, match highlighting, owner link, Open on focus
3. **PR / Connection drill-in** — `#356` meta chip → filtered list
4. **Owner drill-in** — click owner name → shared files
5. **Team explore** — Dolly / App team / Create team (team space entry)
6. **No results** · **Loading** · **Error** (+ Try again)

Screenshots live in `assets/screenshots/`.

---

## Design tokens (Figma → CSS)

| Token | Value |
|---|---|
| Panel width | `511px` |
| Panel padding / gap | `16px` |
| Panel radius | `24px` |
| Search field height | `48px` |
| Filter chip height | `28px` |
| Result row height | `48px` |
| Footer controls height | `48px` |
| Shadow | `0 24px 48px -8px rgba(36,35,41,0.28)` |
| Close key label | `Esq` (as in Figma — keep until design updates) |

---

## License / visibility

Created for Mermaid Chart design ↔ engineering handoff. Share the GitHub repo link with the implementing team.
