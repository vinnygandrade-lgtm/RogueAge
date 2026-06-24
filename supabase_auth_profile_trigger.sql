-- ========================================================
-- L2 MINI — Auth → public.profiles sync (email confirmation safe)
-- ========================================================
-- When "Confirm email" is enabled, signUp() often returns user but no session;
-- the client cannot upsert public.profiles with the anon key. This trigger
-- creates/updates the profile row from auth.users in one transaction.
--
-- Run in Supabase SQL Editor (idempotent).
-- Requires: public.profiles (see supabase_MASTER_SETUP.sql).
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', '')), '');
  IF uname IS NULL OR uname = '' THEN
    uname := split_part(COALESCE(NEW.email, ''), '@', 1);
  END IF;
  IF uname IS NULL OR uname = '' THEN
    uname := 'user_' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 12);
  END IF;

  INSERT INTO public.profiles (id, username, email, access_level)
  VALUES (NEW.id, uname, COALESCE(NEW.email, ''), 0)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(EXCLUDED.username, ''), public.profiles.username);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'L2 Mini: mirror auth.users into public.profiles for login-by-username + RLS-friendly signup.';
