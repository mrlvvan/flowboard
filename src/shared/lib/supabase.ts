import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Note: env-var presence is validated up-front in main.tsx — if either is
// missing we render MissingEnvScreen and never reach this module.  Falling
// back to empty strings here keeps the type as `string` and avoids spurious
// crashes during tests or HMR.
const supabaseUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";
const supabaseAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ?? "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
