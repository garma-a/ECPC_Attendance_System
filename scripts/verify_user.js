import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const usersToTest = [
  { username: 'student', password: 'student' },
  { username: 'instructor', password: 'instructor' },
  { username: 'admin', password: 'admin' },
]

async function verifyLogins() {
  console.log('Verifying logins for demo users...')
  let hasFailure = false

  for (const user of usersToTest) {
    const email = `${user.username}@system.local`
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: user.password,
    })

    if (error) {
      console.error(`[failed] ${user.username} (${email}): ${error.message}`)
      hasFailure = true
    } else {
      console.log(`[success] ${user.username} (ID: ${data.user.id})`)
      
      // Sign out to clear session for next login
      await supabase.auth.signOut()
    }
  }

  if (hasFailure) {
    console.log('\nSome logins failed. Make sure the seed script ran successfully.')
    process.exit(1)
  } else {
    console.log('\nAll logins verified successfully! You can now use these credentials in the app.')
  }
}

verifyLogins()
