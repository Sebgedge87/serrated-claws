# Serrated Claws ⚔ — Enterprise Upgrade Plan

> From working app to production-ready platform · **12–17 engineering days**

---

## Current State Assessment

### ✅ What's Working Well

| Area | Notes |
|---|---|
| Design system | CSS tokens, dark/light theme, `.btn` `.card` `.pill` `.tab-btn` — enterprise quality |
| Data model (`types.ts`) | Comprehensive, well-typed, covers all domain entities |
| Auth flow | Google OAuth, magic link, password — all working end to end |
| `useLanceData` hook | Clean single source of truth for all DB mutations |
| `usePermissions` | Role-based permission checks in one place |
| PWA | Manifest, service worker, offline caching, safe-area insets |
| Catalogue data | Magic items (2686 lines), rituals, skills — thorough game reference data |
| Modal pattern | Bottom-sheet on mobile, centered on desktop — consistently applied |
| PDF export | jsPDF-based roster/inventory export, parchment themed |

### ❌ What Needs Fixing

| Area | Detail |
|---|---|
| Active bugs | 25 confirmed bugs affecting data display, races, logic, and UX |
| Dead/duplicate code | ~1,000 lines across 9 dead files and 3 duplicate components |
| God component | `Layout.tsx` is 510 lines, passes 8–14 props to every tab |
| URL routing | All tabs are `activeTab` state — nothing is bookmarkable |
| Real-time data | Data is stale until page reload; no Supabase Realtime |
| Security | 2 critical issues: client-side role escalation + cross-lance data leak |
| Tests | Zero test files despite Playwright being installed |

---

## Before / After Metrics

| Metric | Before | After |
|---|---|---|
| Active bugs | **25** | 0 |
| Dead files | **9** | 0 |
| `Layout.tsx` line count | **510** | < 200 |
| Max props per tab component | **14** | 3 |
| XSS vectors | **3** | 0 |
| E2E tests | **0** | 10+ |
| Tabs bookmarkable by URL | **No** | Yes |
| Real-time updates | **No** | Yes |

---

## 🔴 Security — Critical Issues

> These must be fixed before any public or multi-organisation use.

### 1. Client-side role escalation on sign-up
**File:** `src/hooks/useAuth.tsx:83`

`signUpWithPassword` sets `role: 'member'` via a client-side Supabase update. Any user can intercept this request in devtools and set `role: 'admin'` instead.

**Fix:** Move role assignment to a Supabase DB trigger on `auth.users`:
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
Then remove lines 83–85 from `useAuth.tsx`.

### 2. Cross-lance character data leak
**File:** `src/hooks/useLanceData.ts:70–77`

`character_inventory`, `character_skills`, `character_spells`, `character_rituals`, `coven_rituals`, and `bard_works` are fetched with no server-side `lance_id` filter. All records from all lances are returned to every authenticated user and filtered client-side.

**Fix:** Add RLS policies scoped by lance membership:
```sql
create policy "Scoped to lance members"
on public.character_inventory for select
using (
  member_id in (
    select m.id from public.members m
    inner join public.lance_memberships lm on lm.lance_id = m.lance_id
    where lm.profile_id = auth.uid()
  )
);
```
Apply the same to all six affected tables.

---

## Phase 1 — Bug Fixes
**4 days · No schema changes · Ship immediately**

### Logic & Runtime Bugs

| # | Bug | File | Fix |
|---|---|---|---|
| 1 | MemberCard shows coven UUID not name | `MemberCard.tsx:85` | Resolve via `data.covens.find(c => c.id === member.coven)?.name` |
| 2 | MemberLedgerRow shows function UUID not name | `MemberLedgerRow.tsx:71` | Resolve via `data.functions.find(f => f.id === member.function)?.name` |
| 3 | Delete house has no confirmation | `HouseTab.tsx:84` | Wrap in `useConfirm()` — already used in same file for member delete |
| 4 | XSS in BardWorkEditor / BardTab / BardWorksSection | 3 files | Install `dompurify`, create `src/lib/sanitize.ts`, wrap all `dangerouslySetInnerHTML` usages |
| 5 | RosterTab table overflows on mobile | `RosterTab.tsx:121–135` | Apply `hidden sm:grid` / `grid sm:hidden` responsive pattern from HouseTab |
| 6 | Overview "Covens" stat shows wrong count | `OverviewTab.tsx:92` | Change `data.members.filter(m => m.coven).length` to `data.covens.length` |
| 7 | Global search only affects HouseTab | `Layout.tsx:349` | Thread `search` prop into `RosterTab` and other tabs as controlled value |
| 8 | CovensTab ritual filter excludes "Special" realm | `CovensTab.tsx:457` | Change filter to `r.realm === domain \|\| r.realm === 'Special'` |
| 9 | InventoryTab closes modal before awaiting DB write | `InventoryTab.tsx` | Await async prop before calling `onClose()`, add `busy` state to disable save button |
| 10 | BankTab subtitle hardcodes "The Serrated Claws" | `BankTab.tsx:43` | Pass `lanceName` prop from Layout: `lance.settings?.name ?? lances.currentLance?.name` |
| 11 | Business income/status columns are fabricated | `BusinessesTab.tsx:216–221` | Remove placeholder columns — render only real DB fields |
| 12 | AdminTab Events section uses wrong icon | `AdminTab.tsx:181` | Change `Icons.Package` to `Icons.Calendar` |
| 13 | Settings form stays blank if data loads after mount | `AdminTab.tsx:300` | Add `useEffect` watching `settings` prop to reset form state |
| 14 | Auth flash — `loading` false before profile resolves | `useAuth.tsx:29` | Track `sessionResolved` + `profileResolved` separately; keep `loading = true` until both done |
| 15 | BankTab `EditableQty` rapid click race | `BankTab.tsx` | Add `busy` ref, disable buttons during async `onChange`, set in `finally` |
| 16 | `upsertMember` reads stale inventory from closure | `useLanceData.ts:178–193` | Replace closure read with live Supabase query for the specific item |
| 17 | Global `super_admin` profile role bypasses per-lance permission | `Layout.tsx:37` | Tighten `isAdmin` — require per-lance role unless viewing own profile; only `super_admin` in the current lance membership should see AdminTab |
| 18 | Auto-clear attendance fires on every `reload()` including silent ones — races across tabs | `useLanceData.ts:113–121` | Move to a Supabase Edge Function or cron triggered once daily; remove from `reload()` |
| 19 | `deleteBusiness` doesn't delete `business_owners` rows first | `useLanceData.ts:255–259` | Add `await supabase.from('business_owners').delete().eq('business_id', id)` before deleting the business row |
| 20 | `joinLance` / `leaveLance` / `createLance` / `regenerateInviteCode` missing `reloadMemberships` in `useCallback` deps | `useLances.ts:54–89` | Extract `reloadMemberships` to a `useCallback` and add it to each dependent callback's dep array |
| 21 | `AddHouseModal` navigates to client-generated `house.id` before DB confirms PK | `Layout.tsx:469–474` | Await `upsertHouse` return value; use the server-confirmed ID for navigation |
| 22 | `upsertBardWork` uses `onConflict: 'id'` but new records have no `id` — `created_at` not set | `useLanceData.ts:413` | For new records omit the `id` field so the DB generates it; set `created_at` explicitly or ensure DB default exists |

### UX & Display Bugs

| # | Bug | File | Fix |
|---|---|---|---|
| 23 | BardWorksSection (Chronicles) silently absent for admins who aren't bards | `Layout.tsx:360–365` | Always forward `lanceId`, `onUpsertBardWork`, `onDeleteBardWork` to `HouseTab`; gate add/edit actions inside the section by `canAccessBards`, not the section itself |
| 24 | CovensTab delete requires `isAdmin && canManage` — admin who doesn't lead a coven can't delete it | `CovensTab.tsx:198–203` | Show delete button for `isAdmin` unconditionally; `canManage` check is only needed for edit actions |
| 25 | Inventory "Have"/"Need" inputs use `defaultValue` — don't update when data refreshes | `InventoryTab.tsx:344–361` | Change to controlled `value=` with `onChange` handler; hold editable state locally and sync on blur |

**Definition of done:** All 25 fixed, `npm run build` clean, no `dangerouslySetInnerHTML` without DOMPurify, settings form pre-populates, treasury rapid clicks produce correct balance.

---

## Phase 2 — Dead Code Elimination
**1.5 days · Zero risk**

### Files to Delete

| File | Lines | Reason |
|---|---|---|
| `src/components/TabNav.tsx` | 60 | Never imported; Layout renders tabs inline |
| `src/components/auth/LoginScreen.tsx` | 72 | Replaced by `SignIn.tsx` |
| `src/components/tabs/StubTab.tsx` | 21 | Migration leftover, never rendered |
| `src/tabs/RolesTab.tsx` | 147 | Replaced by AdminTab's RolesSection; incompatible types |
| `src/tabs/UnassignedTab.tsx` | 43 | Never wired into Layout |
| `src/lib/icons.tsx` | 164 | Replaced by `src/components/Icons.tsx` |
| `src/tabs/OverviewTab.tsx` | 280 | Duplicate — Layout uses `components/tabs/` version |
| `src/tabs/HouseTab.tsx` | 196 | Duplicate — Layout uses `components/tabs/` version |
| `tailwind.config.js` | ~20 | Duplicate of `tailwind.config.ts` |

**Total removed: ~1,000 lines**

### Dependencies to Remove

```bash
npm uninstall react-router-dom   # installed, never used (reinstalled in Phase 3)
npm uninstall -D playwright       # installed, zero tests (reinstalled in Phase 5)
```

### Duplicate Components to Resolve

| Duplicate | Action |
|---|---|
| `src/components/StatField.tsx` vs `src/components/ui/StatField.tsx` | Migrate `MemberCard.tsx` to `ui/` version, delete root-level one |
| `src/components/ui/Button.tsx` | Either adopt everywhere or delete — no half-adoption |

**Definition of done:** Build clean, bundle size reduced ≥10%, no dead imports.

---

## Phase 3 — Architecture Refactor
**3 days · Highest impact**

### 3.1 Create `LanceContext`

New file: `src/context/LanceContext.tsx`

Moves all `useLanceData` + `usePermissions` results into a React context. Every tab calls `useLanceContext()` instead of receiving 8–14 props from Layout.

```typescript
interface LanceContextValue {
  data: LanceData;
  settings: LanceSettings | null;
  loading: boolean;
  error: string | null;
  lanceId: string;
  isAdmin: boolean;
  perms: Permissions;
  // all mutation methods from useLanceData
  upsertMember: ...; reload: ...; // etc.
}
```

### 3.2 Introduce URL Routing

Reinstall: `npm install react-router-dom`

| Route | Component |
|---|---|
| `/:lanceId/overview` | OverviewTab |
| `/:lanceId/roster` | RosterTab |
| `/:lanceId/house/:houseId` | HouseTab |
| `/:lanceId/covens` | CovensTab |
| `/:lanceId/functions` | FunctionsTab |
| `/:lanceId/businesses` | BusinessesTab |
| `/:lanceId/inventory` | InventoryTab |
| `/:lanceId/treasury` | BankTab |
| `/:lanceId/bards` | BardTab (guarded by `canAccessBards`) |
| `/:lanceId/admin` | AdminTab (guarded by `isAdmin`) |
| `/:lanceId/member/:memberId` | CharacterSheetPage |

`Layout.tsx` becomes a shell (~150 lines) providing header/nav chrome and `<LanceProvider>`. Each tab renders as an `<Outlet>`. Browser back button works. All views are bookmarkable.

### 3.3 Remove `window.location.reload()`

| Location | Fix |
|---|---|
| `Layout.tsx:491` | Replace with `lance.reload()` + `useNavigate()` |
| `App.tsx:27` | Same pattern |
| `UpdatePrompt.tsx:12` | **Leave in place** — intentional PWA service worker update |

### 3.4 Remove Global Search Bar Confusion

The global search in the action bar only wired to HouseTab was causing Bug 7. With routing, each tab owns its own search. Remove the global bar from the action bar entirely.

**Definition of done:** `Layout.tsx` < 200 lines. No tab receives more than 3 props. All tabs bookmarkable. Browser back button works throughout. `window.location.reload()` only in `UpdatePrompt.tsx`.

---

## Phase 4 — Security Hardening
**2 days · Requires Supabase SQL editor access**

See the [Critical Issues](#-security--critical-issues) section above for the full SQL.

### Checklist

- [ ] Create `handle_new_user` DB trigger on `auth.users`
- [ ] Remove client-side role assignment from `useAuth.tsx:83–85`
- [ ] Add RLS select policy to `character_inventory`
- [ ] Add RLS select policy to `character_skills`
- [ ] Add RLS select policy to `character_spells`
- [ ] Add RLS select policy to `character_rituals`
- [ ] Add RLS select policy to `coven_rituals`
- [ ] Add RLS select policy to `bard_works`
- [ ] Fix `business_owners` fetch — add lance-scoped filter
- [ ] Audit all tables — verify RLS enabled, no anon-read policies

**Definition of done:** New users cannot self-assign admin. Character data from other lances returns empty. All tables have RLS enabled.

---

## Phase 5 — Enterprise Features
**4–6 days · Ship sub-features independently**

### 5.1 Supabase Realtime

In `LanceContext`, subscribe to Postgres changes on all lance-scoped tables. On any change, call `reload(true)`:

```typescript
const channel = supabase.channel(`lance:${lanceId}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'members',
    filter: `lance_id=eq.${lanceId}`
  }, () => reload(true))
  // repeat for houses, covens, inventory, events...
  .subscribe();
```

Result: Two admins editing simultaneously see changes within seconds without manual refresh.

### 5.2 Audit Trail

New `audit_log` table:

```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  lance_id text,
  actor_profile_id uuid references auth.users,
  table_name text,
  operation text,
  row_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);
```

DB triggers on `members`, `houses`, `covens`, `events` populate it. AdminTab gets an "Audit Log" sub-section for super_admins.

### 5.3 Missing UI Gaps (no schema changes)

| Gap | File | Fix |
|---|---|---|
| No "Mark all attending" | `AdminTab.tsx` | One Supabase update, add button to EventsSection |
| No "Mark event as cleared" in UI | `AdminTab.tsx` | Add checkbox to EventModal (`cleared` field already in `LanceEvent` type) |
| Tithe not editable from character sheet | `CharacterSheetPage.tsx` | Add inline toggle for `tithe_paid` / `tithe_notes` for admins |
| No assign path in AdminTab UnassignedSection | `AdminTab.tsx` | Add house selection dropdown to UnassignedSection |
| No error feedback on modal save | Multiple modals | Wrap all save handlers in try/catch, display inline error |
| BardTab hides "New Work" silently | `BardTab.tsx:140` | Show explanatory banner when user has no character/bard function |
| Bard access gated on fragile function name string match | `Layout.tsx:39` | Add `is_bard_function` boolean to `functions` table; use that instead of `name.includes('bard')` |
| No resend confirmation email | `SignIn.tsx` | Add "Resend confirmation" link calling `supabase.auth.resend()` |
| "Add Person" / "House" buttons visible on every tab | `Layout.tsx:237–246` | Make action bar buttons contextual — hide or change based on active route |
| HeaderUserMenu lists all tabs on mobile — cluttered with 5+ houses | `HeaderUserMenu.tsx:95–115` | Remove tab list from dropdown; mobile bottom nav already handles this |
| Inventory sub-tabs missing `aria-selected` | `InventoryTab.tsx:134–145` | Add `aria-selected` and `active` class to match top-level tab pattern |
| `CreateCharacterScreen` opened with `lanceId!` non-null assertion | `Layout.tsx:490` | Add null guard before rendering `CreateCharacterScreen`; show loading or redirect if `lanceId` is null |
| "Leave this lance" available even when user is the only admin | `HeaderUserMenu.tsx:167` | Check if user is the sole admin; show warning and require reassigning another admin first |
| `OverviewTab` uses inline `style={}` throughout — bypasses design tokens | `OverviewTab.tsx` | Migrate all inline styles to Tailwind classes and CSS custom properties to match the rest of the app |

### 5.4 Pagination / Virtualisation

- Member grids (RosterTab, HouseTab cards): client-side virtual scroll via `react-virtual`
- Inventory log: increase limit from 50 to 200 + "Load more" button
- No server pagination needed — data already loaded, this is a rendering concern only

### 5.5 Automated Test Suite

Reinstall: `npm install -D @playwright/test`

**Priority E2E tests (10 minimum):**

1. Sign in → see lance data → sign out
2. Create member → appears in roster
3. Increment ring count → treasury total updates correctly
4. RLS smoke: member cannot see other lance's character data
5. PDF export triggers download
6. Admin-only tabs not visible to regular members
7. Delete member — confirmation dialog shown, member removed
8. House tab responsive layout at 375px viewport — no overflow
9. Bard work saves and renders without XSS injection
10. Character sheet opens via row click, closes via back button

**Unit tests (Vitest):** `src/lib/utils.ts`, `src/lib/catalogue.ts`, `sanitizeHtml()` helper.

---

## Recommended Sequencing

```
Week 1    │ Phase 1 — 25 bug fixes (no schema changes, safe to ship)
Week 2    │ Phase 2 — Dead code deletion + component consolidation  
Week 2–3  │ Phase 3 — LanceContext + URL routing (highest impact)
Week 3    │ Phase 4 — Supabase security (coordinate DB access)
Week 4+   │ Phase 5 — Enterprise features, shipped incrementally
```

Each phase ends with a **tagged git release** — any phase is independently rollback-able by reverting to the prior tag.

---

## Success Metrics for "Enterprise Ready"

| Metric | Target |
|---|---|
| Known bugs shipped | 0 |
| `dangerouslySetInnerHTML` without DOMPurify | 0 |
| Dead/duplicate files | 0 |
| Client-side security bypass | 0 |
| Cross-lance data leak | 0 |
| `Layout.tsx` line count | < 200 |
| Max props per tab component | 3 |
| Bundle size vs baseline | ≥ 10% smaller |
| E2E tests passing in CI | ≥ 10 |
| Realtime update latency | < 3 seconds |
| Mobile overflow at 375px viewport | 0 tables clipping |
| All major views bookmarkable by URL | ✅ |
| `window.location.reload()` locations | 1 (UpdatePrompt.tsx only) |

---

*Generated from full codebase audit — June 2026*
