import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onztthbetyryxnzxtajg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenR0aGJldHlyeXhuenh0YWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDIxMDgsImV4cCI6MjA4NjE3ODEwOH0.2KXZQYQZ-HQPIyRVN-0Hhp5U2PH0bhr9S3CXW-lx6pc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDelete() {
  const userIdToDelete = '1230ae8e-39cc-4d45-b951-c136f0b22439'; // The 'student' user ID we found

  console.log(`Attempting to delete user ${userIdToDelete} via Edge Function 'delete-user'...`);

  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId: userIdToDelete }
    });

    if (error) {
      console.error("Function Invocation Error:", error);
      if (error.context) {
        const errorText = await error.context.text();
        console.error("Error Body:", errorText);
      }
      console.log("\nNOTE: This error usually occurs if the function is not yet deployed or if it crashed.");
      console.log("Run 'supabase functions deploy delete-user' to fix this.");
    } else {
      console.log("Function Response:", data);
    }

  } catch (err) {
    console.error("Unexpected Error:", err);
  }
}

testDelete();
