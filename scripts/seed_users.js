import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const users = [
  {
    username: 'student',
    password: 'student',
    name: 'Student',
    role: 'student',
    groupName: 'A',
  },
  {
    username: 'instructor',
    password: 'instructor',
    name: 'Instructor',
    role: 'instructor',
    groupName: null,
  },
  {
    username: 'admin',
    password: 'admin',
    name: 'Admin',
    role: 'admin',
    groupName: null,
  },
]

const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-user`

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${supabaseAnonKey}`,
  apikey: supabaseAnonKey,
}

async function seedUser(user) {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(user),
  })

  const text = await response.text()
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    payload = { error: text }
  }

  if (response.ok && !payload?.error) {
    return { status: 'created', message: payload?.message }
  }

  const errorMessage = String(payload?.error || payload?.message || 'Unknown error')
  const normalized = errorMessage.toLowerCase()

  if (normalized.includes('already') || normalized.includes('duplicate')) {
    return { status: 'exists', message: errorMessage }
  }

  if (response.status === 401 || response.status === 403) {
    return { status: 'auth', message: errorMessage }
  }

  return { status: 'failed', message: errorMessage }
}

async function run() {
  console.log('Seeding demo users via create-user Edge Function...')

  let hasFailure = false

  for (const user of users) {
    try {
      const result = await seedUser(user)
      if (result.status === 'created') {
        console.log(`[created] ${user.username}`)
      } else if (result.status === 'exists') {
        console.log(`[exists] ${user.username}`)
      } else if (result.status === 'auth') {
        console.error(`[auth error] ${user.username}: ${result.message}`)
        hasFailure = true
      } else {
        console.error(`[failed] ${user.username}: ${result.message}`)
        hasFailure = true
      }
    } catch (error) {
      console.error(`[failed] ${user.username}: ${error?.message || error}`)
      hasFailure = true
    }
  }

  if (hasFailure) {
    process.exit(1)
  }

  console.log('Seed complete.')
}

run()
