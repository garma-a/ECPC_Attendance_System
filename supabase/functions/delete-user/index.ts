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

  try {
    // 1. Create a Supabase Client with Admin rights (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get the userId from the request body
    const { userId } = await req.json()

    if (!userId) {
      throw new Error("User ID is required")
    }

    // 3. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      throw authError
    }

    // 4. Delete from Public 'User' table
    // (This might happen automatically if you have ON DELETE CASCADE set up on your foreign keys,
    // but explicit deletion ensures consistency if not)
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', userId)

    if (dbError) {
      // Note: If Auth delete succeeded but DB delete failed, we have a partial state.
      // However, since the user is gone from Auth, they can't log in anyway.
      console.error("Error deleting from public table:", dbError)
      return new Response(JSON.stringify({ error: "User deleted from Auth but failed to delete from public table: " + dbError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Return Success
    return new Response(
      JSON.stringify({ message: `User ${userId} deleted successfully!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
