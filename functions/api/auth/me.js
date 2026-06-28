export async function onRequest(context) {
  // _middleware.js will inject context.data.user
  const user = context.data.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' }
  });
}
