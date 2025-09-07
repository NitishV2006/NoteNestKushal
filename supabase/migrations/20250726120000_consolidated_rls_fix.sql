/*
          # [Consolidated RLS Policy and Function Fix]
          This migration script provides a comprehensive fix for the database's Row Level Security (RLS) policies. It addresses a "function does not exist" error by first creating a necessary helper function and then rebuilding all security policies to use it correctly. This ensures the database is in a consistent and secure state.

          ## Query Description: [This operation will reset and rebuild the security policies for profiles, notes, and enrollments. It creates a helper function to prevent common recursion errors. This is a safe structural change and will not impact existing data. No backup is required, but it's always good practice.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions Created: public.get_my_role()
          - Policies Re-created: All RLS policies on public.profiles, public.notes, public.enrollments.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Policies rely on Supabase JWT authentication.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Negligible performance impact. Improves security rule execution.]
          */

-- Step 1: Create a helper function to safely get the user's role from the JWT.
-- This prevents recursion errors seen in previous attempts.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'user_role', '')::text;
$$;


-- Step 2: Rebuild policies for the 'profiles' table.
-- We drop all old policies first to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to update any profile" ON public.profiles;

CREATE POLICY "Allow authenticated users to view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow admin to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.get_my_role() = 'admin');

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin to update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');


-- Step 3: Rebuild policies for the 'notes' table.
DROP POLICY IF EXISTS "Allow all authenticated users to view notes" ON public.notes;
DROP POLICY IF EXISTS "Allow faculty to create notes" ON public.notes;
DROP POLICY IF EXISTS "Allow faculty to update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Allow faculty to delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Allow admin to manage all notes" ON public.notes;

CREATE POLICY "Allow all authenticated users to view notes"
ON public.notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow faculty to create notes"
ON public.notes FOR INSERT
TO authenticated
WITH CHECK (
  (public.get_my_role() = 'faculty') AND
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Allow faculty to update their own notes"
ON public.notes FOR UPDATE
TO authenticated
USING (
  (public.get_my_role() = 'faculty') AND
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Allow faculty to delete their own notes"
ON public.notes FOR DELETE
TO authenticated
USING (
  (public.get_my_role() = 'faculty') AND
  (uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Allow admin to manage all notes"
ON public.notes FOR ALL
TO authenticated
USING (public.get_my_role() = 'admin');


-- Step 4: Rebuild policies for the 'enrollments' table.
DROP POLICY IF EXISTS "Allow admin to manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow students to view their own enrollments" ON public.enrollments;

CREATE POLICY "Allow admin to manage enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (public.get_my_role() = 'admin');

CREATE POLICY "Allow students to view their own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (
  (public.get_my_role() = 'student') AND
  (student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);
