import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- SECURITY CHECK START ---
    // Since we will disable "Verify JWT" on the Gateway to avoid 401 errors,
    // we MUST manually verify the user is an Admin here.

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Missing Authorization header")
    }

    // The header is "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get the user
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
      if (userError || !user) {
        console.error("Token verification failed:", userError)
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid Token" }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    
      // --- ENHANCED ROLE CHECK ---
      // 1. Try checking Auth Metadata first (Fastest)
      let role = user.user_metadata?.role
    
      // 2. If Metadata is missing or not admin, check the Public Table (Fallback)
      if (role !== 'admin') {
        console.log(`Metadata role is '${role}', checking public 'User' table for confirmation...`)
        
        const { data: dbUser, error: roleError } = await supabaseAdmin
          .from('User')
          .select('role')
          .eq('id', user.id)
          .single()
    
        if (!roleError && dbUser) {
          role = dbUser.role
          console.log(`Retrieved role from public DB: ${role}`)
        }
      }
    
      if (role !== 'admin') {
        console.error(`User ${user.id} tried to delete but is role: ${role}`)
        return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // --- SECURITY CHECK END ---

    const { userId } = await req.json()

    if (!userId) {
      throw new Error("User ID is required")
    }

    console.log(`Admin ${user.email} is deleting user ${userId}`)

    // 1. Delete user's Attendance history
    const { error: attError } = await supabaseAdmin
      .from('Attendance')
      .delete()
      .eq('userId', userId)

    if (attError) {
      console.error("Error deleting attendance:", attError)
      throw new Error("Failed to clean up user attendance: " + attError.message)
    }

    // 2. Delete sessions created by user
    const { error: sessionError } = await supabaseAdmin
      .from('Session')
      .delete()
      .eq('createdBy', userId)

    if (sessionError) {
      console.warn("Warning: Could not delete user's sessions:", sessionError)
    }

    // 3. Delete from Public 'User' table
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error("DB Delete Error:", dbError)
      throw new Error("Could not delete user profile.")
    }

    // 4. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Auth Delete Error:", authError)
      throw new Error("Profile deleted, but failed to remove from Auth: " + authError.message)
    }

    return new Response(
      JSON.stringify({ message: `User ${userId} and their data have been permanently deleted.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})