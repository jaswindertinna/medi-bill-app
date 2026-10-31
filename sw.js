/* MCLAINE offline helper: always tries the network first (so you get the newest version when online),
   and falls back to the last saved copy when the internet is off, so the app still opens. */
const CACHE = 'mclaine-offline-v1';
const HOSTS = ['www.gstatic.com','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install', ()=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });
async function handle(req){
  const cache = await caches.open(CACHE);
  try{
    const res = await Promise.race([ fetch(req), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), 6000)) ]);
    if(res && (res.ok || res.type==='opaque')) cache.put(req, res.clone()).catch(()=>{});
    return res;
  }catch(err){
    const hit = await cache.match(req, { ignoreSearch: req.mode==='navigate' });
    if(hit) return hit;
    if(req.mode==='navigate'){
      const idx = (await cache.match('./index.html')) || (await cache.match('./'));
      if(idx) return idx;
    }
    throw err;
  }
}
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const u = new URL(req.url);
  if(u.origin !== self.location.origin && !HOSTS.includes(u.hostname)) return;
  e.respondWith(handle(req));
});
