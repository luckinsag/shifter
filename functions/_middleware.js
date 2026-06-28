import { jwtVerify } from 'jose'

export async function onRequest({ request, env, next, data }) {
  const url = new URL(request.url);
  
  // Skip middleware for auth routes (google login, callback, logout)
  // We STILL WANT TO PROTECT `/api/auth/me` though! Let me adjust.
  // Actually, let's just skip `/api/auth/google`, `/api/auth/callback`
  if (url.pathname === '/api/auth/google' || url.pathname === '/api/auth/callback') {
    return next();
  }

  // Only protect /api/* routes
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const cookie = request.headers.get('Cookie') || '';
  const token = cookie.match(/token=([^;]+)/)?.[1];
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    data.user = payload;
    return next();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
