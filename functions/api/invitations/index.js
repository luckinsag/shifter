export async function onRequestGet(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');
  const userId = data.user.sub;

  if (!tableId) return new Response(JSON.stringify({ error: 'Missing shift_table_id' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { results } = await env.DB.prepare(`
      SELECT * FROM invitations WHERE shift_table_id = ? ORDER BY created_at DESC
    `).bind(tableId).all();

    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const userId = data.user.sub;

  try {
    const body = await request.json();
    const { email, shift_table_id } = body;
    if (!email || !shift_table_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift_table_id, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Check if already member
    const existingProfile = await env.DB.prepare('SELECT id FROM profiles WHERE email = ?').bind(email).first();
    if (existingProfile) {
      const alreadyMember = await env.DB.prepare('SELECT 1 FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift_table_id, existingProfile.id).first();
      if (alreadyMember) return new Response(JSON.stringify({ error: 'Already a member' }), { status: 400 });
    }

    const invId = crypto.randomUUID();
    // expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO invitations (id, email, shift_table_id, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(invId, email, shift_table_id, userId, expiresAt).run();

    return new Response(JSON.stringify({ id: invId, success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    // SQLite constraint violation on UNIQUE (email, shift_table_id, status)
    if (error.message.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: 'Pending invitation already exists' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
