# Decisions — Universal Search

Record of product / design / engineering choices made while implementing
[Figma Universal-search](https://www.figma.com/design/4K8bilK5sR6uguD8hLbHf7/Universal-search?node-id=4105-10700&m=dev)
into the Mermaid unified editor prototype.

---

## 1. Source of truth

| Decision | Choice | Why |
|---|---|---|
| Primary frame | `Search open` · **Default** · node `4105:10700` | User-selected delivery node |
| Empty reference | Property 1=Variant4 · `2233:35142` | Shows **Recent + Quick actions** |
| Connection empty | Property 1=connection and quick actions · `2238:37862` | Rewind-style + Connection row |
| PR drill-in | Property 1=git instance · `4034:21258` | `#356 [Repo]` header + Shared badge |

The Figma **Search open** component set does **not** include dedicated
no-results / error / loading variants. Those were designed in code using the
same storm-grey typography and panel chrome so engineering has explicit states.

---

## 2. Layout & spacing

| Spec | Value | Notes |
|---|---|---|
| Panel | 511 × auto, `p-16`, `gap-16`, `radius-24` | Was 501 / `p-12` / `gap-17` before alignment |
| Search field | `h-48`, `radius-16`, border storm-100 | Placeholder: “What are you looking for” |
| Affordance | Empty → `⌘K` · Typed → `↵` | Matches Default vs empty variants |
| Filters | All · Diagrams · Flows · Documents · Person · Teams | Full set from Variant4+ (Default node only shows 4) |
| Result row | `h-48`; active = inset `px-6` + inner `p-6` + **Open** | |
| Footer | Navigate ↑↓ · Select ↵ · Close **Esq** | Keep Figma spelling until design renames to Esc |

---

## 3. Interaction model

| Surface | Behavior |
|---|---|
| Owner name (underlined) | Opens owner drill-in (Shared badge); does not open the file |
| Entire result row | Opens the diagram / runs the action |
| PR chip (`#356`) | Connection-style meta chip in search; opens PR drill-in listing all diagrams for that number |
| Team space nav | Opens palette in `emptyMode=team` (explore Dolly / App team / Create team) |
| Team explore rows | Same as owner link → owner/team profile view |
| Dashboard GitHub cards | Keep green/purple **status** `RepoPrTag` (icon; `#` on hover) — search uses **meta** variant |

---

## 4. Naming

| Was | Now | Why |
|---|---|---|
| Rewind | **Recent** | Matches Universal-search Figma copy |
| Esc (footer) | **Esq** | Literal Figma label for parity with screenshots |
| Green PR pill in search | Neutral **Connection** chip | User request — match Connection badge |

---

## 5. Status messages (not in Figma)

| State | UI | Trigger |
|---|---|---|
| `loading` | 3 skeleton rows under “Results” | `loadState="loading"` |
| `no-results` | Centered message + query echo | Typed query, `filtered.length === 0` |
| `error` | Message + **Try again** | `loadState="error"` + `onRetrySearch` |

Wire real search APIs by flipping `loadState` during fetch; map failures to `error`.

---

## 6. Code Connect

Attempted Code Connect mappings for Search open → `DashboardSearch.svelte`.
Figma returned **Published component not found** — library components are not
published. Delivery proceeds from design context + screenshots instead.

---

## 7. Delivery package

Separate GitHub repo (`universal-search-delivery`) so designers / eng can share
a **static HTML slide** + decisions + screenshots + component source without
cloning the full unified-editor prototype.

| Decision | Choice | Why |
|---|---|---|
| Docs chrome | **Notion-plain** (`docs/notion-plain-docs.mdc`) | One family across all published docs/reports |
| Judgement | Taste layer (`docs/ruben-taste-layer.mdc`) | Roads not taken · one primary · system wins |
| Product mocks | Figma elevation / radius / storm tokens | System wins — chrome stays flat; panels stay Figma |
