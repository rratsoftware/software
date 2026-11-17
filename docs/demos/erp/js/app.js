/* Arranque del ERP demo: rutas, menú y contadores. */
(function () {
  'use strict';

  const E = window.ERP;
  const V = window.ERP_VISTAS;
  const nav = document.getElementById('nav');
  const backdrop = document.getElementById('nav-backdrop');

  E.load();

  document.getElementById('co-name').textContent = E.D.EMPRESA.nombre;
  document.getElementById('co-ruc').textContent = 'RUC ' + E.D.EMPRESA.ruc;
  const d = new Date();
  document.getElementById('bar-date').textContent = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  /* Borradores vacíos que el usuario abrió y dejó sin llenar */
  function limpiarBorradores(actual) {
    const S = E.S;
    const antes = S.ventas.length + S.compras.length;
    S.ventas = S.ventas.filter((v) => v.id === actual || !(v.estado === 'cot' && !v.cliente && !v.lineas.length));
    S.compras = S.compras.filter((c) => c.id === actual || !(c.estado === 'bor' && !c.prov && !c.lineas.length));
    if (S.ventas.length + S.compras.length !== antes) E.save();
  }

  function contadores() {
    const S = E.S;
    const set = (id, n) => { const el = document.getElementById(id); el.hidden = !n; el.textContent = n; };
    set('cnt-ventas', S.ventas.filter((v) => v.estado === 'ped').length);
    set('cnt-compras', S.compras.filter((c) => c.estado === 'env').length);
    const sm = E.stockMap();
    set('cnt-inv', S.productos.filter((p) => (sm[p.id] ? sm[p.id].total : 0) <= p.min).length);
  }

  function route() {
    const parts = (location.hash || '#/inicio').replace(/^#\/?/, '').split('/');
    let mod = parts[0] || 'inicio';
    const id = parts[1] ? decodeURIComponent(parts[1]) : '';
    if (!V[mod] || mod === 'UI') mod = 'inicio';
    limpiarBorradores(id);
    nav.querySelectorAll('a[data-mod]').forEach((a) => a.classList.toggle('is-on', a.dataset.mod === mod));
    document.body.classList.remove('nav-open');
    V[mod](id);
    contadores();
    const vw = document.getElementById('view');
    vw.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  /* Refresca contadores tras cualquier acción dentro de la vista */
  document.getElementById('view').addEventListener('click', () => setTimeout(contadores, 0));

  document.getElementById('nav-open').addEventListener('click', () => document.body.classList.add('nav-open'));
  backdrop.addEventListener('click', () => document.body.classList.remove('nav-open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });

  document.getElementById('demo-reset').addEventListener('click', async () => {
    if (!(await E.confirmar('Reiniciar demo', 'Se borrarán los cambios que hiciste y se cargarán los datos de ejemplo otra vez.', 'Reiniciar', true))) return;
    E.reset();
    E.toast('Demo reiniciada');
    if (location.hash === '#/inicio') route(); else location.hash = '#/inicio';
  });

  route();
})();
