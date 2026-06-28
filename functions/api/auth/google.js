export async function onRequest(context) {
  const { env } = context;
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${env.APP_URL}/api/auth/callback`;
  
  const state = crypto.randomUUID();
  
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`
    }
  });
}
