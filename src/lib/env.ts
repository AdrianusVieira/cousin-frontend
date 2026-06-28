/** Centralized, validated access to Vite env vars. Fail loud at boot if misconfigured. */

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(
      `Missing env var ${name}. Copy .env.example to .env and fill it in (see the file for where each value comes from).`,
    );
  }

  return value;
}

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, ""),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY"),
  supabaseUrl: required("VITE_SUPABASE_URL"),
};
