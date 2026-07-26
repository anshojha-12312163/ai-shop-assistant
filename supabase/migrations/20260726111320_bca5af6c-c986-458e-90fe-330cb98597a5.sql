
-- Add owner columns
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.questions ALTER COLUMN buyer_id SET NOT NULL;

-- Tighten insert policies
DROP POLICY IF EXISTS "Authenticated users can add reviews" ON public.reviews;
CREATE POLICY "Users can add own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Authenticated can ask" ON public.questions;
CREATE POLICY "Users can ask as themselves" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
