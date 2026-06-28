export async function onRequestGet(context) {
  const { env, data } = context;
  const userId = data.user.sub;

  try {
    const { results } = await env.DB.prepare('SELECT * FROM staff_shift_presets WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
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
    if (!body.preset_name || !body.start_time || !body.end_time) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const presetId = crypto.randomUUID();
    const isDefault = body.is_default ? 1 : 0;

    const queries = [];
    if (isDefault) {
      queries.push(env.DB.prepare('UPDATE staff_shift_presets SET is_default = 0 WHERE user_id = ?').bind(userId));
    }

    queries.push(
      env.DB.prepare(`
        INSERT INTO staff_shift_presets (id, user_id, preset_name, display_name, start_time, end_time, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(presetId, userId, body.preset_name, body.display_name || '', body.start_time, body.end_time, isDefault)
    );

    await env.DB.batch(queries);

    return new Response(JSON.stringify({ id: presetId, success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
