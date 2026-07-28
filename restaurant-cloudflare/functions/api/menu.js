export async function onRequestGet(context) {
  const endpoint = context.env.GOOGLE_MENU_ENDPOINT;
  if (!endpoint) return json({error:'GOOGLE_MENU_ENDPOINT is not configured'}, 503, 60);
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/menu-cache-v1', context.request.url), {method:'GET'});
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const upstream = await fetch(endpoint, {headers:{'Accept':'application/json'}, redirect:'follow'});
    if (!upstream.ok) throw new Error(`Google endpoint returned ${upstream.status}`);
    const payload = await upstream.json();
    if (!payload || !payload.menus) throw new Error('Invalid menu payload');
    const response = json(payload, 200, 300);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error('Menu proxy error', error);
    return json({error:'Menu source unavailable'}, 502, 60);
  }
}
function json(value, status=200, maxAge=300) {
  return new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':`public, max-age=${maxAge}`,'x-content-type-options':'nosniff'}});
}