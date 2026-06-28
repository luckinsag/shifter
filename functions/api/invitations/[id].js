export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const invId = params.id;

  try {
    const inv = await env.DB.prepare('SELECT shift_table_id FROM invitations WHERE id = ?').bind(invId).first();
    if (!inv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(inv.shift_table_id, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    await env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(invId).run();
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
