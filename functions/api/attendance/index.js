export async function onRequestGet(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');
  const monthStr = url.searchParams.get('month'); // "YYYY-MM"
  let targetUserId = url.searchParams.get('user_id');
  const userId = data.user.sub;

  if (!tableId || !monthStr) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    const table = await env.DB.prepare('SELECT is_shared FROM shift_tables WHERE id = ?').bind(tableId).first();

    if (!member && data.user.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const startOfMonth = `${monthStr}-01`;
    const endOfMonth = `${monthStr}-31`;

    let query = `
      SELECT ar.*, p.full_name as user_name, sp.display_name as preset_name
      FROM attendance_records ar
      JOIN profiles p ON ar.user_id = p.id
      LEFT JOIN staff_shift_presets sp ON ar.preset_id = sp.id
      WHERE ar.shift_table_id = ? AND ar.date >= ? AND ar.date <= ?
    `;
    const bindings = [tableId, startOfMonth, endOfMonth];

    if (member && member.role === 'staff' && data.user.role !== 'superadmin') {
      if (table.is_shared === 0) {
        // Only see own records if table not shared
        query += ` AND ar.user_id = ?`;
        bindings.push(userId);
      } else if (targetUserId) {
        // If shared and asking for specific user
        query += ` AND ar.user_id = ?`;
        bindings.push(targetUserId);
      }
    } else if (targetUserId) {
       // admin requesting specific user
       query += ` AND ar.user_id = ?`;
       bindings.push(targetUserId);
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
    const { shift_table_id, date, preset_id, check_in_time, check_out_time, note } = body;
    
    if (!shift_table_id || !date || !check_in_time || !check_out_time) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(shift_table_id, userId).first();
    if (!member && data.user.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const id = crypto.randomUUID();
    
    // calculate actual hours
    const [inH, inM] = check_in_time.split(':').map(Number);
    const [outH, outM] = check_out_time.split(':').map(Number);
    let hours = (outH + outM / 60) - (inH + inM / 60);
    if (hours < 0) hours += 24; // overnight shift

    await env.DB.prepare(`
      INSERT INTO attendance_records (id, shift_table_id, user_id, date, preset_id, check_in_time, check_out_time, actual_hours, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, shift_table_id, userId, date, preset_id || null, check_in_time, check_out_time, hours, note || '').run();

    return new Response(JSON.stringify({ id, success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: 'Attendance record already exists for this date' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
