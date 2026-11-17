/* Panel del dueño: edita menú, promociones, horarios y pantallas. */
(function () {
  'use strict';

  const P = window.PANT;
  const D = P.D;
  const { esc, precio } = P;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const pane = $('#pane');
  const DIAS = [['1', 'Lu'], ['2', 'Ma'], ['3', 'Mi'], ['4', 'Ju'], ['5', 'Vi'], ['6', 'Sá'], ['0', 'Do']];
  let tab = 'menu';
  let livePid = 'caja';

  $('#biz-name').textContent = D.NEGOCIO.nombre;

  /* ---------- Guardar con aviso ---------- */
  let saveTimer = 0;
  const sync = $('#sync');
  function guardar(inmediato) {
    sync.classList.add('is-busy');
    sync.lastElementChild.textContent = 'Guardando…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      P.save();
      sync.classList.remove('is-busy');
      sync.lastElementChild.textContent = 'Todo sincronizado';
      infoVivo();
    }, inmediato ? 0 : 450);
  }

  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* ---------- Miniatura de una promoción ---------- */
  function mini(p) {
    const t = P.tema(p.tema);
    return '<div class="mini"><div class="mini__slide" style="--bg:' + t.bg + ';--fg:' + t.fg + ';--acc:' + t.acc + '"><div>' +
      '<p class="mini__kicker">Promoción</p><h4>' + esc(p.titulo || 'Título') + '</h4><p>' + esc(p.texto || '') + '</p>' +
      (p.precio ? '<p class="mini__price">' + precio(p.precio) + (p.antes ? '<s>Antes ' + precio(p.antes) + '</s>' : '') + '</p>' : '') +
      '</div><img src="' + P.imagen(p.img) + '" alt=""></div></div>';
  }

  function textoDias(d) {
    if (d.length === 7) return 'Todos los días';
    if (d.length === 5 && [1, 2, 3, 4, 5].every((x) => d.includes(x))) return 'Lunes a viernes';
    return DIAS.filter((x) => d.includes(Number(x[0]))).map((x) => x[1]).join(', ');
  }
  const textoHora = (p) => (p.desde === '00:00' && p.hasta === '23:59') ? 'todo el día' : p.desde + '–' + p.hasta;

  /* ================= Menú ================= */
  function vistaMenu() {
    pane.innerHTML = '<div class="pane-head"><div><h2>Menú y precios</h2><p>Cambia un precio o marca algo como agotado: el TV se actualiza en segundos.</p></div></div>' +
      P.S.categorias.map((c) => '<section class="card" data-cat="' + c.id + '"><div class="card__head"><h3>' + esc(c.nombre) + '</h3><span>' + c.items.length + ' productos · ' + enBloques(c.id) + '</span></div>' +
        '<ul class="rows">' + c.items.map((it) => fila(it)).join('') + '</ul>' +
        '<div class="card__foot"><button type="button" class="link-btn" data-add><i class="ti ti-plus" aria-hidden="true"></i> Agregar producto</button></div></section>').join('');
  }
  function enBloques(cid) {
    const b = P.S.bloques.filter((x) => x.cats.includes(cid)).map((x) => x.nombre);
    return b.length ? 'se muestra en ' + b.join(', ').toLowerCase() : 'no se muestra en ningún horario';
  }
  function fila(it) {
    return '<li class="rowi' + (it.agotado ? ' is-out' : '') + '" data-item="' + it.id + '">' +
      '<input class="inp inp--name" data-k="nombre" value="' + esc(it.nombre) + '" maxlength="30" aria-label="Nombre">' +
      '<input class="inp inp--desc" data-k="desc" value="' + esc(it.desc) + '" maxlength="40" placeholder="Descripción (opcional)" aria-label="Descripción">' +
      '<label class="price"><span>S/</span><input class="inp" data-k="precio" type="number" min="0" step="0.5" value="' + it.precio + '" aria-label="Precio"></label>' +
      '<label class="switch"><input type="checkbox" data-k="agotado"' + (it.agotado ? ' checked' : '') + '><span class="switch__track"></span>Agotado</label>' +
      '<button type="button" class="icon-btn icon-btn--danger" data-del aria-label="Eliminar producto"><i class="ti ti-trash"></i></button></li>';
  }
  function itemDe(el) {
    const c = P.S.categorias.find((x) => x.id === el.closest('[data-cat]').dataset.cat);
    const li = el.closest('[data-item]');
    return { c, li, it: li ? c.items.find((x) => x.id === li.dataset.item) : null };
  }

  /* ================= Promociones ================= */
  function vistaPromos() {
    const activas = P.promosActivas().map((p) => p.id);
    pane.innerHTML = '<div class="pane-head"><div><h2>Promociones</h2><p>Cada promoción sale solo en los días y horas que elijas.</p></div>' +
      '<button type="button" class="btn btn--accent" data-new><i class="ti ti-plus" aria-hidden="true"></i> Nueva promoción</button></div>' +
      '<div class="promos">' + P.S.promos.map((p) => {
        const est = !p.activa ? ['off', 'Pausada'] : activas.includes(p.id) ? ['on', 'En pantalla ahora'] : ['prog', 'Programada'];
        return '<article class="promo' + (p.activa ? '' : ' is-off') + '" data-promo="' + p.id + '"><div class="promo__thumb">' + mini(p) + '</div>' +
          '<div class="promo__body"><span class="pill pill--' + est[0] + '">' + est[1] + '</span><h3>' + esc(p.titulo) + '</h3>' +
          '<p class="promo__meta">' + textoDias(p.dias) + ' · ' + textoHora(p) + ' · ' + p.seg + ' s</p></div>' +
          '<div class="promo__foot"><label class="switch switch--ok"><input type="checkbox" data-toggle' + (p.activa ? ' checked' : '') + '><span class="switch__track"></span>' + (p.activa ? 'Activa' : 'Pausada') + '</label>' +
          '<button type="button" class="icon-btn" data-edit aria-label="Editar"><i class="ti ti-pencil"></i></button>' +
          '<button type="button" class="icon-btn icon-btn--danger" data-del aria-label="Eliminar"><i class="ti ti-trash"></i></button></div></article>';
      }).join('') + '</div>';
  }

  const modal = $('#promo-modal');
  const form = $('#promo-form');
  let editando = null;
  $('#pm-img').innerHTML = D.IMAGENES.map((i) => '<option value="' + i.id + '">' + esc(i.nombre) + '</option>').join('');
  $('#pm-tema').innerHTML = D.TEMAS.map((t) => '<option value="' + t.id + '">' + esc(t.nombre) + '</option>').join('');
  $('#pm-days').innerHTML = DIAS.map((d) => '<label><input type="checkbox" name="dia" value="' + d[0] + '">' + d[1] + '</label>').join('');

  function leerForm() {
    const f = new FormData(form);
    return {
      titulo: (f.get('titulo') || '').trim(), texto: (f.get('texto') || '').trim(),
      precio: Number(f.get('precio')) || 0, antes: Number(f.get('antes')) || 0,
      desde: f.get('desde'), hasta: f.get('hasta'), dias: f.getAll('dia').map(Number),
      img: f.get('img'), tema: f.get('tema'), seg: Math.min(30, Math.max(3, Number(f.get('seg')) || 8))
    };
  }
  function abrirPromo(p) {
    editando = p ? p.id : null;
    const d = p || { titulo: '', texto: '', precio: '', antes: '', desde: '00:00', hasta: '23:59', dias: [0, 1, 2, 3, 4, 5, 6], img: 'cafe', tema: 'tierra', seg: 8 };
    $('#pm-title').textContent = p ? 'Editar promoción' : 'Nueva promoción';
    form.titulo.value = d.titulo; form.texto.value = d.texto;
    form.precio.value = d.precio || ''; form.antes.value = d.antes || '';
    form.desde.value = d.desde; form.hasta.value = d.hasta;
    form.img.value = d.img; form.tema.value = d.tema; form.seg.value = d.seg;
    $$('input[name=dia]', form).forEach((c) => { c.checked = d.dias.includes(Number(c.value)); });
    $('#pm-note').textContent = '';
    $('#pm-mini').innerHTML = mini(Object.assign({}, d));
    modal.showModal();
    form.titulo.focus();
  }
  form.addEventListener('input', () => { $('#pm-mini').innerHTML = mini(leerForm()); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = leerForm();
    const note = $('#pm-note');
    if (!d.titulo) { note.textContent = 'Escribe un título.'; return; }
    if (!d.dias.length) { note.textContent = 'Elige al menos un día.'; return; }
    if (!d.desde || !d.hasta || d.desde === d.hasta) { note.textContent = 'Revisa el horario: la hora de inicio y fin no pueden ser iguales.'; return; }
    if (d.antes && d.precio && d.antes <= d.precio) { note.textContent = 'El precio de "antes" debe ser mayor al precio de la promoción.'; return; }
    if (editando) Object.assign(P.S.promos.find((x) => x.id === editando), d);
    else P.S.promos.unshift(Object.assign({ id: P.uid('pr'), activa: true }, d));
    modal.close();
    guardar(true);
    toast(editando ? 'Promoción actualizada' : 'Promoción creada');
    vistaPromos();
  });
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', () => modal.close()));

  /* ================= Horarios ================= */
  function vistaHorarios() {
    const b = P.bloqueActual();
    pane.innerHTML = '<div class="pane-head"><div><h2>Horarios del menú</h2><p>El TV de la caja cambia solo de menú según la hora.</p></div></div>' +
      P.S.bloques.map((bl) => '<section class="card" data-bloque="' + bl.id + '"><div class="bloque">' +
        '<label class="field">Nombre<input data-k="nombre" value="' + esc(bl.nombre) + '" maxlength="20"></label>' +
        '<label class="field">Desde<input data-k="desde" type="time" value="' + bl.desde + '"></label>' +
        '<label class="field">Hasta<input data-k="hasta" type="time" value="' + bl.hasta + '"></label>' +
        '<div class="bloque__cats">' + P.S.categorias.map((c) => '<label class="chip"><input type="checkbox" data-cat="' + c.id + '"' + (bl.cats.includes(c.id) ? ' checked' : '') + '>' + esc(c.nombre) + '</label>').join('') + '</div>' +
        '</div></section>').join('') +
      '<p class="note"><i class="ti ti-info-circle" aria-hidden="true"></i>Ahora está activo: <b>' + (b ? esc(b.nombre) : 'ningún horario (local cerrado)') + '</b>. Usa “Hora del local” al costado para ver cómo cambia el TV.</p>';
  }

  /* ================= Pantallas ================= */
  function vistaPantallas() {
    pane.innerHTML = '<div class="pane-head"><div><h2>Pantallas</h2><p>Cada TV del local muestra su propio contenido.</p></div></div>' +
      '<div class="screens">' + P.S.pantallas.map((s) => '<section class="screen" data-scr="' + s.id + '">' +
        '<div class="screen__top"><span class="screen__icon"><i class="ti ti-device-tv" aria-hidden="true"></i></span><div><h3>' + esc(s.nombre) + '</h3><p>' + esc(s.lugar) + '</p></div>' +
        '<span class="status" data-status="' + s.id + '">Sin conectar</span></div>' +
        '<label class="field">Qué muestra<select data-k="modo"><option value="menu"' + (s.modo === 'menu' ? ' selected' : '') + '>Menú con promociones al costado</option><option value="promos"' + (s.modo === 'promos' ? ' selected' : '') + '>Solo promociones, a pantalla completa</option></select></label>' +
        '<a class="btn btn--sm" href="tv.html?p=' + s.id + '" target="_blank" rel="noopener"><i class="ti ti-external-link" aria-hidden="true"></i> Abrir esta pantalla</a></section>').join('') + '</div>' +
      '<section class="card"><div class="card__head"><h3>Mensaje que corre abajo</h3><span>Solo en el TV con menú</span></div><div class="bloque" style="grid-template-columns:1fr">' +
        '<label class="field">Texto<textarea id="msg" maxlength="180">' + esc(P.S.mensaje) + '</textarea></label></div></section>' +
      '<section class="card"><div class="card__head"><h3>Cómo se instala en el local</h3></div><div class="bloque" style="grid-template-columns:1fr"><ol class="steps">' +
        '<li>Conecta un TV box o stick (Android TV, Fire TV o Google TV) al televisor por HDMI.</li>' +
        '<li>Abre el navegador del TV y entra al enlace de la pantalla, por ejemplo <code>…/tv.html?p=caja</code>.</li>' +
        '<li>Ponlo en pantalla completa y déjalo encendido. Si se cae el internet, sigue mostrando lo último.</li>' +
        '<li>Desde ese momento todo se cambia aquí, desde el celular o la computadora.</li></ol></div></section>';
    estados();
  }

  function estados() {
    $$('[data-status]').forEach((el) => {
      const on = P.enLinea(el.dataset.status);
      el.classList.toggle('is-on', on);
      el.textContent = on ? 'En línea' : 'Sin conectar';
    });
  }
  setInterval(estados, 3000);

  /* ================= Eventos del panel ================= */
  const VISTAS = { menu: vistaMenu, promos: vistaPromos, horarios: vistaHorarios, pantallas: vistaPantallas };
  function mostrar(t) {
    tab = t;
    $$('.tabs__btn').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === t));
    VISTAS[t]();
  }
  $$('.tabs__btn').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.tab)));

  pane.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (tab === 'menu' && k && k !== 'agotado') {
      const { it } = itemDe(e.target);
      it[k] = k === 'precio' ? Math.max(0, Number(e.target.value) || 0) : e.target.value;
      guardar();
    } else if (tab === 'horarios' && k === 'nombre') {
      P.S.bloques.find((b) => b.id === e.target.closest('[data-bloque]').dataset.bloque).nombre = e.target.value;
      guardar();
    } else if (tab === 'pantallas' && e.target.id === 'msg') {
      P.S.mensaje = e.target.value; guardar();
    }
  });

  pane.addEventListener('change', (e) => {
    const k = e.target.dataset.k;
    if (tab === 'menu' && k === 'agotado') {
      const { it, li } = itemDe(e.target);
      it.agotado = e.target.checked;
      li.classList.toggle('is-out', it.agotado);
      guardar(true);
      toast(it.nombre + (it.agotado ? ' marcado como agotado' : ' disponible otra vez'));
    } else if (tab === 'promos' && e.target.matches('[data-toggle]')) {
      const p = P.S.promos.find((x) => x.id === e.target.closest('[data-promo]').dataset.promo);
      p.activa = e.target.checked;
      guardar(true); vistaPromos();
    } else if (tab === 'horarios') {
      const bl = P.S.bloques.find((b) => b.id === e.target.closest('[data-bloque]').dataset.bloque);
      if (k === 'desde' || k === 'hasta') { if (e.target.value) bl[k] = e.target.value; }
      if (e.target.dataset.cat) {
        const c = e.target.dataset.cat;
        bl.cats = e.target.checked ? bl.cats.concat(c).filter((x, i, a) => a.indexOf(x) === i) : bl.cats.filter((x) => x !== c);
        bl.cats.sort((a, b) => P.S.categorias.findIndex((x) => x.id === a) - P.S.categorias.findIndex((x) => x.id === b));
        if (bl.cats.length > 3) { toast('Máximo 3 categorías por horario para que se lea bien'); e.target.checked = false; bl.cats = bl.cats.filter((x) => x !== c); return; }
      }
      guardar(true); vistaHorarios();
    } else if (tab === 'pantallas' && k === 'modo') {
      P.S.pantallas.find((s) => s.id === e.target.closest('[data-scr]').dataset.scr).modo = e.target.value;
      guardar(true); toast('Pantalla actualizada');
    }
  });

  pane.addEventListener('click', (e) => {
    if (tab === 'menu') {
      if (e.target.closest('[data-add]')) {
        const c = P.S.categorias.find((x) => x.id === e.target.closest('[data-cat]').dataset.cat);
        c.items.push({ id: P.uid('i'), nombre: 'Nuevo producto', desc: '', precio: 0, agotado: false });
        guardar(true); vistaMenu();
        const ins = $$('[data-cat="' + c.id + '"] .inp--name');
        const last = ins[ins.length - 1]; last.focus(); last.select();
      } else if (e.target.closest('[data-del]')) {
        const { c, it } = itemDe(e.target);
        c.items = c.items.filter((x) => x !== it);
        guardar(true); vistaMenu(); toast(it.nombre + ' eliminado');
      }
    } else if (tab === 'promos') {
      if (e.target.closest('[data-new]')) return abrirPromo(null);
      const card = e.target.closest('[data-promo]');
      if (!card) return;
      const p = P.S.promos.find((x) => x.id === card.dataset.promo);
      if (e.target.closest('[data-edit]')) abrirPromo(p);
      if (e.target.closest('[data-del]')) {
        if (!window.confirm('¿Eliminar la promoción "' + p.titulo + '"?')) return;
        P.S.promos = P.S.promos.filter((x) => x !== p);
        guardar(true); vistaPromos(); toast('Promoción eliminada');
      }
    }
  });

  /* ---------- Vista en vivo ---------- */
  const frame = $('#live-frame');
  $$('#live-seg .seg__btn').forEach((b) => b.addEventListener('click', () => {
    livePid = b.dataset.p;
    $$('#live-seg .seg__btn').forEach((x) => x.classList.toggle('is-on', x === b));
    frame.src = 'tv.html?p=' + livePid + '&preview=1';
    infoVivo();
  }));
  function marcarSim() {
    $$('#sim-seg .seg__btn').forEach((x) => x.classList.toggle('is-on', x.dataset.h === (P.S.simHora || '')));
  }
  $$('#sim-seg .seg__btn').forEach((b) => b.addEventListener('click', () => {
    P.S.simHora = b.dataset.h;
    marcarSim(); guardar(true);
    if (tab === 'promos' || tab === 'horarios') setTimeout(() => VISTAS[tab](), 0);
  }));
  function infoVivo() {
    const s = P.S.pantallas.find((x) => x.id === livePid);
    const b = P.bloqueActual();
    const n = P.promosActivas().length;
    const hora = P.S.simHora ? 'Simulando las ' + P.S.simHora : 'Hora real ' + P.hhmm(P.ahora());
    $('#live-info').innerHTML = hora + ' · ' + (s.modo === 'menu' ? 'Menú: <b>' + (b ? esc(b.nombre) : 'cerrado') + '</b> · ' : '') + '<b>' + n + '</b> ' + (n === 1 ? 'promoción' : 'promociones') + ' en rotación';
  }
  setInterval(infoVivo, 30000);

  /* Cambios hechos desde otra pestaña del panel */
  P.onChange(() => {
    marcarSim(); infoVivo();
    const enfocado = document.activeElement && pane.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (!enfocado && !modal.open) VISTAS[tab]();
  });

  $('#demo-reset').addEventListener('click', () => {
    if (!window.confirm('¿Reiniciar la demo? Se borrarán tus cambios.')) return;
    P.reset();
    if (!P.bloqueActual(new Date())) { P.S.simHora = '13:00'; P.save(); }
    marcarSim(); infoVivo(); VISTAS[tab]();
    toast('Demo reiniciada');
  });

  if (!localStorage.getItem('rratsoft-pantallas-v1')) { try { P.save(); } catch (e) { /* ignorar */ } }
  marcarSim();
  infoVivo();
  mostrar('menu');
})();
