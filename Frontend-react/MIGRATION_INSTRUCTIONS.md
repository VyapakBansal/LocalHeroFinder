# Supabase Migration Instructions

## Quick Method (Recommended)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb/sql/new

### Step 2: Run the Combined Migration
1. Open the file `migrations-combined.sql` in this directory
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

That's it! All migrations will be applied.

---

## Alternative: Using Supabase CLI

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   cd LocalHeroFinder/Frontend-react
   supabase link --project-ref nlhidtzfltbpkhkttzwb
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

---

## Manual Method (If SQL Editor doesn't work)

Run each migration file individually in order:

1. `20251109001154_01e52d07-d7f8-49e0-b090-a1b19578857b.sql`
2. `20251109001545_3a87e23d-6dcd-42fb-bfa8-b806f4948fa0.sql`
3. `20251109002000_create_certifications_storage.sql`
4. `20251109002100_add_user_role_insert_policy.sql`

---

## Verify Migration Success

After running migrations, verify by checking:

1. **Tables created:**
   - `profiles`
   - `user_roles`
   - `responder_profiles`
   - `incidents`

2. **Storage bucket created:**
   - `certifications` bucket should exist in Storage

3. **Functions created:**
   - `has_role()`
   - `update_updated_at_column()`
   - `handle_new_user()`

4. **Triggers created:**
   - `on_auth_user_created`
   - `update_profiles_updated_at`
   - `update_responder_profiles_updated_at`

---

## Troubleshooting

### Error: "relation already exists"
- The table/function already exists. This is okay - the migration uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` where possible.

### Error: "permission denied"
- Make sure you're using the SQL Editor in the Supabase dashboard (it has admin privileges)
- Or use the Service Role Key if running via API

### Error: "type already exists"
- The enum type `app_role` already exists. You can safely ignore this or drop it first:
  ```sql
  DROP TYPE IF EXISTS public.app_role CASCADE;
  ```
  Then re-run the migration.

---

## Project Details

- **Project ID:** `nlhidtzfltbpkhkttzwb`
- **Project URL:** `https://nlhidtzfltbpkhkttzwb.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/nlhidtzfltbpkhkttzwb

