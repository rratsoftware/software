/* =========================================================
   RratSoft Delivery (demo) — lógica del panel
   - Tablero por estados: nuevo → cocina → listo → en camino → entregado
   - Llegan pedidos de prueba solos (se puede apagar)
   - Mapa con los motorizados en camino (recorrido acelerado)
   - Todo se guarda en localStorage y se reinicia cada día
   ========================================================= */
(function () {
  var D = window.DELIVERY_DATA;
  var NEG = D.NEGOCIO;
  var STORE_KEY = 'rratsoft-delivery-demo-v1';
  var DEMO_SPEED = 5000;          // ms por minuto de recorrido en el mapa (demo acelerada)
  var HOME = { x: 215, y: 150 };  // local en el mapa
  var MIN = 60000;

  var STATUS = ['nuevo', 'cocina', 'listo', 'camino', 'entregado'];
  var STATUS_NAME = { nuevo: 'Nuevo', cocina: 'En cocina', listo: 'Listo', camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
  var CHANNEL_ICON = { WhatsApp: 'ti-brand-whatsapp', Web: 'ti-world', 'Teléfono': 'ti-phone' };

  /* ---------- Utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return 'S/ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function hhmm(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function mins(ms) { return Math.max(0, Math.floor(ms / MIN)); }
  function clock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ':' + pad(s % 60);
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pick(rand, list) { return list[Math.floor(rand() * list.length)]; }
  function zone(id) { return D.ZONAS.filter(function (z) { return z.id === id; })[0]; }
  function item(id) { return D.MENU.filter(function (m) { return m.id === id; })[0]; }
  function rider(id) { return D.MOTORIZADOS.filter(function (r) { return r.id === id; })[0]; }
  function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join(''); }
  function payClass(p) { return 'pay--' + p.split(' ')[0].toLowerCase(); }

  /* ---------- Crear pedidos ---------- */
  function totals(items, zonaId) {
    var sub = items.reduce(function (a, l) { return a + item(l.id).precio * l.qty; }, 0);
    var fee = zone(zonaId).costo;
    return { sub: sub, fee: fee, total: sub + fee };
  }

  function randomItems(rand) {
    var mains = ['m01', 'm01', 'm02', 'm02', 'm03', 'm04', 'm05', 'm06'];
    var extras = ['m07', 'm08', 'm09', 'm09', 'm10'];
    var lines = [{ id: pick(rand, mains), qty: rand() < 0.75 ? 1 : 2 }];
    if (rand() < 0.35) {
      var m2 = pick(rand, mains);
      if (m2 !== lines[0].id) lines.push({ id: m2, qty: 1 });
    }
    if (rand() < 0.7) lines.push({ id: pick(rand, extras), qty: 1 });
    return lines;
  }

  function randomOrder(rand, ts) {
    var z = pick(rand, ['surquillo', 'surquillo', 'miraflores', 'miraflores', 'sanborja', 'sanisidro', 'surco', 'barranco']);
    var zo = zone(z);
    var items = randomItems(rand);
    var t = totals(items, z);
    var pr = rand();
    var pago = pr < 0.45 ? 'Yape' : pr < 0.6 ? 'Plin' : pr < 0.85 ? 'Efectivo' : 'Tarjeta (POS)';
    var paga = 0;
    if (pago === 'Efectivo') paga = [50, 100, 200].filter(function (b) { return b >= t.total; })[0] || Math.ceil(t.total);
    var tel = '9' + String(Math.floor(rand() * 1e8)).padStart(8, '0');
    return {
      canal: pick(rand, D.CANALES),
      cliente: pick(rand, D.CLIENTES),
      tel: tel.slice(0, 3) + ' ' + tel.slice(3, 6) + ' ' + tel.slice(6),
      zona: z,
      dir: pick(rand, zo.calles) + ' ' + (100 + Math.floor(rand() * 2800)),
      ref: rand() < 0.7 ? pick(rand, D.REFERENCIAS) : '',
      items: items,
      sub: t.sub, fee: t.fee, total: t.total,
      pago: pago, paga: paga,
      status: 'nuevo',
      t: { creado: ts },
      rider: null,
      dx: Math.round((rand() - 0.5) * 30),
      dy: Math.round((rand() - 0.5) * 24)
    };
  }

  function addOrder(o) {
    o.num = state.seq++;
    o.id = 'o' + o.num;
    state.orders.push(o);
    return o;
  }

  /* ---------- Día simulado ---------- */
  function seed() {
    var now = Date.now();
    var rand = rng(new Date().getDate() * 97 + new Date().getMonth());
    state = { day: dayKey(new Date()), seq: 1031, orders: [], sim: true };

    // Pedidos ya entregados durante el día
    var ts = now - 40 * MIN - 14 * 16 * MIN;
    for (var i = 0; i < 14; i++) {
      ts += (12 + rand() * 8) * MIN;
      var o = randomOrder(rand, ts);
      var zo = zone(o.zona);
      o.t.cocina = ts + (1 + rand() * 2) * MIN;
      o.t.listo = o.t.cocina + (11 + rand() * 7) * MIN;
      o.t.camino = o.t.listo + (2 + rand() * 4) * MIN;
      o.t.entregado = o.t.camino + (zo.min - 3 + rand() * 7) * MIN;
      o.rider = pick(rand, D.MOTORIZADOS).id;
      o.status = 'entregado';
      if (i === 6) { o.status = 'cancelado'; o.t = { creado: o.t.creado, cancelado: o.t.creado + 4 * MIN }; o.rider = null; }
      addOrder(o);
    }

    // Pedidos en curso
    function active(status, ago, extra) {
      var o = randomOrder(rand, now - ago * MIN);
      o.status = status;
      Object.keys(extra || {}).forEach(function (k) { o.t[k] = now - extra[k] * MIN; });
      return addOrder(o);
    }
    var c1 = active('camino', 34, { cocina: 33, listo: 18 });
    c1.rider = 'r1'; c1.t.camino = now - zone(c1.zona).min * DEMO_SPEED * 0.7;
    var c2 = active('camino', 27, { cocina: 26, listo: 12 });
    c2.rider = 'r2'; c2.t.camino = now - zone(c2.zona).min * DEMO_SPEED * 0.3;
    active('listo', 21, { cocina: 20, listo: 3 });
    active('cocina', 14, { cocina: 13 });
    active('cocina', 6, { cocina: 5 });
    active('nuevo', 1.2);
    active('nuevo', 0.4);
    return state;
  }

  var state;
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.day === dayKey(new Date())) return s;
    } catch (e) { /* datos dañados: se vuelve a crear */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* sin espacio */ }
  }
  state = load();
  save();

  function order(id) { return state.orders.filter(function (o) { return o.id === id; })[0]; }
  function byStatus(s) {
    return state.orders.filter(function (o) { return o.status === s; })
      .sort(function (a, b) { return a.t.creado - b.t.creado; });
  }
  function routeMs(o) { return zone(o.zona).min * DEMO_SPEED; }
  function progress(o) { return Math.min(1, (Date.now() - o.t.camino) / routeMs(o)); }
  function busyRiders() {
    var busy = {};
    byStatus('camino').forEach(function (o) { busy[o.rider] = o; });
    return busy;
  }

  /* ---------- Sonido ---------- */
  var audio = null;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        var t0 = audio.currentTime + i * 0.14;
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
        o.connect(g); g.connect(audio.destination);
        o.start(t0); o.stop(t0 + 0.3);
      });
    } catch (e) { /* sin audio */ }
  }

  /* ---------- Tarjetas del tablero ---------- */
  function timerInfo(o) {
    var now = Date.now();
    if (o.status === 'nuevo') {
      var w = now - o.t.creado;
      return { text: clock(w), cls: w > 3 * MIN ? 'is-late' : w > 1.5 * MIN ? 'is-warn' : '' };
    }
    if (o.status === 'cocina') {
      var k = now - o.t.cocina, meta = NEG.metaCocina * MIN;
      return { text: mins(k) + ' min', cls: k > meta ? 'is-late' : k > meta - 3 * MIN ? 'is-warn' : '' };
    }
    if (o.status === 'listo') {
      var l = now - o.t.listo;
      return { text: mins(l) + ' min', cls: l > 10 * MIN ? 'is-late' : l > 5 * MIN ? 'is-warn' : '' };
    }
    return { text: '', cls: '' };
  }

  function itemsList(o, max) {
    var lines = o.items.slice(0, max).map(function (l) {
      return '<li>' + l.qty + '× ' + esc(item(l.id).nombre) + '</li>';
    }).join('');
    if (o.items.length > max) lines += '<li><em>+' + (o.items.length - max) + ' más</em></li>';
    return lines;
  }

  var ACTIONS = {
    nuevo: { act: 'aceptar', label: 'Aceptar', cls: 'btn--accent' },
    cocina: { act: 'listo', label: 'Marcar listo', cls: '' },
    listo: { act: 'despachar', label: 'Despachar', cls: '' },
    camino: { act: 'entregar', label: 'Entregado', cls: 'btn--light' }
  };

  function cardHtml(o) {
    var z = zone(o.zona);
    var tm = timerInfo(o);
    var a = ACTIONS[o.status];
    var rider_ = '';
    if (o.status === 'camino') {
      var p = progress(o);
      rider_ = '<div class="ocard__rider">' +
        '<p><i class="ti ti-motorbike" aria-hidden="true"></i>' + esc(rider(o.rider).nombre) +
        '<b data-eta="' + o.id + '">' + etaText(o) + '</b></p>' +
        '<div class="bar"><span data-bar="' + o.id + '" style="width:' + Math.round(p * 100) + '%"></span></div></div>';
    }
    return '<article class="ocard' + (tm.cls === 'is-late' ? ' is-late' : '') + (o.fresh ? ' is-fresh' : '') + '" data-open="' + o.id + '" tabindex="0">' +
      '<div class="ocard__top"><span class="ocard__code">#' + o.num + '</span>' +
        '<span class="chan"><i class="ti ' + CHANNEL_ICON[o.canal] + '" aria-hidden="true"></i>' + esc(o.canal) + '</span>' +
        '<span class="timer ' + tm.cls + '" data-timer="' + o.id + '">' + tm.text + '</span></div>' +
      '<p class="ocard__who">' + esc(o.cliente) + '</p>' +
      '<p class="ocard__where"><i class="ti ti-map-pin" aria-hidden="true"></i><span>' + esc(z.nombre) + ' · ' + esc(o.dir) + '</span></p>' +
      '<ul class="ocard__items">' + itemsList(o, 2) + '</ul>' +
      rider_ +
      '<div class="ocard__foot"><span class="ocard__total">' + money(o.total) + '</span>' +
        '<span class="pay ' + payClass(o.pago) + '">' + esc(o.pago.split(' ')[0]) + '</span>' +
        '<button class="btn btn--sm ' + a.cls + '" type="button" data-act="' + a.act + '" data-id="' + o.id + '">' + a.label + '</button></div>' +
    '</article>';
  }

  function etaText(o) {
    var left = Math.ceil(zone(o.zona).min * (1 - progress(o)));
    return left <= 0 ? 'llegando' : '~' + left + ' min';
  }

  var EMPTY = {
    nuevo: 'Sin pedidos nuevos',
    cocina: 'Nada en cocina',
    listo: 'Nada esperando motorizado',
    camino: 'Ningún pedido en ruta'
  };

  function renderBoard() {
    document.querySelectorAll('.col').forEach(function (col) {
      var s = col.getAttribute('data-status');
      var list = byStatus(s);
      col.querySelector('.col__count').textContent = list.length;
      col.querySelector('.col__list').innerHTML = list.length
        ? list.map(cardHtml).join('')
        : '<p class="col__empty">' + EMPTY[s] + '</p>';
    });
    state.orders.forEach(function (o) { delete o.fresh; });
  }

  /* ---------- Motorizados ---------- */
  function renderRiders() {
    var busy = busyRiders();
    var free = 0;
    $('riders').innerHTML = D.MOTORIZADOS.map(function (r) {
      var o = busy[r.id];
      if (!o) free++;
      return '<li class="rider"><span class="rider__avatar">' + initials(r.nombre) + '</span>' +
        '<div class="rider__info"><p class="rider__name">' + esc(r.nombre) + '</p><p class="rider__meta">' + r.placa + '</p></div>' +
        (o ? '<span class="state state--busy">En ruta #' + o.num + '</span>' : '<span class="state state--free">Disponible</span>') +
      '</li>';
    }).join('');
    $('riders-free').textContent = free + (free === 1 ? ' disponible' : ' disponibles');
  }

  /* ---------- Mapa ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  (function drawLabels() {
    var g = $('map-labels');
    var LABEL_POS = { surquillo: [222, 128], miraflores: [100, 140], sanisidro: [112, 44], sanborja: [300, 48], surco: [318, 200], barranco: [118, 232] };
    D.ZONAS.forEach(function (z) {
      var p = LABEL_POS[z.id] || [z.x, z.y - 14];
      var t = svgEl('text', { class: 'map__label', x: p[0], y: p[1] });
      t.textContent = z.nombre.toUpperCase();
      g.appendChild(t);
    });
    $('map-home').style.transform = 'translate(' + HOME.x + 'px,' + HOME.y + 'px)';
  })();

  var riderNodes = {};
  function renderMap() {
    var routes = $('map-routes');
    var ridersG = $('map-riders');
    var live = byStatus('camino');
    routes.innerHTML = '';
    var seen = {};
    live.forEach(function (o) {
      var z = zone(o.zona);
      var dest = { x: z.x + o.dx, y: z.y + o.dy };
      routes.appendChild(svgEl('line', { class: 'map__route', x1: HOME.x, y1: HOME.y, x2: dest.x, y2: dest.y }));
      routes.appendChild(svgEl('circle', { class: 'map__drop', cx: dest.x, cy: dest.y, r: 4 }));
      var p = progress(o);
      var x = HOME.x + (dest.x - HOME.x) * p;
      var y = HOME.y + (dest.y - HOME.y) * p;
      var node = riderNodes[o.id];
      if (!node) {
        node = svgEl('g', { class: 'map__rider' });
        node.appendChild(svgEl('circle', { r: 6 }));
        var t = svgEl('text', { x: 9, y: 3 });
        t.textContent = rider(o.rider).nombre.split(' ')[0] + ' · #' + o.num;
        node.appendChild(t);
        node.style.transform = 'translate(' + HOME.x + 'px,' + HOME.y + 'px)';
        ridersG.appendChild(node);
        riderNodes[o.id] = node;
        node.getBoundingClientRect();   // aplica la posición inicial antes de mover
      }
      node.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      seen[o.id] = true;
    });
    Object.keys(riderNodes).forEach(function (id) {
      if (!seen[id]) { riderNodes[id].remove(); delete riderNodes[id]; }
    });
  }

  /* ---------- Indicadores ---------- */
  function renderKpis() {
    var valid = state.orders.filter(function (o) { return o.status !== 'cancelado'; });
    var sales = valid.reduce(function (a, o) { return a + o.total; }, 0);
    var done = state.orders.filter(function (o) { return o.status === 'entregado'; });
    var avg = done.length ? done.reduce(function (a, o) { return a + (o.t.entregado - o.t.creado); }, 0) / done.length : 0;
    $('k-orders').textContent = valid.length;
    $('k-sales').textContent = money(sales);
    $('k-ticket').textContent = money(valid.length ? sales / valid.length : 0);
    $('k-time').textContent = done.length ? Math.round(avg / MIN) + ' min' : '— min';
    $('k-route').textContent = byStatus('camino').length;
  }

  /* ---------- Historial ---------- */
  function renderHistory() {
    var f = $('hist-filter').value;
    var list = state.orders.filter(function (o) {
      if (f === 'todos') return true;
      if (f === 'activos') return o.status !== 'entregado' && o.status !== 'cancelado';
      return o.status === f;
    }).sort(function (a, b) { return b.t.creado - a.t.creado; });

    $('hist-sub').textContent = list.length + (list.length === 1 ? ' pedido' : ' pedidos');
    $('hist-body').innerHTML = list.map(function (o) {
      var time = o.t.entregado ? Math.round((o.t.entregado - o.t.creado) / MIN) + ' min' : '—';
      return '<tr data-open="' + o.id + '">' +
        '<td class="mono">#' + o.num + '</td><td class="mono">' + hhmm(o.t.creado) + '</td>' +
        '<td>' + esc(o.cliente) + '</td><td>' + esc(zone(o.zona).nombre) + '</td>' +
        '<td class="hide-sm">' + esc(o.canal) + '</td><td class="hide-sm"><span class="pay ' + payClass(o.pago) + '">' + esc(o.pago.split(' ')[0]) + '</span></td>' +
        '<td class="num">' + money(o.total) + '</td>' +
        '<td><span class="badge badge--' + o.status + '">' + STATUS_NAME[o.status] + '</span></td>' +
        '<td class="num hide-sm">' + time + '</td></tr>';
    }).join('');

    var byPay = {};
    state.orders.forEach(function (o) {
      if (o.status === 'cancelado') return;
      var k = o.pago.split(' ')[0];
      byPay[k] = (byPay[k] || 0) + o.total;
    });
    $('hist-sums').innerHTML = Object.keys(byPay).map(function (k) {
      return '<span class="pay ' + payClass(k) + '">' + k + '</span>';
    }).map(function (chip, i) {
      var k = Object.keys(byPay)[i];
      return '<span>' + chip + '<b>' + money(byPay[k]) + '</b></span>';
    }).join('');
  }

  function renderAll() {
    renderBoard();
    renderRiders();
    renderMap();
    renderKpis();
    if (!$('view-historial').hidden) renderHistory();
  }

  /* ---------- Cambiar de estado ---------- */
  function setStatus(o, status, riderId) {
    o.status = status;
    o.t[status] = Date.now();
    if (riderId) o.rider = riderId;
    save();
    renderAll();
    if ($('order-modal').open && current === o.id) openOrder(o.id);
  }

  function act(name, id) {
    var o = order(id);
    if (!o) return;
    if (name === 'aceptar') { setStatus(o, 'cocina'); toast('Pedido #' + o.num + ' enviado a cocina', 'ti-chef-hat'); }
    if (name === 'listo') { setStatus(o, 'listo'); toast('Pedido #' + o.num + ' listo para salir', 'ti-package'); }
    if (name === 'despachar') openRiderPick(o);
    if (name === 'entregar') { setStatus(o, 'entregado'); toast('Pedido #' + o.num + ' entregado', 'ti-circle-check'); }
  }

  /* ---------- Elegir motorizado ---------- */
  var pickingFor = null;
  function openRiderPick(o) {
    pickingFor = o.id;
    var busy = busyRiders();
    $('rider-pick').innerHTML = D.MOTORIZADOS.map(function (r) {
      var b = busy[r.id];
      return '<li><button type="button" data-rider="' + r.id + '"' + (b ? ' disabled' : '') + '>' +
        '<span class="rider__avatar">' + initials(r.nombre) + '</span>' +
        '<span class="rider__info"><span class="rider__name">' + esc(r.nombre) + '</span><br><span class="rider__meta">' + r.placa + '</span></span>' +
        (b ? '<span class="state state--busy">En ruta #' + b.num + '</span>' : '<span class="state state--free">Disponible</span>') +
      '</button></li>';
    }).join('');
    $('rider-modal').showModal();
  }
  $('rider-pick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rider]');
    if (!b || b.disabled) return;
    var o = order(pickingFor);
    $('rider-modal').close();
    if (!o || o.status !== 'listo') return;
    setStatus(o, 'camino', b.getAttribute('data-rider'));
    toast(rider(o.rider).nombre + ' salió con el pedido #' + o.num, 'ti-motorbike');
  });

  /* ---------- Detalle del pedido ---------- */
  var current = null;
  function openOrder(id) {
    var o = order(id);
    if (!o) return;
    current = id;
    var z = zone(o.zona);
    $('om-title').textContent = 'Pedido #' + o.num;
    $('om-sub').textContent = o.canal + ' · recibido a las ' + hhmm(o.t.creado);

    var steps = o.status === 'cancelado'
      ? '<p class="badge badge--cancelado">Cancelado a las ' + hhmm(o.t.cancelado) + '</p>'
      : '<div class="om__steps">' + STATUS.map(function (s, i) {
          var names = ['Recibido', 'Cocina', 'Listo', 'En camino', 'Entregado'];
          var key = s === 'nuevo' ? 'creado' : s;
          var done = !!o.t[key];
          return '<span class="om__step' + (done ? ' is-done' : '') + '">' + names[i] + (done ? '<em>' + hhmm(o.t[key]) + '</em>' : '') + '</span>';
        }).join('') + '</div>';

    var payText = o.pago;
    if (o.pago === 'Efectivo' && o.paga) payText += ' · paga con ' + money(o.paga) + ' · vuelto ' + money(o.paga - o.total);

    $('om-body').innerHTML = steps +
      '<div class="om__box">' +
        '<p><i class="ti ti-user" aria-hidden="true"></i><span><b>' + esc(o.cliente) + '</b> · ' + esc(o.tel) + '</span></p>' +
        '<p><i class="ti ti-map-pin" aria-hidden="true"></i><span>' + esc(o.dir) + ', ' + esc(z.nombre) + (o.ref ? '<br><span class="muted">' + esc(o.ref) + '</span>' : '') + '</span></p>' +
        '<p><i class="ti ti-wallet" aria-hidden="true"></i><span>' + esc(payText) + '</span></p>' +
        (o.rider ? '<p><i class="ti ti-motorbike" aria-hidden="true"></i><span>' + esc(rider(o.rider).nombre) + ' · ' + rider(o.rider).placa + '</span></p>' : '') +
      '</div>' +
      '<ul class="om__items">' + o.items.map(function (l) {
        var m = item(l.id);
        return '<li><b>' + l.qty + '×</b><span>' + esc(m.nombre) + '<br><small class="muted">' + esc(m.detalle) + '</small></span><em>' + money(m.precio * l.qty) + '</em></li>';
      }).join('') + '</ul>' +
      '<div class="om__sum"><p><span>Subtotal</span><b>' + money(o.sub) + '</b></p>' +
        '<p><span>Delivery a ' + esc(z.nombre) + '</span><b>' + money(o.fee) + '</b></p>' +
        '<p class="om__total"><span>Total</span><b>' + money(o.total) + '</b></p></div>';

    var a = ACTIONS[o.status];
    var html = a ? '<button class="btn ' + (a.cls || '') + '" type="button" data-act="' + a.act + '" data-id="' + o.id + '">' + a.label + '</button>' : '';
    html += '<button class="btn btn--light" type="button" data-print="' + o.id + '"><i class="ti ti-printer" aria-hidden="true"></i> Comanda</button>';
    if (o.status !== 'cancelado' && o.status !== 'entregado') {
      html += '<a class="btn btn--light" target="_blank" rel="noopener" href="' + waLink(o) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Avisar</a>';
      html += '<button class="btn btn--danger" type="button" data-cancel="' + o.id + '">Cancelar</button>';
    }
    $('om-actions').innerHTML = html;
    if (!$('order-modal').open) $('order-modal').showModal();
  }

  // En la demo el enlace no lleva número (los clientes son ficticios): WhatsApp pide elegir el contacto
  function waLink(o) {
    var name = o.cliente.split(' ')[0];
    var msg = {
      nuevo: 'Hola ' + name + ', recibimos tu pedido #' + o.num + ' en ' + NEG.nombre + '. Total: ' + money(o.total) + '.',
      cocina: 'Hola ' + name + ', tu pedido #' + o.num + ' ya se está preparando. Te avisamos cuando salga.',
      listo: 'Hola ' + name + ', tu pedido #' + o.num + ' está listo y sale en unos minutos.',
      camino: 'Hola ' + name + ', tu pedido #' + o.num + ' va en camino con ' + (o.rider ? rider(o.rider).nombre.split(' ')[0] : 'nuestro motorizado') + '. Llega en ' + etaText(o).replace('~', 'aprox. ') + '.'
    }[o.status];
    return 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  $('om-actions').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-act')) {
      if (b.getAttribute('data-act') === 'despachar') $('order-modal').close();
      act(b.getAttribute('data-act'), b.getAttribute('data-id'));
    }
    if (b.hasAttribute('data-print')) printTicket(order(b.getAttribute('data-print')));
    if (b.hasAttribute('data-cancel')) {
      var o = order(b.getAttribute('data-cancel'));
      if (!confirm('¿Cancelar el pedido #' + o.num + '?')) return;
      setStatus(o, 'cancelado');
      toast('Pedido #' + o.num + ' cancelado', 'ti-x');
    }
  });

  /* ---------- Comanda ---------- */
  function printTicket(o) {
    var z = zone(o.zona);
    $('print-area').innerHTML =
      '<h3>' + esc(NEG.nombre) + '</h3><p class="center">COMANDA #' + o.num + ' · ' + hhmm(o.t.creado) + '</p><hr>' +
      o.items.map(function (l) { return '<p>' + l.qty + ' x ' + esc(item(l.id).nombre) + '</p>'; }).join('') + '<hr>' +
      '<p>' + esc(o.cliente) + ' · ' + esc(o.tel) + '</p><p>' + esc(o.dir) + ', ' + esc(z.nombre) + '</p>' +
      (o.ref ? '<p>Ref: ' + esc(o.ref) + '</p>' : '') + '<hr>' +
      '<p>TOTAL ' + money(o.total) + ' · ' + esc(o.pago) + '</p>' +
      (o.pago === 'Efectivo' && o.paga ? '<p>Paga con ' + money(o.paga) + ' · Vuelto ' + money(o.paga - o.total) + '</p>' : '');
    window.print();
  }

  /* ---------- Clics en el tablero e historial ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.ocard [data-act]');
    if (a) { e.stopPropagation(); act(a.getAttribute('data-act'), a.getAttribute('data-id')); return; }
    var open = e.target.closest('[data-open]');
    if (open && !e.target.closest('dialog')) openOrder(open.getAttribute('data-open'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.ocard')) openOrder(e.target.getAttribute('data-open'));
  });

  // Cerrar ventanas con [data-close] y con clic fuera
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  /* ---------- Pedido por teléfono ---------- */
  var draft = {};
  var nf = $('new-form');
  $('nf-zona').innerHTML = D.ZONAS.map(function (z) {
    return '<option value="' + z.id + '">' + esc(z.nombre) + ' — delivery ' + money(z.costo) + '</option>';
  }).join('');

  function renderMenu() {
    $('nf-menu').innerHTML = D.MENU.map(function (m) {
      var q = draft[m.id] || 0;
      return '<li class="' + (q ? 'is-on' : '') + '"><div class="menu__info"><b>' + esc(m.nombre) + '</b><span>' + esc(m.detalle) + '</span></div>' +
        '<span class="menu__price">' + money(m.precio) + '</span>' +
        '<div class="qty"><button type="button" data-dec="' + m.id + '" aria-label="Quitar uno">−</button><span>' + q + '</span>' +
        '<button type="button" data-inc="' + m.id + '" aria-label="Agregar uno">+</button></div></li>';
    }).join('');
    var items = draftItems();
    var t = items.length ? totals(items, nf.zona.value) : { sub: 0, fee: zone(nf.zona.value).costo, total: 0 };
    $('nf-sub').textContent = money(t.sub);
    $('nf-fee').textContent = money(t.fee);
    $('nf-total').textContent = money(items.length ? t.total : 0);
  }
  function draftItems() {
    return Object.keys(draft).filter(function (k) { return draft[k] > 0; }).map(function (k) { return { id: k, qty: draft[k] }; });
  }

  $('nf-menu').addEventListener('click', function (e) {
    var inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc) draft[inc.getAttribute('data-inc')] = (draft[inc.getAttribute('data-inc')] || 0) + 1;
    if (dec) draft[dec.getAttribute('data-dec')] = Math.max(0, (draft[dec.getAttribute('data-dec')] || 0) - 1);
    if (inc || dec) renderMenu();
  });
  nf.zona.addEventListener('change', renderMenu);
  nf.pago.addEventListener('change', function () { $('nf-cash-wrap').hidden = nf.pago.value !== 'Efectivo'; });

  $('new-order').addEventListener('click', function () {
    draft = {};
    nf.reset();
    $('nf-cash-wrap').hidden = true;
    $('nf-note').textContent = '';
    nf.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    renderMenu();
    $('new-modal').showModal();
  });

  nf.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = $('nf-note');
    var items = draftItems();
    var tel = nf.tel.value.replace(/\D/g, '');
    var bad = [];
    if (!nf.cliente.value.trim()) bad.push(nf.cliente);
    if (!/^9\d{8}$/.test(tel)) bad.push(nf.tel);
    if (!nf.dir.value.trim()) bad.push(nf.dir);
    nf.querySelectorAll('input').forEach(function (el) { el.setAttribute('aria-invalid', String(bad.indexOf(el) !== -1)); });
    if (!items.length) { note.textContent = 'Agrega al menos un producto.'; return; }
    if (bad.length) { note.textContent = bad[0] === nf.tel ? 'El celular debe tener 9 dígitos y empezar con 9.' : 'Completa los datos del cliente.'; bad[0].focus(); return; }

    var t = totals(items, nf.zona.value);
    var paga = 0;
    if (nf.pago.value === 'Efectivo' && nf.paga.value) {
      paga = Number(nf.paga.value);
      if (paga < t.total) { note.textContent = 'El monto con el que paga es menor al total.'; nf.paga.focus(); return; }
    }
    var now = Date.now();
    var o = addOrder({
      canal: 'Teléfono', cliente: nf.cliente.value.trim(),
      tel: tel.slice(0, 3) + ' ' + tel.slice(3, 6) + ' ' + tel.slice(6),
      zona: nf.zona.value, dir: nf.dir.value.trim(), ref: nf.ref.value.trim(),
      items: items, sub: t.sub, fee: t.fee, total: t.total,
      pago: nf.pago.value, paga: paga,
      status: 'cocina', t: { creado: now, cocina: now }, rider: null,
      dx: Math.round((Math.random() - 0.5) * 30), dy: Math.round((Math.random() - 0.5) * 24),
      fresh: true
    });
    save();
    $('new-modal').close();
    renderAll();
    toast('Pedido #' + o.num + ' registrado y enviado a cocina', 'ti-chef-hat');
  });

  /* ---------- Pedidos de prueba que llegan solos ---------- */
  var simRand = rng(Date.now() % 100000);
  var nextArrival = Date.now() + 15000;
  $('sim-toggle').checked = state.sim !== false;
  $('sim-toggle').addEventListener('change', function (e) {
    state.sim = e.target.checked;
    nextArrival = Date.now() + 8000;
    save();
    toast(state.sim ? 'Recibiendo pedidos de prueba' : 'Pedidos de prueba en pausa', state.sim ? 'ti-player-play' : 'ti-player-pause');
  });

  function simulate() {
    if (!state.sim || Date.now() < nextArrival) return;
    nextArrival = Date.now() + 25000 + simRand() * 25000;
    if (byStatus('nuevo').length >= 5) return;     // no llenar el tablero si nadie atiende
    var o = addOrder(randomOrder(simRand, Date.now()));
    o.fresh = true;
    save();
    renderAll();
    chime();
    toast('Nuevo pedido #' + o.num + ' por ' + o.canal + ' · ' + money(o.total), 'ti-bell-ringing');
  }

  /* ---------- Reloj: tiempos, recorridos y entregas ---------- */
  function tick() {
    var now = new Date();
    $('clock').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());

    if (state.day !== dayKey(now)) { state = seed(); save(); renderAll(); return; }

    // Entregas automáticas cuando el motorizado llega
    var arrived = byStatus('camino').filter(function (o) { return progress(o) >= 1; });
    arrived.forEach(function (o) {
      o.status = 'entregado';
      o.t.entregado = Date.now();
      toast(rider(o.rider).nombre.split(' ')[0] + ' entregó el pedido #' + o.num, 'ti-circle-check');
    });
    if (arrived.length) { save(); renderAll(); }

    simulate();

    // Actualiza solo los números que cambian
    document.querySelectorAll('[data-timer]').forEach(function (el) {
      var o = order(el.getAttribute('data-timer'));
      if (!o) return;
      var tm = timerInfo(o);
      el.textContent = tm.text;
      el.className = 'timer ' + tm.cls;
      el.closest('.ocard').classList.toggle('is-late', tm.cls === 'is-late');
    });
    document.querySelectorAll('[data-bar]').forEach(function (el) {
      var o = order(el.getAttribute('data-bar'));
      if (o && o.status === 'camino') el.style.width = Math.round(progress(o) * 100) + '%';
    });
    document.querySelectorAll('[data-eta]').forEach(function (el) {
      var o = order(el.getAttribute('data-eta'));
      if (o && o.status === 'camino') el.textContent = etaText(o);
    });
    renderMap();
  }

  /* ---------- Vistas ---------- */
  document.querySelectorAll('.tabs__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-view');
      document.querySelectorAll('.tabs__btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $('view-tablero').hidden = v !== 'tablero';
      $('view-historial').hidden = v !== 'historial';
      if (v === 'historial') renderHistory();
    });
  });
  $('hist-filter').addEventListener('change', renderHistory);

  /* ---------- Reiniciar demo ---------- */
  $('demo-reset').addEventListener('click', function () {
    if (!confirm('¿Reiniciar la demo? Se borran los pedidos de prueba de este navegador.')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorar */ }
    state = seed();
    save();
    Object.keys(riderNodes).forEach(function (id) { riderNodes[id].remove(); delete riderNodes[id]; });
    $('sim-toggle').checked = true;
    renderAll();
    toast('Demo reiniciada', 'ti-refresh');
  });

  /* ---------- Aviso ---------- */
  var toastTimer;
  function toast(text, icon) {
    var el = $('toast');
    el.innerHTML = '<i class="ti ' + (icon || 'ti-info-circle') + '" aria-hidden="true"></i><span></span>';
    el.querySelector('span').textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
  }

  /* ---------- Inicio ---------- */
  $('store-name').textContent = NEG.nombre;
  $('store-addr').textContent = NEG.tipo + ' · ' + NEG.direccion;
  renderAll();
  tick();
  setInterval(tick, 1000);
})();
