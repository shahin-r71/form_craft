--
-- RLS SCRIPT - Complete Version (Corrected template_access MANAGE policies)
--
-- This script assumes it's being run by a user with sufficient privileges
-- to create tables, functions, triggers, and manage RLS policies.
--

-- --- 0. Prerequisites: New Table for Admin Status & Sync Mechanism ---
-- This section creates a helper table to avoid RLS recursion when checking admin status.

-- Create the user_admin_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_admin_status (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Synchronization function to keep user_admin_status up-to-date
CREATE OR REPLACE FUNCTION public.sync_user_to_admin_status_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with definer's privileges
SET search_path = public -- Explicitly set search_path
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO user_admin_status (user_id, is_admin, last_updated)
        VALUES (NEW.id, COALESCE(NEW.is_admin, false), now());
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only update if is_admin actually changed
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            INSERT INTO user_admin_status (user_id, is_admin, last_updated)
            VALUES (NEW.id, COALESCE(NEW.is_admin, false), now())
            ON CONFLICT (user_id) DO UPDATE
            SET is_admin = EXCLUDED.is_admin,
                last_updated = now();
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_sync_user_admin_status ON public.users;
CREATE TRIGGER trigger_sync_user_admin_status
AFTER INSERT OR UPDATE OF is_admin ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_admin_status_table();

-- IMPORTANT: After applying this script, if you have existing users,
-- you MUST backfill the public.user_admin_status table. Run this once:
--
-- INSERT INTO public.user_admin_status (user_id, is_admin, last_updated)
-- SELECT id, COALESCE(is_admin, false), now() FROM public.users
-- ON CONFLICT (user_id) DO UPDATE SET
--   is_admin = EXCLUDED.is_admin,
--   last_updated = now();
--

-- --- 1. Enable RLS on relevant tables ---
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_admin_status ENABLE ROW LEVEL SECURITY;


-- --- 2. Drop Existing Policies (Comprehensive) ---
-- Policies for public.users
DROP POLICY IF EXISTS "Allow auth select own user profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin select all user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow auth update own user profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin update any user profile" ON public.users;

-- Policies for public.topics
DROP POLICY IF EXISTS "Allow all select topics" ON public.topics;

-- Policies for public.tags
DROP POLICY IF EXISTS "Allow all select tags" ON public.tags;

-- Policies for public.templates
DROP POLICY IF EXISTS "Allow anon select public templates" ON public.templates;
DROP POLICY IF EXISTS "Allow auth select owned, public, or accessible templates" ON public.templates;
DROP POLICY IF EXISTS "Allow admin select all templates" ON public.templates;
DROP POLICY IF EXISTS "Allow auth insert own templates" ON public.templates;
DROP POLICY IF EXISTS "Allow owner or admin update templates" ON public.templates;
DROP POLICY IF EXISTS "Allow owner or admin delete templates" ON public.templates;

-- Policies for public.template_fields
DROP POLICY IF EXISTS "Allow select fields for visible templates" ON public.template_fields;
DROP POLICY IF EXISTS "Allow owner or admin manage template fields" ON public.template_fields;

-- Policies for public.submissions
DROP POLICY IF EXISTS "Allow select submissions for own or owned templates" ON public.submissions;
DROP POLICY IF EXISTS "Allow admin select all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow auth insert own submission if template visible" ON public.submissions;
DROP POLICY IF EXISTS "Allow user or owner or admin update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow user or owner or admin delete submissions" ON public.submissions;

-- Policies for public.field_submissions
DROP POLICY IF EXISTS "Allow select answers for visible submissions" ON public.field_submissions;
DROP POLICY IF EXISTS "Allow user, owner, or admin manage field submissions via submission" ON public.field_submissions;

-- Policies for public.comments
DROP POLICY IF EXISTS "Allow select comments for visible templates" ON public.comments;
DROP POLICY IF EXISTS "Allow auth insert comments if template visible" ON public.comments;
DROP POLICY IF EXISTS "Allow comment author or owner or admin delete comments" ON public.comments;

-- Policies for public.likes
DROP POLICY IF EXISTS "Allow select likes for visible templates" ON public.likes;
DROP POLICY IF EXISTS "Allow auth insert own like if template visible" ON public.likes;
DROP POLICY IF EXISTS "Allow user delete own like" ON public.likes;
DROP POLICY IF EXISTS "Allow owner or admin delete likes on their template" ON public.likes;

-- Policies for public.template_tags
DROP POLICY IF EXISTS "Allow select template tags for visible templates" ON public.template_tags;
DROP POLICY IF EXISTS "Allow owner or admin manage template tags" ON public.template_tags;

-- Policies for public.template_access (Corrected Drops)
DROP POLICY IF EXISTS "User can see their own explicit access grants" ON public.template_access;
DROP POLICY IF EXISTS "Template owner can see access grants for their templates" ON public.template_access;
DROP POLICY IF EXISTS "Admin can see all template access grants" ON public.template_access;
DROP POLICY IF EXISTS "Allow owner or admin insert template access" ON public.template_access; -- New name
DROP POLICY IF EXISTS "Allow owner or admin update template access" ON public.template_access; -- New name
DROP POLICY IF EXISTS "Allow owner or admin delete template access" ON public.template_access; -- New name
DROP POLICY IF EXISTS "Allow owner or admin manage template access" ON public.template_access; -- Old generic manage name
DROP POLICY IF EXISTS "Allow owner or admin select template access" ON public.template_access; -- Old select name
-- Also drop diagnostic names if they were ever committed
DROP POLICY IF EXISTS "Template owner can see access grants for their templates (TEMP DIAGNOSTIC)" ON public.template_access;
DROP POLICY IF EXISTS "Template owner can see access grants for their templates (TEMP DISABLED)" ON public.template_access;
DROP POLICY IF EXISTS "Allow owner or admin manage template access (TEMP DIAGNOSTIC)" ON public.template_access;

-- Policies for public.user_admin_status
DROP POLICY IF EXISTS "Allow user to read their own admin_status" ON public.user_admin_status;
DROP POLICY IF EXISTS "Allow service roles or privileged access to user_admin_status" ON public.user_admin_status;
DROP POLICY IF EXISTS "Admin can see all admin statuses" ON public.user_admin_status;


-- --- 3. Helper Function Definitions ---
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_template_owner_plpgsql(uuid, uuid);

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_admin_status uas WHERE uas.user_id = user_id AND uas.is_admin = true);
$$;

CREATE OR REPLACE FUNCTION public.is_template_owner_plpgsql(p_template_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SET LOCAL row_security = off;
  SELECT EXISTS (SELECT 1 FROM public.templates t WHERE t.id = p_template_id AND t.owner_id = p_user_id) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- --- 4. RLS Policies Definitions ---

-- Policies for public.user_admin_status
CREATE POLICY "Allow user to read their own admin_status"
ON public.user_admin_status FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can see all admin statuses"
ON public.user_admin_status FOR SELECT
USING (public.is_admin(auth.uid()));


-- Policies for public.users
CREATE POLICY "Allow auth select own user profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow admin select all user profiles" ON public.users FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow auth update own user profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow admin update any user profile" ON public.users FOR UPDATE USING (public.is_admin(auth.uid()));

-- Policies for public.topics
CREATE POLICY "Allow all select topics" ON public.topics FOR SELECT USING (true);

-- Policies for public.tags
CREATE POLICY "Allow all select tags" ON public.tags FOR SELECT USING (true);

-- Policies for public.templates
CREATE POLICY "Allow anon select public templates" ON public.templates FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Allow auth select owned, public, or accessible templates" ON public.templates FOR SELECT TO authenticated
USING (
    is_public = true OR
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = templates.id AND ta.user_id = auth.uid())
);
CREATE POLICY "Allow admin select all templates" ON public.templates FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow auth insert own templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Allow owner or admin update templates" ON public.templates FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Allow owner or admin delete templates" ON public.templates FOR DELETE USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Policies for public.template_fields
CREATE POLICY "Allow select fields for visible templates" ON public.template_fields FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_fields.template_id AND (
    t.is_public = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));
CREATE POLICY "Allow owner or admin manage template fields" ON public.template_fields FOR ALL
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_fields.template_id AND (t.owner_id = auth.uid() OR public.is_admin(auth.uid()))));

-- Policies for public.submissions
CREATE POLICY "Allow select submissions for own or owned templates" ON public.submissions FOR SELECT TO authenticated
USING (
    submissions.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = submissions.template_id AND t.owner_id = auth.uid())
);
CREATE POLICY "Allow admin select all submissions" ON public.submissions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow auth insert own submission if template visible" ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
    submissions.user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = submissions.template_id AND (
        t.is_public = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);
CREATE POLICY "Allow user or owner or admin update submissions" ON public.submissions FOR UPDATE
USING (
    submissions.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = submissions.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
);
CREATE POLICY "Allow user or owner or admin delete submissions" ON public.submissions FOR DELETE
USING (
    submissions.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = submissions.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Policies for public.field_submissions
CREATE POLICY "Allow select answers for visible submissions" ON public.field_submissions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = field_submissions.submission_id AND (
    s.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = s.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));
CREATE POLICY "Allow user, owner, or admin manage field submissions via submission" ON public.field_submissions FOR ALL
USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = field_submissions.submission_id AND (
    s.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = s.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));

-- Policies for public.comments
CREATE POLICY "Allow select comments for visible templates" ON public.comments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = comments.template_id AND (
    t.is_public = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));
CREATE POLICY "Allow auth insert comments if template visible" ON public.comments FOR INSERT TO authenticated
WITH CHECK (
    comments.user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = comments.template_id AND (
        t.is_public = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);
CREATE POLICY "Allow comment author or owner or admin delete comments" ON public.comments FOR DELETE
USING (
    comments.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = comments.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Policies for public.likes
CREATE POLICY "Allow select likes for visible templates" ON public.likes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = likes.template_id AND (
    t.is_public = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));
CREATE POLICY "Allow auth insert own like if template visible" ON public.likes FOR INSERT TO authenticated
WITH CHECK (
    likes.user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = likes.template_id AND (
        t.is_public = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);
CREATE POLICY "Allow user delete own like" ON public.likes FOR DELETE TO authenticated
USING (likes.user_id = auth.uid());

CREATE POLICY "Allow owner or admin delete likes on their template" ON public.likes FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = likes.template_id AND t.owner_id = auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Policies for public.template_tags
CREATE POLICY "Allow select template tags for visible templates" ON public.template_tags FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_tags.template_id AND (
    t.is_public = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    public.is_admin(auth.uid())
)));
CREATE POLICY "Allow owner or admin manage template tags" ON public.template_tags FOR ALL
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_tags.template_id AND (t.owner_id = auth.uid() OR public.is_admin(auth.uid()))));


-- Policies for public.template_access (Refined Production-Ready Policies with Corrected MANAGE syntax)
-- SELECT Policies:
CREATE POLICY "User can see their own explicit access grants"
ON public.template_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Template owner can see access grants for their templates"
ON public.template_access FOR SELECT TO authenticated
USING (public.is_template_owner_plpgsql(template_access.template_id, auth.uid()));

CREATE POLICY "Admin can see all template access grants"
ON public.template_access FOR SELECT
USING (public.is_admin(auth.uid()));

-- MANAGE Policies for template_access (Corrected: separate policies for INSERT, UPDATE, DELETE)
-- Policy for INSERT
CREATE POLICY "Allow owner or admin insert template access"
ON public.template_access FOR INSERT
WITH CHECK (
    public.is_template_owner_plpgsql(template_access.template_id, auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Policy for UPDATE
CREATE POLICY "Allow owner or admin update template access"
ON public.template_access FOR UPDATE
USING ( -- Determines which existing rows can be targeted for an update
    public.is_template_owner_plpgsql(template_access.template_id, auth.uid()) OR
    public.is_admin(auth.uid())
)
WITH CHECK ( -- Ensures the row, after update, still meets criteria
    public.is_template_owner_plpgsql(template_access.template_id, auth.uid()) OR
    public.is_admin(auth.uid())
);

-- Policy for DELETE
CREATE POLICY "Allow owner or admin delete template access"
ON public.template_access FOR DELETE
USING ( -- Determines which existing rows can be deleted
    public.is_template_owner_plpgsql(template_access.template_id, auth.uid()) OR
    public.is_admin(auth.uid())
);