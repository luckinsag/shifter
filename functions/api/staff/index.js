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
      SELECT p.id, p.email, p.full_name, p.avatar_url, stm.role, stm.joined_at
      FROM shift_table_members stm
      JOIN profiles p ON stm.user_id = p.id
      WHERE stm.shift_table_id = ?
      ORDER BY stm.joined_at ASC
    `).bind(tableId).all();

    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
