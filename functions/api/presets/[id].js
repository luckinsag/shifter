export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const userId = data.user.sub;
  const presetId = params.id;

  try {
    const preset = await env.DB.prepare('SELECT user_id FROM staff_shift_presets WHERE id = ?').bind(presetId).first();
    if (!preset || preset.user_id !== userId) return new Response(JSON.stringify({ error: 'Not found or forbidden' }), { status: 404 });

    const body = await request.json();
    const isDefault = body.is_default !== undefined ? (body.is_default ? 1 : 0) : undefined;

    const queries = [];
    if (isDefault === 1) {
      queries.push(env.DB.prepare('UPDATE staff_shift_presets SET is_default = 0 WHERE user_id = ?').bind(userId));
    }

    const updates = [];
    const bindings = [];

    ['preset_name', 'display_name', 'start_time', 'end_time'].forEach(key => {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        bindings.push(body[key]);
      }
    });

    if (isDefault !== undefined) {
      updates.push('is_default = ?');
      bindings.push(isDefault);
    }

    if (updates.length > 0) {
      bindings.push(presetId);
      queries.push(env.DB.prepare(`UPDATE staff_shift_presets SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings));
    }

    if (queries.length > 0) {
      await env.DB.batch(queries);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const userId = data.user.sub;
  const presetId = params.id;

  try {
    const preset = await env.DB.prepare('SELECT user_id FROM staff_shift_presets WHERE id = ?').bind(presetId).first();
    if (!preset || preset.user_id !== userId) return new Response(JSON.stringify({ error: 'Not found or forbidden' }), { status: 404 });

    await env.DB.prepare('DELETE FROM staff_shift_presets WHERE id = ?').bind(presetId).run();
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
