export async function onRequestGet(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const tableId = params.id;

  try {
    const table = await env.DB.prepare(`
      SELECT st.*, stm.role as my_role
      FROM shift_tables st
      JOIN shift_table_members stm ON st.id = stm.shift_table_id
      WHERE st.id = ? AND stm.user_id = ?
    `).bind(tableId, userId).first();

    if (!table) return new Response(JSON.stringify({ error: 'Not found or forbidden' }), { status: 404 });

    const memberCount = await env.DB.prepare('SELECT COUNT(*) as count FROM shift_table_members WHERE shift_table_id = ?').bind(tableId).first();
    table.member_count = memberCount.count;

    return new Response(JSON.stringify(table), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const userId = data.user.sub;
  const tableId = params.id;

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const updates = [];
    const bindings = [];

    ['name', 'description', 'start_date', 'end_date'].forEach(key => {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        bindings.push(body[key]);
      }
    });

    if (body.is_shared !== undefined) {
      updates.push('is_shared = ?');
      bindings.push(body.is_shared ? 1 : 0);
    }

    if (updates.length > 0) {
      bindings.push(tableId);
      await env.DB.prepare(`UPDATE shift_tables SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const tableId = params.id;

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member || (member.role !== 'admin' && data.user.role !== 'superadmin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    await env.DB.prepare('DELETE FROM shift_tables WHERE id = ?').bind(tableId).run();

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
