import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onztthbetyryxnzxtajg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uenR0aGJldHlyeXhuenh0YWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDIxMDgsImV4cCI6MjA4NjE3ODEwOH0.2KXZQYQZ-HQPIyRVN-0Hhp5U2PH0bhr9S3CXW-lx6pc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminFlow() {
  const username = `admin_${Date.now()}`;
  const password = 'password123';
  
  console.log(`1. Creating temporary admin: ${username}...`);
  
  // Call create-user to make a new admin
  const { data: createData, error: createError } = await supabase.functions.invoke('create-user', {
    body: {
      username,
      password,
      name: 'Test Admin',
      role: 'admin'
    }
  });

  if (createError) {
    console.error("Failed to create admin:", createError);
    return;
  }
  console.log("Admin created:", createData);

  // 2. Log in as this new admin
  console.log("2. Logging in...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: `${username}@system.local`,
    password
  });

  if (loginError) {
    console.error("Login failed:", loginError);
    return;
  }
  console.log("Login successful! Token acquired.");

  // 3. Try to call delete-user WITH the logged-in session
  // supabase-js automatically attaches the session token from loginData
  console.log("3. Invoking delete-user with Admin Session...");
  
  // We'll try to delete the admin itself just to test the call (userId: loginData.user.id)
  const { data: deleteData, error: deleteError } = await supabase.functions.invoke('delete-user', {
    body: { userId: loginData.user.id }
  });

  if (deleteError) {
    console.error("Invocation failed:", deleteError);
    if (deleteError.context) {
        console.error("Error Body:", await deleteError.context.text());
    }
  } else {
    console.log("Success! Function called with User Token.");
    console.log(deleteData);
  }
}

testAdminFlow();
