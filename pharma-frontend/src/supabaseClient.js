import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and publishable key.
const SUPABASE_URL = 'https://iosyxcmbonzfzciizdit.supabase.co';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_SnMyLN000JfxQfHhOpxWHQ_QeOAqnh4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
