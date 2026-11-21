/* Where the data lives.
   - Leave both values empty: data stays in this browser only (default).
   - To share data between computers, create a Supabase project, run supabase-setup.sql, then paste your
     Project URL and the public key below (the "anon public" key, or the "Publishable" key on newer projects). See README.md. */

const SUPABASE_URL = '';
const SUPABASE_KEY = '';

const CLOUD = Boolean(SUPABASE_URL && SUPABASE_KEY);
