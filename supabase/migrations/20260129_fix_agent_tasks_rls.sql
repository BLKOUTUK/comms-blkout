-- Fix RLS policies for socialsync_agent_tasks table
-- Root cause: App uses AUTH_DISABLED=true with mock user, so Supabase client
-- operates as 'anon' role, not 'authenticated'. Policies only targeted 'authenticated'.
-- Fix: Allow both anon and authenticated roles since this is an internal admin tool.

-- Drop ALL existing policies to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'socialsync_agent_tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON socialsync_agent_tasks', pol.policyname);
  END LOOP;
END $$;

-- SELECT: Both anon and authenticated can view tasks
CREATE POLICY "allow_all_select_tasks"
ON socialsync_agent_tasks
FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Both anon and authenticated can create tasks
CREATE POLICY "allow_all_insert_tasks"
ON socialsync_agent_tasks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: Both anon and authenticated can update tasks
CREATE POLICY "allow_all_update_tasks"
ON socialsync_agent_tasks
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Both anon and authenticated can delete tasks
CREATE POLICY "allow_all_delete_tasks"
ON socialsync_agent_tasks
FOR DELETE
TO anon, authenticated
USING (true);

-- Grant permissions to both roles
GRANT SELECT, INSERT, UPDATE, DELETE ON socialsync_agent_tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON socialsync_agent_tasks TO authenticated;
