REVOKE ALL ON FUNCTION public.prevent_availability_overlap() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_availability_overlap() TO service_role;