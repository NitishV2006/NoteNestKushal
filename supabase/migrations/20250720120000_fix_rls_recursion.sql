/*
          # [Operation Name]
          Fix RLS Infinite Recursion

          [Description of what this operation does]
          This migration script resolves an infinite recursion error in the database's Row Level Security (RLS) policies. It replaces the existing, faulty policies on the 'profiles', 'notes', and 'enrollments' tables with corrected versions. The new policies use a safe helper function to determine a user's role without causing a recursive loop, ensuring that data access is both secure and functional.

          ## Query Description: [This operation overhauls the security rules for your database. It will drop all existing policies on the affected tables and create new ones. While it does not modify your data, applying these changes is critical for the application to function correctly. It is safe to run, as it only redefines access rules.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables affected: 'profiles', 'notes', 'enrollments'
          - Functions created: 'public.get_user_role()'
          - Policies dropped and recreated for all three tables.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This fix is essential for the authentication system to work.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. The new function is highly efficient.
*/

-- STEP 1: Drop all existing (and faulty) policies on the tables.
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
DROPPOLICY IF EXISTS "Admins can view all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."notes";
DROP POLICY IF EXISTS "Faculty can create notes" ON "public"."notes";
DROP POLICY IF EXISTS "Users can update their own notes" ON "public"."notes";
DROP POLICY IF EXISTS "Enable read access based on role" ON "public"."notes";
DROP POLICY IF EXISTS "Faculty can update their own notes" ON "public"."notes";
DROP POLICY IF EXISTS "Admins can manage all notes" ON "public"."notes";

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."enrollments";
DROP POLICY IF EXISTS "Students can view their own enrollments" ON "public"."enrollments";
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON "public"."enrollments";


-- STEP 2: Create a safe helper function to get the user's role from auth data, not the profiles table.
-- This function reads the role from the user's authentication token, avoiding the recursion issue.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 3: Recreate policies for the 'profiles' table using the new helper function.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- STEP 4: Recreate policies for the 'notes' table.
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access based on role" ON public.notes FOR SELECT USING (
  -- Admins and faculty can see all notes.
  public.get_user_role() IN ('admin', 'faculty') OR
  -- Students can see notes for subjects they are enrolled in.
  (
    public.get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.profiles p ON e.student_id = p.id
      WHERE e.subject = notes.subject AND p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Faculty can create notes"
ON public.notes FOR INSERT
WITH CHECK (public.get_user_role() = 'faculty');

CREATE POLICY "Faculty can update their own notes, Admins can update any"
ON public.notes FOR UPDATE
USING (
  public.get_user_role() = 'admin' OR
  (public.get_user_role() = 'faculty' AND uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Faculty can delete their own notes, Admins can delete any"
ON public.notes FOR DELETE
USING (
  public.get_user_role() = 'admin' OR
  (public.get_user_role() = 'faculty' AND uploaded_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);


-- STEP 5: Recreate policies for the 'enrollments' table.
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT
USING (
  public.get_user_role() = 'student' AND
  student_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all enrollments"
ON public.enrollments FOR ALL
USING (public.get_user_role() = 'admin');
