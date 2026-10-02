# Supabase Setup

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Set the project URL and publishable/anon key in `supabase-config.js`.
3. Set Edge Function secrets without adding them to the repository:

```sh
supabase secrets set SUPABASE_URL="https://PROJECT_REF.supabase.co" SUPABASE_ANON_KEY="YOUR_PUBLISHABLE_OR_ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" APP_ORIGIN="https://YOUR_GAME_HOST"
```

4. Deploy the username login function:

```sh
supabase functions deploy username-login
```

5. Enable email/password sign-up in Supabase Auth. New accounts enter a nickname, email, and password; returning players sign in with nickname and password. Email confirmation follows the project's Auth setting.

The service-role key is only used inside the Edge Function. Never put it in `supabase-config.js` or browser code.