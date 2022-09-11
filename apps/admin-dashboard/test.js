import { createClient } from '@supabase/supabase-js';

const NEXT_PUBLIC_SUPABASE_URL= "https://uiwcrsifuijejcpdphok.supabase.co";
const NEXT_PUBLIC_SUPABASE_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpd2Nyc2lmdWlqZWpjcGRwaG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjI3ODUyMDQsImV4cCI6MTk3ODM2MTIwNH0.prg23x20a1mN7_HHhQMEgbz4OkfHq5_6-xfcZ2Gefrk";

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_KEY,
);

(async () => {
  console.log(
    await supabase.from('registered-users').update({ first_name: 'updated' }).eq('uuid', '5e5c8c1f-cdfa-40d1-b95f-d1106c38bd2c')
  )
})();