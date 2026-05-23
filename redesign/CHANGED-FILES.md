# What changed — copy these into your repo

Everything below lands inside your existing `src/` folder. **The other files in this zip (`App.tsx`, `Icons.tsx`, `LanceGate.tsx`, `TabNav.tsx`, `MemberCard.tsx`, modals, hooks, `seed.ts`, `types.ts`, `Pill.tsx`, `Button.tsx`) are imported unmodified for context — you can skip them.**

## New files (add these)

| File | Purpose |
|---|---|
| `src/components/HeaderUserMenu.tsx` | Avatar dropdown — Switch Lance / Wiki / Settings / Leave / Sign out |
| `src/components/MemberLedgerRow.tsx` | Compact single-line member row used in the ledger view |

## Modified files (replace these)

| File | What changed |
|---|---|
| `src/components/Layout.tsx` | Header right cluster → primary CTA + `HeaderUserMenu`; tabs get house monograms + colour-coded active state, labels always visible; Delete House removed from global action bar; mobile FAB added |
| `src/components/tabs/HouseTab.tsx` | **Rewritten.** House ribbon up top, ledger/cards view toggle (default ledger, persisted to localStorage), contextual delete in ribbon |
| `src/components/tabs/OverviewTab.tsx` | Treasury card → one canonical rings total with sub-stacks; stats grid → 4 tiles (covens folded into Members sub-stat) |
| `src/components/SignIn.tsx` | Google primary; email/password collapsed; magic-link/signup as sub-toggles |
| `src/components/Modal.tsx` | Bottom-sheet on `<sm`; centred dialog on `≥sm`. Adds `role="dialog"` + `aria-modal` + `aria-labelledby`. |
| `src/index.css` | Adds `.menu-item` utility (used by `HeaderUserMenu`) |
| `src/lib/utils.ts` | Adds `monogramOf(name)` helper for house tabs |

## Removed (delete this file)

| File | Why |
|---|---|
| `src/components/Header.tsx` | Dead code — `Layout.tsx` has its own inline header; this file is never imported. |

---

## Verifying after you paste

```bash
npm run typecheck   # or: tsc --noEmit
npm run dev
```

If you see TypeScript errors, the most likely culprit is the `HouseTab` Props — I kept all the original prop names your `Layout.tsx` was passing (skills/rituals/inventory) so the call site doesn't break, but they're not used inside the new component. Drop them from the interface later if you want a clean signature.

## Acceptance checklist

- [ ] Header has one primary button (My Character / Add Character) and an avatar dropdown — no other actions
- [ ] Tab labels visible at all viewport widths
- [ ] House tabs show a coloured 2-letter monogram; active house tab's underline matches house colour
- [ ] House page leads with a coloured ribbon (sigil · name · motto · counts)
- [ ] Ledger view is default; cards view available via toggle, persists across reload
- [ ] Treasury shows one big total; coin sub-stacks below as pills
- [ ] Stats grid is 4 tiles; "Members" tile shows "N in covens" as a sub-stat
- [ ] Sign-in page leads with Google; email/password hidden behind disclosure
- [ ] Modals slide up from bottom on mobile, centred dialog on desktop
- [ ] FAB plus-button on mobile (admin only)
