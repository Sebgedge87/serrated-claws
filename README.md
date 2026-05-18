# ⚔ The Serrated Claws — Lance Manager

Production build of the Serrated Claws lance roster, treasury, and inventory tracker.

**Stack:** Vite · React 18 · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS) · Vercel.

---

## 1. First-time setup

### a. Clone & install
```bash
git clone <your-repo-url> serrated-claws
cd serrated-claws
npm install
```

### b. Create a Supabase project
1. Go to <https://supabase.com> → New project.
2. From **Project Settings → API** copy the **Project URL** and the **anon public** key.
3. Copy `.env.example` to `.env.local` and paste them in:
   ```bash
   cp .env.example .env.local
   ```

### c. Apply the database schema
1. In Supabase → **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.
2. Then paste [`supabase/seed.sql`](./supabase/seed.sql) and run that too (houses, covens, functions, businesses).

Member rows are seeded from the app — see step (g) below.

### d. Configure auth providers

In Supabase → **Authentication → Providers**:

- **Email** — enabled by default. Decide whether you want "Confirm email" on or off (off = faster sign-ins for a private app).
- **Google** — enable, then paste the Client ID + Secret from a Google Cloud OAuth 2.0 credential. The authorised redirect URI you give Google is shown right above those fields (looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).

### e. Run locally
```bash
npm run dev
```
Open <http://localhost:5173>.

### f. Make yourself admin
After signing in for the first time, head back to Supabase → **SQL Editor** and run:
```sql
update public.profiles set role = 'admin' where email = '[email protected]';
```
Sign out and back in. You should now see **Add Person**, **House**, and the inventory edit controls.

### g. Seed the initial roster
Open the browser console on the live app and run:
```js
import('/src/lib/seed.ts').then(({ SEED_MEMBERS }) =>
  import('/src/lib/supabase.ts').then(({ supabase }) =>
    supabase.from('members').insert(SEED_MEMBERS).then(console.log)
  )
);
```
(One-time op. Or wire up a tiny `Admin` page later that does this on a button click.)

---

## 2. Deploy to Vercel

1. Push the repo to GitHub.
2. Vercel → **Add New Project** → select the repo.
3. Framework preset will auto-detect as Vite. Leave the defaults.
4. Add two **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Vercel gives you a `*.vercel.app` URL.

### Production auth redirects

Back in Supabase → **Authentication → URL Configuration**:
- **Site URL** — set to your Vercel URL.
- **Redirect URLs** — add the Vercel URL **and** `http://localhost:5173` so local dev still works.

Update your Google OAuth credential's authorized origins/redirects the same way.

---

## 3. Permission model

Everything is enforced server-side by RLS policies on the Supabase tables. Three roles in `public.profiles.role`:

| Role | Read | Write |
| --- | --- | --- |
| `viewer` (default for new signups) | All tables | Own profile only |
| `member` | All tables | Own profile + own member row (`profiles.member_id` or `members.claimed_by`) |
| `admin` | All tables | All tables |

To **link a player to their character**: set `profiles.member_id` to the matching member's UUID. They can then edit their own stats inline; admins can still edit everyone.

---

## 4. Project layout

```
serrated-claws/
├── supabase/
│   ├── schema.sql            # Tables, types, triggers, RLS policies
│   └── seed.sql              # Houses, covens, functions, businesses
├── src/
│   ├── main.tsx              # Bootstrap
│   ├── App.tsx               # AuthProvider + Gate
│   ├── index.css             # Tailwind + design tokens
│   ├── lib/
│   │   ├── supabase.ts       # Client
│   │   ├── types.ts          # TS types matching DB
│   │   ├── catalogue.ts      # Empire LARP item catalogue
│   │   ├── seed.ts           # Initial roster (one-time)
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.tsx       # Session + profile + role
│   │   └── useLanceData.ts   # Reads + mutations + RLS-aware
│   ├── components/
│   │   ├── Icons.tsx
│   │   ├── Layout.tsx        # Header + tabs + action bar
│   │   ├── SignIn.tsx        # Google + email-password + magic link
│   │   ├── Modal.tsx
│   │   ├── MemberCard.tsx
│   │   ├── StatField.tsx
│   │   └── modals/
│   │       ├── AddHouseModal.tsx
│   │       └── AddPersonModal.tsx
│   └── tabs/
│       ├── OverviewTab.tsx
│       ├── HouseTab.tsx
│       ├── UnassignedTab.tsx
│       ├── CovensTab.tsx
│       ├── FunctionsTab.tsx
│       ├── BusinessesTab.tsx
│       └── InventoryTab.tsx
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 5. Common tasks

**Add a new house** → click "+ House" in the top bar (admin only).
**Add a new player** → click "+ Add Person".
**Move someone to Unassigned** → on their card, the ❓ button.
**Permanently delete** → trash icon (admin only, confirm prompt).
**Adjust inventory** → Inventory tab, edit `Current` or `Required` fields inline; use ± buttons to log a transaction.
**Export roster CSV** → header "Export" button.

---

## 6. Extending

- **Realtime sync** — wrap `useLanceData` with `supabase.channel(...).on('postgres_changes', …)` to push updates from other browsers.
- **Magic Items tracker** — add a `magic_items` table and a new tab; the schema/UI pattern is in `HouseTab` / `BusinessesTab`.
- **Combat encounters** — wire a `combat_log` table + tab; reuse `MemberCard` for participants.
- **Member self-claim** — admin assigns a member to a profile via `profiles.member_id`; the existing RLS policy already grants them edit rights on that row.

---

## 7. Known gaps / next steps

- Magic Items tab — schema spot exists but no UI yet (port from Empire LARP "Named Magic Items" sheet).
- Downtime Planner tab — schema spot reserved.
- Member self-claim flow — admin-only via SQL right now; a proper "Claim character" button would be a nice addition.
- Realtime — currently fetch-on-mount; multi-admin edits need a refresh.

PRs welcome from anyone who joins the lance with a keyboard 🗡
