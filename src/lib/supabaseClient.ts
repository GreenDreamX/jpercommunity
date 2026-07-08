import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ufehqkmxqcqcmwkftqqf.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_ADqd8LmH-1H_WlHoTbAZkg_uVe6tUwE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
