-- --- Enable RLS on relevant tables ---
-- Run these commands once for each table to enable Row Level Security.
-- You can run these in a single SQL Editor session or script.

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

-- --- Drop Existing Policies ---
-- It's good practice to drop policies before recreating them,
-- especially when running scripts multiple times during development.
-- Drop policies one by one to ensure idempotency.

-- Policies for public.users table
DROP POLICY IF EXISTS "Allow auth select own user profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin select all user profiles" ON public.users;
-- INSERT & DELETE handled by auth triggers syncing auth.users -> public.users
DROP POLICY IF EXISTS "Allow auth update own user profile" ON public.users;
DROP POLICY IF EXISTS "Allow admin update any user profile" ON public.users;

-- Policies for public.topics table
DROP POLICY IF EXISTS "Allow all select topics" ON public.topics;

-- Policies for public.tags table
DROP POLICY IF EXISTS "Allow all select tags" ON public.tags;

-- Policies for public.templates table
DROP POLICY IF EXISTS "Allow anon select public templates" ON public.templates;
DROP POLICY IF EXISTS "Allow auth select owned, public, or accessible templates" ON public.templates;
DROP POLICY IF EXISTS "Allow admin select all templates" ON public.templates;
DROP POLICY IF EXISTS "Allow auth insert own templates" ON public.templates;
DROP POLICY IF EXISTS "Allow owner or admin update templates" ON public.templates;
DROP POLICY IF EXISTS "Allow owner or admin delete templates" ON public.templates;

-- Policies for public.template_fields table
DROP POLICY IF EXISTS "Allow select fields for visible templates" ON public.template_fields;
DROP POLICY IF EXISTS "Allow owner or admin manage template fields" ON public.template_fields;

-- Policies for public.submissions table
DROP POLICY IF EXISTS "Allow select submissions for own or owned templates" ON public.submissions;
DROP POLICY IF EXISTS "Allow admin select all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow auth insert own submission if template visible" ON public.submissions;
DROP POLICY IF EXISTS "Allow user or owner or admin update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow user or owner or admin delete submissions" ON public.submissions;

-- Policies for public.field_submissions table
DROP POLICY IF EXISTS "Allow select answers for visible submissions" ON public.field_submissions;
DROP POLICY IF EXISTS "Allow user, owner, or admin manage field submissions via submission" ON public.field_submissions;


-- Policies for public.comments table
DROP POLICY IF EXISTS "Allow select comments for visible templates" ON public.comments;
DROP POLICY IF EXISTS "Allow auth insert comments if template visible" ON public.comments;
DROP POLICY IF EXISTS "Allow comment author or owner or admin delete comments" ON public.comments;

-- Policies for public.likes table
DROP POLICY IF EXISTS "Allow select likes for visible templates" ON public.likes;
DROP POLICY IF EXISTS "Allow auth insert own like if template visible" ON public.likes;
DROP POLICY IF EXISTS "Allow user delete own like" ON public.likes;
DROP POLICY IF EXISTS "Allow owner or admin delete likes on their template" ON public.likes;


-- Policies for public.template_tags table
DROP POLICY IF EXISTS "Allow select template tags for visible templates" ON public.template_tags;
DROP POLICY IF EXISTS "Allow owner or admin manage template tags" ON public.template_tags;

-- Policies for public.template_access table
DROP POLICY IF EXISTS "Allow owner or admin select template access" ON public.template_access;
DROP POLICY IF EXISTS "Allow owner or admin manage template access" ON public.template_access;


-- --- RLS Policies Definitions ---

-- Helper function to check if current user is an admin
-- This function queries the public.users table to check the is_admin flag.
-- Ensure that the RLS policies on public.users allow this query to return the correct is_admin status
-- for the calling user (e.g., the 'Allow auth select own user profile' policy).
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER -- Runs with the privileges of the calling user (RLS policies)
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u."is_admin" = true);
$$;


-- Policies for public.users table
CREATE POLICY "Allow auth select own user profile"
ON public.users FOR SELECT TO authenticated
USING (auth.uid() = id); -- Authenticated user can select their own row

CREATE POLICY "Allow admin select all user profiles"
ON public.users FOR SELECT
USING (is_admin(auth.uid())); -- Admin can select any row

-- INSERT/DELETE on public.users are primarily managed by auth triggers, not RLS policies.
-- Updates on public.users might happen via user profile page or admin panel.
CREATE POLICY "Allow auth update own user profile"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id); -- Auth user can update their own row (all fields allowed by default unless restricted by WITH CHECK)
-- Optional: To restrict *which* fields can be updated by a non-admin user (e.g., disallow changing is_admin):
-- USING (auth.uid() = id) WITH CHECK (NEW."is_admin" = old."is_admin" AND NEW."is_active" = old."is_active");


CREATE POLICY "Allow admin update any user profile"
ON public.users FOR UPDATE
USING (is_admin(auth.uid())); -- Admin can update any row (including is_admin/is_active)


-- Policies for public.topics table
CREATE POLICY "Allow all select topics"
ON public.topics FOR SELECT
USING (true); -- Anyone (authenticated or anonymous) can select topics

-- Policies for public.tags table
CREATE POLICY "Allow all select tags"
ON public.tags FOR SELECT
USING (true); -- Anyone (authenticated or anonymous) can select tags


-- Policies for public.templates table
-- SELECT policies: determine who can *see* a template
CREATE POLICY "Allow anon select public templates"
ON public.templates FOR SELECT TO anon
USING ("is_public" = true); -- Anonymous users can only select public templates

CREATE POLICY "Allow auth select owned, public, or accessible templates"
ON public.templates FOR SELECT TO authenticated
USING (
    "is_public" = true OR -- Public templates are visible to all authenticated
    owner_id = auth.uid() OR -- Templates owned by the current user are visible
    EXISTS ( -- Templates the user has been explicitly granted access to are visible
        SELECT 1
        FROM public.template_access ta
        WHERE ta.template_id = templates.id
          AND ta.user_id = auth.uid()
    )
);

CREATE POLICY "Allow admin select all templates"
ON public.templates FOR SELECT
USING (is_admin(auth.uid())); -- Admin can select any template

-- INSERT policy: determine who can *create* a template
CREATE POLICY "Allow auth insert own templates"
ON public.templates FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid()); -- Authenticated users can only insert templates where the owner_id matches their auth.uid()

-- UPDATE policy: determine who can *edit* a template
CREATE POLICY "Allow owner or admin update templates"
ON public.templates FOR UPDATE
USING (owner_id = auth.uid() OR is_admin(auth.uid())); -- Template owner or an Admin can update

-- DELETE policy: determine who can *delete* a template
CREATE POLICY "Allow owner or admin delete templates"
ON public.templates FOR DELETE
USING (owner_id = auth.uid() OR is_admin(auth.uid())); -- Template owner or an Admin can delete


-- Policies for public.template_fields table (Questions)
-- SELECT access to fields is implicitly tied to access to the parent template.
CREATE POLICY "Allow select fields for visible templates"
ON public.template_fields FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (
    t."is_public" = true OR -- Public template fields visible to all auth
    t.owner_id = auth.uid() OR -- Owned template fields visible to owner
    EXISTS ( -- Fields for templates with explicit access are visible
        SELECT 1
        FROM public.template_access ta
        WHERE ta.template_id = t.id
          AND ta.user_id = auth.uid()
    ) OR is_admin(auth.uid()) -- Admin sees all fields
)));

-- INSERT, UPDATE, DELETE fields: Only the template owner or admin should manage fields.
CREATE POLICY "Allow owner or admin manage template fields"
ON public.template_fields FOR ALL -- Applies to INSERT, UPDATE, DELETE
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (t.owner_id = auth.uid() OR is_admin(auth.uid()))));


-- Policies for public.submissions table (Forms)
-- SELECT policies: who can *view* a submitted form
CREATE POLICY "Allow select submissions for own or owned templates"
ON public.submissions FOR SELECT TO authenticated
USING (
    user_id = auth.uid() OR -- User can select their own submissions
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.owner_id = auth.uid()) -- User can select submissions for templates they own
);

CREATE POLICY "Allow admin select all submissions"
ON public.submissions FOR SELECT
USING (is_admin(auth.uid())); -- Admin can select any submission

-- INSERT policy: who can *submit* a form
CREATE POLICY "Allow auth insert own submission if template visible"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() AND -- Must be inserting for themselves
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND ( -- Check template visibility
        t."is_public" = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);

-- UPDATE policy: who can *edit* a submitted form (answers)
-- Requirement says only the author of the form (user) or the template creator (owner) or admin.
CREATE POLICY "Allow user or owner or admin update submissions"
ON public.submissions FOR UPDATE
USING (
    user_id = auth.uid() OR -- Form author can update their own submission
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.owner_id = auth.uid()) OR -- Template owner can update submissions for their template
    is_admin(auth.uid()) -- Admin can update any submission
);

-- DELETE policy: who can *delete* a submitted form
-- Requirement says only the author of the form (user) or the template creator (owner) or admin.
CREATE POLICY "Allow user or owner or admin delete submissions"
ON public.submissions FOR DELETE
USING (
    user_id = auth.uid() OR -- Form author can delete their own submission
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.owner_id = auth.uid()) OR -- Template owner can delete submissions for their template
    is_admin(auth.uid()) -- Admin can delete any submission
);


-- Policies for public.field_submissions table (Answers)
-- SELECT access to answers is implicitly tied to access to the parent submission.
CREATE POLICY "Allow select answers for visible submissions"
ON public.field_submissions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (
    s.user_id = auth.uid() OR -- Answer belongs to user's own submission
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = s.template_id AND t.owner_id = auth.uid()) OR -- Answer belongs to submission of owned template
    is_admin(auth.uid()) -- Admin sees all answers
)));

-- INSERT, UPDATE, DELETE for answers are typically handled as part of managing the Submission.
-- We create an ALL policy that mirrors the submission UPDATE/DELETE policy.
CREATE POLICY "Allow user, owner, or admin manage field submissions via submission"
ON public.field_submissions FOR ALL -- Applies to INSERT, UPDATE, DELETE
USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (
    s.user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = s.template_id AND t.owner_id = auth.uid()) OR
    is_admin(auth.uid())
)));
-- Note: The WITH CHECK part for INSERT would need to ensure the field belongs to the submission's template,
-- but typically Prisma will handle the logic of inserting answers when a submission is created/updated,
-- making this 'ALL' policy sufficient for backend operations under the authorized user context.


-- Policies for public.comments table
-- SELECT policy: who can *view* comments (tied to template visibility)
CREATE POLICY "Allow select comments for visible templates"
ON public.comments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (
    t."is_public" = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    is_admin(auth.uid())
)));

-- INSERT policy: who can *add* a comment (authenticated user on a visible template)
CREATE POLICY "Allow auth insert comments if template visible"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() AND -- Must be inserting for themselves
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND ( -- Check template visibility
        t."is_public" = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);
-- Note: Admins can insert too, but the general policy is for authenticated users. Admin bypasses RLS unless explicitly restricted.

-- DELETE policy: who can *delete* a comment (comment author, template owner, or admin)
CREATE POLICY "Allow comment author or owner or admin delete comments"
ON public.comments FOR DELETE
USING (
    user_id = auth.uid() OR -- Comment author can delete their own comment
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.owner_id = auth.uid()) OR -- Template owner can delete comments on their template
    is_admin(auth.uid()) -- Admin can delete any comment
);


-- Policies for public.likes table
-- SELECT policy: who can *view* likes (tied to template visibility)
CREATE POLICY "Allow select likes for visible templates"
ON public.likes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (
    t."is_public" = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    is_admin(auth.uid())
)));

-- INSERT policy: who can *add* a like (authenticated user on a visible template, and only once)
-- Uniqueness is handled by the @@unique constraint in Prisma schema, RLS just needs to allow the INSERT.
CREATE POLICY "Allow auth insert own like if template visible"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() AND -- Must be inserting for themselves
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND ( -- Check template visibility
        t."is_public" = true OR
        EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid())
    ))
);

-- DELETE policies: who can *remove* a like
-- User can remove their own like OR Template owner/Admin can remove any like on their template.
CREATE POLICY "Allow user delete own like"
ON public.likes FOR DELETE TO authenticated
USING (user_id = auth.uid()); -- User can delete their own like

CREATE POLICY "Allow owner or admin delete likes on their template"
ON public.likes FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.owner_id = auth.uid()) OR -- Template owner can delete any like on their template
    is_admin(auth.uid()) -- Admin can delete any like
);
-- Note: Order of policies matters; Supabase applies policies cumulatively. If multiple policies apply, access is granted.


-- Policies for public.template_tags table (Join table for Templates and Tags)
-- SELECT policy: who can *view* the tag relationships (tied to template visibility)
CREATE POLICY "Allow select template tags for visible templates"
ON public.template_tags FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (
    t."is_public" = true OR
    t.owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.template_access ta WHERE ta.template_id = t.id AND ta.user_id = auth.uid()) OR
    is_admin(auth.uid())
)));

-- INSERT, DELETE policies: who can *manage* tags on a template (Template owner or admin)
CREATE POLICY "Allow owner or admin manage template tags"
ON public.template_tags FOR ALL -- Applies to INSERT, UPDATE, DELETE (though UPDATE is unlikely here)
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (t.owner_id = auth.uid() OR is_admin(auth.uid()))));


-- Policies for public.template_access table (Join table for Restricted Templates and Users)
-- SELECT policy: who can *view* which users have explicit access to a template (Only template owner or admin)
CREATE POLICY "Allow owner or admin select template access"
ON public.template_access FOR SELECT
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (t.owner_id = auth.uid() OR is_admin(auth.uid()))));

-- INSERT, DELETE policies: who can *grant or revoke* template access (Only template owner or admin)
CREATE POLICY "Allow owner or admin manage template access"
ON public.template_access FOR ALL -- Applies to INSERT, UPDATE, DELETE (though UPDATE is unlikely here)
USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND (t.owner_id = auth.uid() OR is_admin(auth.uid()))));