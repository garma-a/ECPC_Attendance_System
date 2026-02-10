import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onztthbetyryxnzxtajg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenR0aGJldHlyeXhuenh0YWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDIxMDgsImV4cCI6MjA4NjE3ODEwOH0.2KXZQYQZ-HQPIyRVN-0Hhp5U2PH0bhr9S3CXW-lx6pc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findUser() {
  const email = 'student@system.local';
  const password = 'student';

  console.log(`Attempting login for ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  console.log("Login successful!");
  console.log("User ID:", data.user.id);
  console.log("This user is ready to be deleted via the new Edge Function.");
}

findUser();
