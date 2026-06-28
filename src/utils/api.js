export async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  
  if (res.status === 401) {
    if (window.location.pathname !== '/') {
      window.location.href = '/'
    }
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) {
    let errMessage = '请求失败';
    try {
      const err = await res.json();
      errMessage = err.error || errMessage;
    } catch (e) {
      // not json
    }
    throw new Error(errMessage);
  }
  
  if (res.status === 204) return null;
  return res.json();
}
