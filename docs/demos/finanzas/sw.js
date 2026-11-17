/* Trabajador de la app: guarda los archivos para abrirla rápido y sin internet */
var CACHE = 'finanzas-v1';
var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/finanzas.css',
  './js/datos.js',
  './js/libro.js',
  './js/app.js',
  './js/instalar.js',
  './images/favicon.svg',
  './images/icono-192.png',
  './images/icono-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (k) { return k.indexOf('finanzas-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Primero intenta la red (así siempre ves la última versión); si no hay internet, usa lo guardado */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var propio = url.origin === self.location.origin;
  var fuente = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host);
  if (!propio && !fuente) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: propio }).then(function (r) {
        return r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
