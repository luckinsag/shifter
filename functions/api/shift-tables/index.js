export async function onRequestGet(context) {
  const { env, data } = context;
  const userId = data.user.sub;

  try {
    const { results } = await env.DB.prepare(`
      SELECT st.*, stm.role as my_role,
        (SELECT COUNT(*) FROM shift_table_members WHERE shift_table_id = st.id) as member_count
      FROM shift_tables st
      JOIN shift_table_members stm ON st.id = stm.shift_table_id
      WHERE stm.user_id = ?
      ORDER BY st.created_at DESC
    `).bind(userId).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const userId = data.user.sub;
  
  try {
    const body = await request.json();
    if (!body.name || !body.start_date || !body.end_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const tableId = crypto.randomUUID();
    
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO shift_tables (id, name, description, start_date, end_date, is_shared, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(tableId, body.name, body.description || '', body.start_date, body.end_date, body.is_shared ? 1 : 0, userId),
      
      env.DB.prepare(`
        INSERT INTO shift_table_members (shift_table_id, user_id, role)
        VALUES (?, ?, 'admin')
      `).bind(tableId, userId)
    ]);

    return new Response(JSON.stringify({ id: tableId, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
