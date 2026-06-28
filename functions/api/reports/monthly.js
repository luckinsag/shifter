export async function onRequestGet(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);
  const tableId = url.searchParams.get('shift_table_id');
  const monthStr = url.searchParams.get('month'); // "YYYY-MM"
  const userId = data.user.sub;

  if (!tableId || !monthStr) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });

  try {
    const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
    if (!member && data.user.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const startOfMonth = `${monthStr}-01`;
    const endOfMonth = `${monthStr}-31`;

    const isAdmin = data.user.role === 'superadmin' || member.role === 'admin';

    let query = `
      SELECT ar.user_id, p.full_name, COUNT(ar.id) as total_days, SUM(ar.actual_hours) as total_hours
      FROM attendance_records ar
      JOIN profiles p ON ar.user_id = p.id
      WHERE ar.shift_table_id = ? AND ar.date >= ? AND ar.date <= ?
    `;
    const bindings = [tableId, startOfMonth, endOfMonth];

    if (!isAdmin) {
      // Staff only sees their own summary
      query += ` AND ar.user_id = ?`;
      bindings.push(userId);
    }
    
    query += ` GROUP BY ar.user_id, p.full_name`;

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    // Calculate global stats for admin
    let summary = { total_staff: results.length, total_days: 0, total_hours: 0 };
    results.forEach(row => {
      summary.total_days += row.total_days;
      summary.total_hours += row.total_hours;
    });

    return new Response(JSON.stringify({ summary, details: results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
