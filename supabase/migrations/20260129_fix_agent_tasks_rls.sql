-- Fix RLS policies for socialsync_agent_tasks table
-- Allows authenticated users to create and manage agent tasks

-- Enable RLS if not already enabled
ALTER TABLE socialsync_agent_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "authenticated_users_can_view_tasks" ON socialsync_agent_tasks;
DROP POLICY IF EXISTS "authenticated_users_can_insert_tasks" ON socialsync_agent_tasks;
DROP POLICY IF EXISTS "authenticated_users_can_update_tasks" ON socialsync_agent_tasks;
DROP POLICY IF EXISTS "authenticated_users_can_delete_tasks" ON socialsync_agent_tasks;

-- SELECT: Authenticated users can view all tasks
CREATE POLICY "authenticated_users_can_view_tasks"
ON socialsync_agent_tasks
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Authenticated users can create tasks
CREATE POLICY "authenticated_users_can_insert_tasks"
ON socialsync_agent_tasks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Authenticated users can update tasks
CREATE POLICY "authenticated_users_can_update_tasks"
ON socialsync_agent_tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Authenticated users can delete tasks (optional, for cleanup)
CREATE POLICY "authenticated_users_can_delete_tasks"
ON socialsync_agent_tasks
FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON socialsync_agent_tasks TO authenticated;
