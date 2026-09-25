import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase: SupabaseClient = createClient(
  url || "http://localhost:54321",
  key || "missing-key",
  { auth: { persistSession: true, autoRefreshToken: true } }
)

export const MEDIA_BUCKET = "media"

// Shared organizer account: the access code typed in Control is this account's password.
export const ORGANIZER_EMAIL = (import.meta.env.VITE_ORGANIZER_EMAIL as string | undefined) || "organizador@torneo-inedsor.app"

export function publicMediaUrl(path: string) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}
