-- =====================================================================
-- TRENDER — FIX CREATOR REGISTRATION RPC
-- =====================================================================
-- Fixes "stack depth limit exceeded" during Creator registration.
-- The RPC runs with the function owner's privileges so RLS evaluation
-- does not recursively interfere with the registration transaction.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.complete_creator_registration(
  p_full_name text,
  p_username text,
  p_phone text,
  p_country text,
  p_state text,
  p_city text,
  p_instagram_url text,
  p_tiktok_url text,
  p_submitted_follower_count integer
)
RETURNS public.creator_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_result public.creator_profiles;
  v_existing_username text;
  v_submitted_username text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to complete creator registration.';
  END IF;

  v_submitted_username := btrim(COALESCE(p_username, ''));
  SELECT username INTO v_existing_username
  FROM public.profiles
  WHERE id = v_uid;

  IF v_submitted_username <> ''
     AND v_submitted_username <> COALESCE(v_existing_username, '')
     AND EXISTS (
       SELECT 1
       FROM public.profiles other_profiles
       WHERE other_profiles.username = v_submitted_username
         AND other_profiles.id <> v_uid
     ) THEN
    RAISE EXCEPTION 'That username is already registered to another Trender account.';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    username = CASE
      WHEN v_submitted_username = '' THEN COALESCE(v_existing_username, username)
      WHEN v_submitted_username = COALESCE(v_existing_username, '') THEN COALESCE(v_existing_username, username)
      ELSE v_submitted_username
    END,
    phone = COALESCE(p_phone, phone),
    country = COALESCE(p_country, country),
    state = COALESCE(p_state, state),
    city = COALESCE(p_city, city)
  WHERE id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile row exists for this user yet.';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile row exists for this user yet.';
  END IF;

  INSERT INTO public.creator_social_accounts (
    creator_id,
    platform,
    handle
  )
  VALUES
    (v_uid, 'instagram', p_instagram_url),
    (v_uid, 'tiktok', p_tiktok_url)
  ON CONFLICT (creator_id, platform)
  DO UPDATE SET
    handle = EXCLUDED.handle;

  INSERT INTO public.creator_profiles (
    user_id,
    follower_count
  )
  VALUES (
    v_uid,
    p_submitted_follower_count
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    follower_count = EXCLUDED.follower_count
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$function$;