require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('schedules').select('*').limit(1);
    fs.writeFileSync('out.json', JSON.stringify(data, null, 2), 'utf8');
}
run();
