export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const recordId = params.id;
  const userId = data.user.sub;

  try {
    const record = await env.DB.prepare('SELECT user_id, status, date FROM attendance_records WHERE id = ?').bind(recordId).first();
    if (!record) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    // For editing own record, it must be pending
    // For admin approving/rejecting, it will be handled in Day 7 (Out of MVP for now, but we'll add support)
    // Here we just support updating own record if pending
    if (record.user_id === userId) {
      if (record.status !== 'pending') return new Response(JSON.stringify({ error: 'Cannot edit processed record' }), { status: 400 });
      
      const body = await request.json();
      const updates = [];
      const bindings = [];

      ['preset_id', 'check_in_time', 'check_out_time', 'note'].forEach(key => {
        if (body[key] !== undefined) {
          updates.push(`${key} = ?`);
          bindings.push(body[key]);
        }
      });

      if (body.check_in_time && body.check_out_time) {
        const [inH, inM] = body.check_in_time.split(':').map(Number);
        const [outH, outM] = body.check_out_time.split(':').map(Number);
        let hours = (outH + outM / 60) - (inH + inM / 60);
        if (hours < 0) hours += 24;
        updates.push('actual_hours = ?');
        bindings.push(hours);
      }

      if (updates.length > 0) {
        bindings.push(recordId);
        await env.DB.prepare(`UPDATE attendance_records SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
      }

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Admin handling
    const url = new URL(request.url);
    const tableId = url.searchParams.get('shift_table_id');
    if (!tableId) return new Response(JSON.stringify({ error: 'Missing shift_table_id for admin action' }), { status: 400 });

    if (data.user.role !== 'superadmin') {
      const member = await env.DB.prepare('SELECT role FROM shift_table_members WHERE shift_table_id = ? AND user_id = ?').bind(tableId, userId).first();
      if (!member || member.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    if (body.status === 'approved' || body.status === 'rejected') {
      const rejectionReason = body.rejection_reason || null;
      await env.DB.prepare(`
        UPDATE attendance_records 
        SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(body.status, rejectionReason, userId, recordId).run();

      // Send notification
      const content = body.status === 'approved' ? `您 ${record.date} 的出勤已通过审核` : `您 ${record.date} 的出勤被驳回: ${rejectionReason}`;
      await env.DB.prepare(`
        INSERT INTO notifications (id, user_id, type, shift_table_id, date, content)
        VALUES (?, ?, 'attendance_update', ?, ?, ?)
      `).bind(crypto.randomUUID(), record.user_id, tableId, record.date, content).run();

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid operation' }), { status: 400 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const recordId = params.id;
  const userId = data.user.sub;

  try {
    const record = await env.DB.prepare('SELECT user_id, status FROM attendance_records WHERE id = ?').bind(recordId).first();
    if (!record || record.user_id !== userId) return new Response(JSON.stringify({ error: 'Not found or forbidden' }), { status: 404 });
    
    if (record.status !== 'pending') return new Response(JSON.stringify({ error: 'Cannot delete processed record' }), { status: 400 });

    await env.DB.prepare('DELETE FROM attendance_records WHERE id = ?').bind(recordId).run();
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
