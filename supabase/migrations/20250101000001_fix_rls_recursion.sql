/*
# [Fix] Resolve Infinite Recursion in RLS Policies

This migration fixes a critical database error where Row Level Security (RLS) policies were causing an infinite recursion loop. The `Failed to fetch` errors in the application are a direct symptom of this database issue.

## Query Description:
This script introduces a new, safe helper function `get_my_role_from_auth()` that securely reads the user's role from the `auth.users` table instead of the `public.profiles` table. This breaks the recursion cycle. It then drops all existing (and faulty) policies on the `profiles`, `notes`, and `enrollments` tables and recreates them using this new, safe function. This ensures that data access rules are correctly enforced without causing database errors.

- **Impact on Existing Data:** No data will be lost or modified. This script only changes security rules.
- **Safety:** This change is safe and essential for the application to function correctly. It resolves the critical error that is currently blocking all data access.
- **Reversibility:** The old policies can be restored from previous migration files if necessary, but this is not recommended as they are faulty.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Functions Created:** `public.get_my_role_from_auth()`
- **Policies Dropped & Re-created:** All policies on `public.profiles`, `public.notes`, `public.enrollments`.

## Security Implications:
- RLS Status: Policies are being corrected to properly enforce security as originally intended.
- Policy Changes: Yes. This is the core of the fix.
- Auth Requirements: Policies rely on the user being authenticated via Supabase Auth.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: Positive. Resolves a critical error that was preventing queries from completing.
*/

-- Step 1: Create a safe helper function to get the user's role from auth.users
-- This avoids recursion by not querying the 'profiles' table within a policy on the same table.
create or replace function public.get_my_role_from_auth()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid();
$$;

-- Step 2: Drop all existing policies to ensure a clean slate.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles;';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notes' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.notes;';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.enrollments;';
    END LOOP;
END;
$$;


-- Step 3: Recreate policies for the 'profiles' table using the safe helper function.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own profile, and admins to view all"
ON public.profiles FOR SELECT
USING ((auth.uid() = user_id) OR (get_my_role_from_auth() = 'admin'));

CREATE POLICY "Allow users to update their own profile, and admins to update all"
ON public.profiles FOR UPDATE
USING ((auth.uid() = user_id) OR (get_my_role_from_auth() = 'admin'))
WITH CHECK ((auth.uid() = user_id) OR (get_my_role_from_auth() = 'admin'));


-- Step 4: Recreate policies for the 'notes' table.
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read notes"
ON public.notes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow faculty to create notes"
ON public.notes FOR INSERT
WITH CHECK (get_my_role_from_auth() = 'faculty');

CREATE POLICY "Allow faculty/admins to update notes"
ON public.notes FOR UPDATE
USING (
  (get_my_role_from_auth() = 'admin') OR
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Allow faculty/admins to delete notes"
ON public.notes FOR DELETE
USING (
  (get_my_role_from_auth() = 'admin') OR
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Step 5: Recreate policies for the 'enrollments' table.
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow students to see their enrollments, and admins to see all"
ON public.enrollments FOR SELECT
USING (
  (get_my_role_from_auth() = 'admin') OR
  (student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Allow admins to manage enrollments"
ON public.enrollments FOR ALL
USING (get_my_role_from_auth() = 'admin')
WITH CHECK (get_my_role_from_auth() = 'admin');
