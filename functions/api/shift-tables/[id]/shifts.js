export async function onRequestGet(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const tableId = params.id;

  try {
    // Check if user is a member or superadmin
    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT 1 FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
      if (!member) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    const { results } = await env.DB.prepare(`
      SELECT * FROM shifts WHERE shift_table_id = ? ORDER BY start_time ASC
    `).bind(tableId).all();

    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const userId = data.user.sub;
  const tableId = params.id;

  try {
    // Only admin can create shifts
    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    const body = await request.json();
    if (!body.name || !body.start_time || !body.end_time) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const shiftId = crypto.randomUUID();
    const color = body.color || '#6366f1';

    await env.DB.prepare(`
      INSERT INTO shifts (id, shift_table_id, name, start_time, end_time, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(shiftId, tableId, body.name, body.start_time, body.end_time, color).run();

    return new Response(JSON.stringify({ id: shiftId, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
