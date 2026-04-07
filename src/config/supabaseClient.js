import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// On native mobile, use AsyncStorage so the auth session (including the JWT)
// is persisted and sent with every request — including Storage uploads.
// On web, the default localStorage adapter works fine.
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

export default supabase