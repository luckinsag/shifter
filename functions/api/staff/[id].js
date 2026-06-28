export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const staffUserId = params.id;
  const userId = data.user.sub;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');

  if (!tableId) return new Response(JSON.stringify({ error: 'Missing shift_table_id' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    if (!body.role) return new Response(JSON.stringify({ error: 'Missing role' }), { status: 400 });

    await env.DB.prepare('UPDATE shift_table_members SET role = ? WHERE shift_table_id = ? AND user_id = ?')
      .bind(body.role, tableId, staffUserId).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env, data, params } = context;
  const staffUserId = params.id;
  const userId = data.user.sub;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');

  if (!tableId) return new Response(JSON.stringify({ error: 'Missing shift_table_id' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    await env.DB.prepare('DELETE FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?')
      .bind(tableId, staffUserId).run();

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
