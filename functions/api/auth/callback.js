import { SignJWT } from 'jose'

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  // Verify State Cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/oauth_state=([^;]+)/);
  if (!match || match[1] !== state) {
    return new Response('Invalid state', { status: 400 });
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${env.APP_URL}/api/auth/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenRes.ok) throw new Error('Failed to fetch token');
    const tokenData = await tokenRes.json();

    // 2. Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!userRes.ok) throw new Error('Failed to fetch user info');
    const userInfo = await userRes.json();
    const { sub, email, name, picture } = userInfo;

    // 3. Database Logic
    let role = 'user';
    
    // Check if user exists
    let profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(sub).first();
    
    if (profile) {
      role = profile.role;
    } else {
      // Check if it's the very first user in the database
      const countRes = await env.DB.prepare('SELECT COUNT(*) as count FROM profiles').first();
      if (countRes.count === 0) {
        role = 'superadmin';
        await env.DB.prepare(
          'INSERT INTO profiles (id, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)'
        ).bind(sub, email, name, picture, role).run();
      } else {
        // Check if there are any valid invitations
        const inv = await env.DB.prepare(
          "SELECT * FROM invitations WHERE email = ? AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP"
        ).bind(email).first();
        
        if (inv) {
          // Accept invitation, create profile, and join shift table
          await env.DB.batch([
            env.DB.prepare('INSERT INTO profiles (id, email, full_name, avatar_url, role) VALUES (?, ?, ?, ?, ?)').bind(sub, email, name, picture, 'user'),
            env.DB.prepare('INSERT INTO shift_table_members (shift_table_id, user_id, role) VALUES (?, ?, ?)').bind(inv.shift_table_id, sub, 'staff'),
            env.DB.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").bind(inv.id)
          ]);
        } else {
          // User doesn't exist and has no invitation -> Unauthorized
          return Response.redirect(`${env.APP_URL}/unauthorized`, 302);
        }
      }
    }

    // 4. Issue JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const jwt = await new SignJWT({ sub, email, role, name, picture })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // 5. Redirect and set cookie
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${env.APP_URL}/dashboard`,
        'Set-Cookie': `token=${jwt}; HttpOnly; Secure; Path=/; Max-Age=${7*24*60*60}; SameSite=Lax`
      }
    });

  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
