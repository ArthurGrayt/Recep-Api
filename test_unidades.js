const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/Arthur/Documents/Recep-Api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('unidade_cliente')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}
test();
