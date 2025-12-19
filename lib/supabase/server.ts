import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { type GetServerSidePropsContext } from 'next'
import { Database } from '../database-types'

export function createClient(
  context?: { req: NextApiRequest | GetServerSidePropsContext['req']; res: NextApiResponse | GetServerSidePropsContext['res'] }
) {
  if (context) {
    // Pages router client with cookies
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.keys(context.req.cookies).map((name) => ({
              name,
              value: context.req.cookies[name] || '',
            }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              context.res.appendHeader(
                'Set-Cookie',
                `${name}=${value}; ${serializeOptions(options)}`
              )
            })
          },
        },
      }
    )
  }

  // Fallback to basic client if no context
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function serializeOptions(options: CookieOptions) {
  let str = ''
  if (options.domain) str += `; Domain=${options.domain}`
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`
  if (options.httpOnly) str += `; HttpOnly`
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`
  if (options.path) str += `; Path=${options.path}`
  if (options.sameSite) str += `; SameSite=${options.sameSite}`
  if (options.secure) str += `; Secure`
  return str
}

export async function createAdminClient() {
  // Create admin client with service role key for server-side operations
  const { createClient } = await import('@supabase/supabase-js')
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Helper function to get authenticated user
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Helper function to get user session
export async function getUserSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

// Helper function to refresh session
export async function refreshSession(refreshToken: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error) {
    throw error
  }

  return true
}

// Helper function to sign out user
export async function signOutUser() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  return true
}

// Export the old supabaseAdmin for backward compatibility (lazy initialization)
let adminClient: Awaited<ReturnType<typeof createAdminClient>> | null = null;

export async function getAdminClient() {
  if (!adminClient) {
    adminClient = await createAdminClient();
  }
  return adminClient;
}

export const supabaseAdmin = getAdminClient();
