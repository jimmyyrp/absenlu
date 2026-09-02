import { NextRequest } from 'next/server';

/**
 * API Authentication Helper - Blu Decor Padang
 * Secures API routes with a shared secret token.
 * 
 * Usage: Add VERCEL_DEPLOY_HOOK_SECRET to environment variables.
 * The token is passed as: Authorization: Bearer <token>
 * Or as query param: ?token=<token> (for curl/CLI usage)
 */

const API_SECRET = process.env.VERCEL_DEPLOY_HOOK_SECRET || '';

export function verifyApiAuth(request: NextRequest): { authorized: boolean; error?: string } {
  // If no secret is configured, deny all access (fail-closed)
  if (!API_SECRET) {
    return { authorized: false, error: 'API secret not configured.' };
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token === API_SECRET) return { authorized: true };
  }

  // Check query parameter (for CLI/curl usage)
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  if (queryToken === API_SECRET) return { authorized: true };

  return { authorized: false, error: 'Unauthorized. Provide valid API token.' };
}
