# Universal Search — Developer Delivery

Shareable handoff package for **Mermaid Universal Search** (⌘K palette).

This package is the **canonical template** for:

- Cursor skill **`delivery-documentation`** (`~/.cursor/skills/delivery-documentation`)
- Docs chrome skill **`notion-plain-docs`** (`~/.cursor/skills/notion-plain-docs`)

Say “delivery documentation” or “Notion-plain docs” to regenerate packages in this shape.
HTML chrome follows **Notion-plain**; product mocks keep Figma (system wins).

| | |
|---|---|
| **Notion-plain** | [`docs/notion-plain-docs.mdc`](./docs/notion-plain-docs.mdc) · [template](./docs/notion-plain-template.html) |
| **Taste layer** | [`docs/ruben-taste-layer.mdc`](./docs/ruben-taste-layer.mdc) |
| **Figma** | [Universal-search · Search open `4105:10700`](https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700&m=dev) |
| **HTML delivery** | Open [`index.html`](./index.html) (or https://rubenmango.github.io/universal-search-delivery/) |
| **Product source** | Svelte components under [`src/components/`](./src/components/) |
| **Decisions** | [`docs/DECISIONS.md`](./docs/DECISIONS.md) |
| **Integration** | [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) |

---

## Quick start

```bash
# Static handoff (no build)
open index.html
```

Live: https://rubenmango.github.io/universal-search-delivery/

---

## What’s in this repo

```
universal-search-delivery/
├── index.html                   ← Notion-plain delivery slide (share this)
├── assets/screenshots/          ← Figma captures of key states
├── assets/icons/
├── src/components/              ← DashboardSearch, SearchStatusMessage, RepoPrTag
├── docs/
│   ├── DECISIONS.md
│   ├── INTEGRATION.md
│   ├── notion-plain-docs.mdc
│   ├── notion-plain-template.html
│   └── ruben-taste-layer.mdc
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
