/*
  # [Fix RLS Infinite Recursion]
  This migration fixes an infinite recursion error in the Row Level Security (RLS) policies.
  The original policies on the 'profiles' table were causing a loop by trying to read from the same table to determine access, leading to application errors.

  ## Query Description:
  This script creates a secure helper function `get_my_role()` to safely retrieve the current user's role. It then replaces the old, faulty RLS policies on the `profiles`, `notes`, and `enrollments` tables with new policies that use this helper function. This change is critical for the application's stability and security. No data will be lost, but this migration must be applied for the app to work.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Creates function: `get_my_role()`
  - Replaces RLS policies on tables: `profiles`, `notes`, `enrollments`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
  - Auth Requirements: Corrects a critical flaw in auth-related RLS policies.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Minimal to positive. The new function is more efficient than recursive subqueries.
*/

-- Step 1: Create a helper function to get the current user's role safely.
-- This function runs with the privileges of the definer, avoiding RLS checks on the profiles table within the function itself.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$;

-- Step 2: Update RLS policies for the 'profiles' table.

-- Users can see their own profile.
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
CREATE POLICY "Allow individual read access" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile.
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
CREATE POLICY "Allow individual update access" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Step 3: Update RLS policies for the 'notes' table using the helper function.

-- Allow read access based on user role.
DROP POLICY IF EXISTS "Allow read access based on role" ON public.notes;
CREATE POLICY "Allow read access based on role" ON public.notes
FOR SELECT USING (
  (public.get_my_role() IN ('faculty', 'admin')) OR
  (public.get_my_role() = 'student' AND subject IN (
    SELECT e.subject FROM public.enrollments e JOIN public.profiles p ON e.student_id = p.id WHERE p.user_id = auth.uid()
  ))
);

-- Allow faculty to manage their own notes.
DROP POLICY IF EXISTS "Allow faculty to manage their own notes" ON public.notes;
CREATE POLICY "Allow faculty to manage their own notes" ON public.notes
FOR ALL USING (
  public.get_my_role() = 'faculty' AND uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
) WITH CHECK (
  public.get_my_role() = 'faculty' AND uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);


-- Step 4: Update RLS policies for the 'enrollments' table using the helper function.

-- Allow users to see their own enrollments, and faculty/admins to see all.
DROP POLICY IF EXISTS "Allow read access to enrollments" ON public.enrollments;
CREATE POLICY "Allow read access to enrollments" ON public.enrollments
FOR SELECT USING (
  (public.get_my_role() IN ('faculty', 'admin')) OR
  (public.get_my_role() = 'student' AND student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);
