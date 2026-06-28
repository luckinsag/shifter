export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const userId = data.user.sub;
  const shiftId = params.id;

  try {
    // We need to check if user is admin of the table this shift belongs to
    const shift = await env.DB.prepare('SELECT shift_table_id FROM shifts WHERE id = ?').bind(shiftId).first();
    if (!shift) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift.shift_table_id, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    const body = await request.json();
    const updates = [];
    const bindings = [];

    ['name', 'start_time', 'end_time', 'color'].forEach(key => {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        bindings.push(body[key]);
      }
    });

    if (updates.length > 0) {
      bindings.push(shiftId);
      await env.DB.prepare(`UPDATE shifts SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const shiftId = params.id;

  try {
    const shift = await env.DB.prepare('SELECT shift_table_id FROM shifts WHERE id = ?').bind(shiftId).first();
    if (!shift) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift.shift_table_id, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    await env.DB.prepare('DELETE FROM shifts WHERE id = ?').bind(shiftId).run();

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
