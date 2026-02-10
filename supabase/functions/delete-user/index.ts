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

    const { userId } = await req.json()

    if (!userId) {
      throw new Error("User ID is required")
    }

    console.log(`Starting cleanup for user: ${userId}`)

    // 1. Delete user's Attendance history (Fixes the FK Constraint error)
    const { error: attError } = await supabaseAdmin
      .from('Attendance')
      .delete()
      .eq('userId', userId)

    if (attError) {
      console.error("Error deleting attendance:", attError)
      throw new Error("Failed to clean up user attendance: " + attError.message)
    }

    // 2. (Optional) If user is an Instructor, delete sessions they created
    // Note: This might fail if THOSE sessions have attendance from OTHER students.
    // Ideally, you'd want to handle this more gracefully, but for now we attempt it 
    // to prevent 'createdBy' constraint errors.
    const { error: sessionError } = await supabaseAdmin
      .from('Session')
      .delete()
      .eq('createdBy', userId)

    if (sessionError) {
      console.warn("Warning: Could not delete user's sessions (might have attendees):", sessionError)
      // We don't throw here, we try to proceed. If the DB blocks the user delete below, 
      // then we know it was critical.
    }

    // 3. Delete from Public 'User' table
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error("DB Delete Error:", dbError)
      throw new Error("Could not delete user profile. They might still manage active sessions with attendees.")
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
