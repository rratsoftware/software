/* Estado compartido entre el panel y los TVs.
   En la demo se guarda en este navegador y se avisa a las otras pestañas;
   en la versión real esto vive en el servidor. */
(function () {
  'use strict';

  const D = window.PANT_DATA;
  const KEY = 'rratsoft-pantallas-v1';
  const HB = 'rratsoft-pantallas-latido';
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel('rratsoft-pantallas') : null;
  const subs = [];

  const clone = (o) => JSON.parse(JSON.stringify(o));
  let S = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const st = JSON.parse(raw); if (st && st.v === 1) { S = st; return S; } }
    } catch (e) { /* sin almacenamiento */ }
    S = clone(D.ESTADO_INICIAL);
    // Si se abre la demo de noche o de madrugada, el local estaría cerrado:
    // se empieza simulando la hora del almuerzo para que se vea el menú.
    if (!bloqueActual(new Date())) S.simHora = '13:00';
    return S;
  }

  function save() {
    S.rev = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ }
    if (canal) canal.postMessage({ t: 'estado', rev: S.rev });
  }

  function reset() {
    S = clone(D.ESTADO_INICIAL);
    save();
  }

  function refrescar() { load(); subs.forEach((f) => f(S)); }
  function onChange(fn) { subs.push(fn); }

  if (canal) canal.onmessage = (e) => { if (e.data && e.data.t === 'estado') refrescar(); };
  window.addEventListener('storage', (e) => { if (e.key === KEY) refrescar(); });

  /* ---------- Hora (real o simulada desde el panel) ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  function ahora() {
    const d = new Date();
    if (S && S.simHora) {
      const [h, m] = S.simHora.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }
  const hhmm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const enRango = (t, a, b) => a <= b ? t >= a && t < b : t >= a || t < b;

  function bloqueActual(d) {
    const t = hhmm(d || ahora());
    return S.bloques.find((b) => enRango(t, b.desde, b.hasta)) || null;
  }

  function promosActivas(d) {
    d = d || ahora();
    const t = hhmm(d), dia = d.getDay();
    return S.promos.filter((p) => p.activa && p.dias.includes(dia) && enRango(t, p.desde, p.hasta));
  }

  /* ---------- Latido de los TVs (para saber si están en línea) ---------- */
  function latido(id) {
    try {
      const hb = JSON.parse(localStorage.getItem(HB) || '{}');
      hb[id] = Date.now();
      localStorage.setItem(HB, JSON.stringify(hb));
    } catch (e) { /* ignorar */ }
  }
  function enLinea(id) {
    try {
      const hb = JSON.parse(localStorage.getItem(HB) || '{}');
      return hb[id] && Date.now() - hb[id] < 12000;
    } catch (e) { return false; }
  }

  const imagen = (id) => (D.IMAGENES.find((i) => i.id === id) || D.IMAGENES[0]).src;
  const tema = (id) => D.TEMAS.find((t) => t.id === id) || D.TEMAS[0];
  const precio = (n) => 'S/ ' + Number(n || 0).toFixed(2).replace(/\.00$/, '');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  load();

  window.PANT = {
    D, get S() { return S; }, load, save, reset, onChange,
    ahora, hhmm, bloqueActual, promosActivas, latido, enLinea,
    imagen, tema, precio, esc, uid, pad
  };
})();
