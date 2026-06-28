export async function onRequestGet(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');
  const monthStr = url.searchParams.get('month'); // "YYYY-MM"
  const userId = data.user.sub;

  if (!tableId || !monthStr) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    const table = await env.DB.prepare('SELECT is_shared FROM shift_tables WHERE id = ?').bind(tableId).first();

    if (!member && data.user.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const startOfMonth = `${monthStr}-01`;
    const endOfMonth = `${monthStr}-31`; // sqlite between works correctly with text dates

    let query = `
      SELECT sa.*, s.name as shift_name, s.color, s.start_time, s.end_time, p.full_name as user_name
      FROM shift_assignments sa
      JOIN shifts s ON sa.shift_id = s.id
      JOIN profiles p ON sa.user_id = p.id
      WHERE s.shift_table_id = ? AND sa.date >= ? AND sa.date <= ?
    `;
    const bindings = [tableId, startOfMonth, endOfMonth];

    if (member && member.role === 'staff' && data.user.role !== 'superadmin' && table.is_shared === 0) {
      // If staff and table not shared, only see own assignments
      query += ` AND sa.user_id = ?`;
      bindings.push(userId);
    }

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

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
    const { shift_id, user_id, date, note } = body;
    if (!shift_id || !user_id || !date) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });

    const shift = await env.DB.prepare('SELECT shift_table_id FROM shifts WHERE id = ?').bind(shift_id).first();
    if (!shift) return new Response(JSON.stringify({ error: 'Shift not found' }), { status: 404 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift.shift_table_id, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    const assignmentId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO shift_assignments (id, shift_id, user_id, date, note)
      VALUES (?, ?, ?, ?, ?)
    `).bind(assignmentId, shift_id, user_id, date, note || '').run();

    // insert notification
    if (user_id !== userId) {
      await env.DB.prepare(`
        INSERT INTO notifications (id, user_id, type, shift_table_id, date, content)
        VALUES (?, ?, 'shift_added', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), 
        user_id, 
        shift.shift_table_id, 
        date, 
        `管理员已为您添加 ${date} 的排班`
      ).run();
    }

    return new Response(JSON.stringify({ id: assignmentId, success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: 'Already assigned for this shift on this day' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
