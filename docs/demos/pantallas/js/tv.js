/* Reproductor del TV: muestra el menú y las promociones y se actualiza solo. */
(function () {
  'use strict';

  const P = window.PANT;
  const { esc, precio } = P;
  const params = new URLSearchParams(location.search);
  const pid = params.get('p') || 'caja';
  const preview = params.get('preview') === '1';
  const stage = document.getElementById('stage');
  const hint = document.getElementById('hint');

  document.body.classList.toggle('is-preview', preview);
  document.body.classList.toggle('is-tv', !preview);

  let idx = 0;
  let timer = 0;
  let firma = '';

  /* Escala el lienzo de 1920×1080 a la ventana, sin deformarlo */
  function escalar() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  function pantalla() { return P.S.pantallas.find((x) => x.id === pid) || P.S.pantallas[0]; }

  function slideHtml(p, i) {
    const t = P.tema(p.tema);
    return '<article class="slide' + (i === idx ? ' is-on' : '') + '" style="--bg:' + t.bg + ';--fg:' + t.fg + ';--acc:' + t.acc + '">' +
      '<div class="slide__text"><p class="slide__kicker">Promoción</p><h3>' + esc(p.titulo) + '</h3><p>' + esc(p.texto) + '</p>' +
      (p.precio ? '<div class="slide__price">' + precio(p.precio) + (p.antes ? '<s>Antes ' + precio(p.antes) + '</s>' : '') + '</div>' : '') +
      '</div><img class="slide__img" src="' + P.imagen(p.img) + '" alt=""></article>';
  }

  function menuHtml(bloque) {
    if (!bloque) return '<div class="menu"><section class="cat"><h2>Cerrado</h2><p class="item__desc">Te esperamos mañana.</p></section></div>';
    return '<div class="menu">' + bloque.cats.map((cid) => {
      const c = P.S.categorias.find((x) => x.id === cid);
      if (!c) return '';
      return '<section class="cat"><h2>' + esc(c.nombre) + '</h2>' + c.items.slice(0, 7).map((it) =>
        '<div class="item' + (it.agotado ? ' is-out' : '') + '"><div class="item__row"><span class="item__name">' + esc(it.nombre) + '</span>' +
        '<span class="item__dots"></span><span class="item__price">' + precio(it.precio) + '</span></div>' +
        (it.desc || it.agotado ? '<p class="item__desc">' + (it.agotado ? '<span class="tag-out">Agotado</span>' : '') + esc(it.desc) + '</p>' : '') + '</div>').join('') + '</section>';
    }).join('') + '</div>';
  }

  function reloj() {
    const d = P.ahora();
    return P.pad(d.getHours()) + ':' + P.pad(d.getMinutes());
  }

  function render() {
    const pt = pantalla();
    const promos = P.promosActivas();
    const bloque = P.bloqueActual();
    if (idx >= promos.length) idx = 0;
    const N = P.D.NEGOCIO;

    if (pt.modo === 'menu') {
      stage.innerHTML =
        '<div class="board' + (bloque && bloque.cats.length >= 3 ? ' board--3' : '') + '"><header class="board__head"><div class="brand"><h1>' + esc(N.nombre) + '</h1><p>' + esc(N.sub) + '</p></div>' +
          '<div class="block-name"><b>' + (bloque ? esc(bloque.nombre) : 'Cerrado') + '</b><span>' + (bloque ? 'Hasta las ' + bloque.hasta : '') + '</span></div>' +
          '<div class="clock" data-clock>' + reloj() + '</div></header>' +
        '<div class="board__body">' + menuHtml(bloque) +
          '<aside class="side">' + (promos.length ? '<div class="slides">' + promos.map(slideHtml).join('') + '</div><div class="progress" data-prog></div>' : slideHtml({ titulo: 'Bienvenidos', texto: N.dir, precio: 0, img: 'cafe', tema: 'tierra' }, idx)) + '</aside>' +
        '</div>' +
        '<div class="ticker"><p class="ticker__text" data-tick>' + esc(P.S.mensaje) + '</p></div></div>';
      const tk = stage.querySelector('[data-tick]');
      tk.style.animationDuration = Math.max(18, (P.S.mensaje || '').length * 0.22) + 's';
    } else {
      stage.innerHTML = promos.length
        ? '<div class="full"><div class="slides">' + promos.map(slideHtml).join('') + '</div>' +
          '<div class="full__corner"><b>' + esc(N.nombre) + '</b><span data-clock>' + reloj() + '</span></div>' +
          '<div class="full__dots">' + promos.map((p, i) => '<i class="' + (i === idx ? 'is-on' : '') + '"></i>').join('') + '</div>' +
          '<div class="progress" data-prog></div></div>'
        : '<div class="welcome"><h1>' + esc(N.nombre) + '</h1><p>' + esc(N.sub) + ' · ' + esc(N.dir) + '</p></div>';
    }
    programar(promos);
  }

  function programar(promos) {
    clearTimeout(timer);
    const prog = stage.querySelector('[data-prog]');
    if (!promos.length) return;
    const p = promos[idx];
    const seg = Math.max(3, Number(p.seg) || 8);
    if (prog) {
      const t = P.tema(p.tema);
      prog.style.setProperty('--acc', t.acc);
      prog.classList.remove('is-run');
      void prog.offsetWidth;
      prog.style.animationDuration = seg + 's';
      prog.classList.add('is-run');
    }
    if (promos.length < 2) return;
    timer = setTimeout(() => {
      idx = (idx + 1) % promos.length;
      const slides = stage.querySelectorAll('.slide');
      slides.forEach((s, i) => s.classList.toggle('is-on', i === idx));
      stage.querySelectorAll('.full__dots i').forEach((d, i) => d.classList.toggle('is-on', i === idx));
      programar(promos);
    }, seg * 1000);
  }

  /* Solo se vuelve a dibujar si cambió lo que debe mostrarse */
  function firmaActual() {
    const b = P.bloqueActual();
    return JSON.stringify([P.S.rev || 0, pantalla().modo, b && b.id, P.promosActivas().map((p) => p.id)]);
  }
  function revisar(forzar) {
    const f = firmaActual();
    if (forzar || f !== firma) { firma = f; render(); }
    const r = reloj();
    stage.querySelectorAll('[data-clock]').forEach((el) => { if (el.textContent !== r) el.textContent = r; });
  }

  P.onChange(() => revisar(true));
  window.addEventListener('resize', escalar);
  setInterval(() => revisar(false), 5000);

  if (!preview) {
    P.latido(pid);
    setInterval(() => P.latido(pid), 4000);
    document.title = pantalla().nombre + ' · ' + P.D.NEGOCIO.nombre;
    setTimeout(() => hint.classList.add('is-off'), 5000);
    document.addEventListener('click', () => {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    });
  }

  escalar();
  revisar(true);
})();
