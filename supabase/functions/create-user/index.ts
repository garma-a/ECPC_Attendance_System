import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Create a Supabase Client with Admin rights (Service Role)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. Get the data you sent from the frontend
  const { username, password, name, role, groupName } = await req.json()

  // 3. Auto-generate a dummy email (Supabase requires an email)
  const email = `${username}@system.local`

  // 4. Create the User in Supabase Auth System
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { name, role }
  })

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 5. Insert the User into YOUR custom "User" table
  const { error: dbError } = await supabaseAdmin
    .from('User')
    .insert({
      id: authData.user.id,
      username: username,
      name: name,
      role: role,
      groupName: groupName || null,
      updatedAt: new Date().toISOString()
    })

  if (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return new Response(JSON.stringify({ error: "Database error: " + dbError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 6. Return Success
  return new Response(
    JSON.stringify({ message: `User ${username} created successfully!`, userId: authData.user.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
