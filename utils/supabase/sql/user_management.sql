-- Ensure UUID extension is enabled in the database (often enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: We are NOT adding a foreign key constraint from public.users to auth.users
-- to follow Supabase's recommendation against direct references to auth schema.
-- Deletion will be handled by a trigger.

-- 1. Create OR REPLACE trigger function to insert into public.users on new auth.users creation
-- This function populates the public.users table when a new user signs up via auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to write to public.users from auth context
SET search_path = public -- Ensures function runs in the public schema context
AS $$
BEGIN
  -- Insert a new row into public.users table
  -- Extract name and avatar_url from the raw_user_meta_data JSONB field
  -- Also include the updated_at column, setting it to the creation timestamp initially
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name',       -- Extract 'name' field as text
    NEW.raw_user_meta_data ->> 'avatar_url', -- Extract 'avatar_url' field as text
    NEW.created_at,                          -- Use the timestamp from auth.users
    NEW.created_at                           -- Set updated_at to the same as created_at on insert
  );
  RETURN NEW; -- Important: return the new row for AFTER triggers
END;
$$;

-- 2. Create trigger that executes handle_new_user() function after an insert on auth.users
-- Drop trigger first if it already exists to ensure idempotency.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. (Optional but Recommended) Create OR REPLACE trigger function to update public.users on auth.users update
-- This function keeps public.users in sync when user details change in auth.users (e.g., email, metadata).
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to write to public.users from auth context
SET search_path = public -- Ensures function runs in the public schema context
AS $$
BEGIN
  -- Update the corresponding row in the public.users table
  UPDATE public.users
  SET
    email = NEW.email,
    name = NEW.raw_user_meta_data ->> 'name',
    avatar_url = NEW.raw_user_meta_data ->> 'avatar_url',
    updated_at = NOW() -- Or potentially NEW.updated_at if available and desired
  WHERE id = NEW.id;
  RETURN NEW; -- Important: return the new row for AFTER triggers
END;
$$;

-- 4. (Optional but Recommended) Create trigger that executes handle_update_user() function after an update on auth.users
-- Drop trigger first if it already exists to ensure idempotency.
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();


-- 5. Create OR REPLACE trigger function to delete from public.users on auth.users deletion
-- This function handles the cascading deletion from public.users when a user is deleted from auth.users.
-- The cascading deletion to other tables (submissions, comments, etc.) is then handled
-- by the ON DELETE CASCADE rules defined within your public schema for those tables.
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to write to public.users from auth context
SET search_path = public -- Ensures function runs in the public schema context
AS $$
BEGIN
  -- Delete the corresponding row in the public.users table using the old user's ID
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD; -- Important: return the old row for AFTER triggers
END;
$$;

-- 6. Create trigger that executes handle_delete_user() function after a delete on auth.users
-- Drop trigger first if it already exists to ensure idempotency.
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_user();