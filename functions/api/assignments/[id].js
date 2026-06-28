export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const assignmentId = params.id;
  const userId = data.user.sub;

  try {
    const assignment = await env.DB.prepare(`
      SELECT sa.*, s.shift_table_id 
      FROM shift_assignments sa
      JOIN shifts s ON sa.shift_id = s.id
      WHERE sa.id = ?
    `).bind(assignmentId).first();

    if (!assignment) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(assignment.shift_table_id, userId).first();
      if (!member || member.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    await env.DB.prepare('DELETE FROM shift_assignments WHERE id = ?').bind(assignmentId).run();

    // insert notification
    if (assignment.user_id !== userId) {
      await env.DB.prepare(`
        INSERT INTO notifications (id, user_id, type, shift_table_id, date, content)
        VALUES (?, ?, 'shift_removed', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), 
        assignment.user_id, 
        assignment.shift_table_id, 
        assignment.date, 
        `管理员已移除您 ${assignment.date} 的排班`
      ).run();
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
