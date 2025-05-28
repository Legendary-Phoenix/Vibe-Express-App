import {createClient} from "@supabase/supabase-js";

const getSupabaseForUser = (token) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    }
  );
};

export default getSupabaseForUser;