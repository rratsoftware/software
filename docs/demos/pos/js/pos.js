/* =========================================================
   RratSoft POS (demo) — lógica del punto de venta
   Venta, comprobantes (boleta / factura / nota de venta),
   cobro con vuelto, caja del día, productos y reportes.
   Todo se guarda en el navegador (localStorage).
   ========================================================= */
(function () {
  'use strict';

  var D = window.POS_DATA;
  var NEG = D.NEGOCIO;
  var STORE_KEY = 'rratsoft-pos-demo-v2';
  var SERIES = { boleta: 'B001', factura: 'F001', nota: 'NV01' };
  var DOC_NAMES = { boleta: 'Boleta de venta electrónica', factura: 'Factura electrónica', nota: 'Nota de venta' };
  var BOLETA_LIMIT = 700;   // desde este monto la boleta exige DNI

  /* =========================================================
     Utilidades
     ========================================================= */
  var $ = function (id) { return document.getElementById(id); };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var nf = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n) { return 'S/ ' + nf.format(r2(n)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function pad(n, len) { return String(n).padStart(len, '0'); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function hhmm(ts) { var d = new Date(ts); return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); }
  function parseNum(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? NaN : n; }

  // Generador aleatorio con semilla (para que la demo sea estable)
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- Monto en letras (como en los comprobantes) ---------- */
  var U = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  var TEENS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  var TWENTIES = ['VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
  var TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  var HUND = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function below100(n) {
    if (n < 10) return U[n];
    if (n < 20) return TEENS[n - 10];
    if (n < 30) return TWENTIES[n - 20];
    return TENS[Math.floor(n / 10)] + (n % 10 ? ' Y ' + U[n % 10] : '');
  }
  function below1000(n) {
    if (n === 100) return 'CIEN';
    var h = Math.floor(n / 100), rest = n % 100;
    return [HUND[h], below100(rest)].filter(Boolean).join(' ');
  }
  function words(n) {
    if (n === 0) return 'CERO';
    var th = Math.floor(n / 1000), rest = n % 1000, out = [];
    if (th) out.push(th === 1 ? 'MIL' : below1000(th).replace(/UNO$/, 'UN') + ' MIL');
    if (rest) out.push(below1000(rest));
    return out.join(' ');
  }
  function amountInWords(total) {
    var soles = Math.floor(r2(total));
    var cents = Math.round((r2(total) - soles) * 100);
    return 'SON: ' + words(soles) + ' CON ' + pad(cents, 2) + '/100 SOLES';
  }

  /* =========================================================
     Estado
     ========================================================= */
  var state;
  var ui = { view: 'venta', cat: 'Todas', q: '', prodQ: '', prodFilter: 'all' };

  function seed() {
    var now = new Date();
    var products = D.PRODUCTOS.map(function (p) { return Object.assign({}, p); });
    // Simula un día de trabajo: desde las 7:58 hasta ahora
    // (o un día completo si se abre la demo muy temprano o de madrugada)
    var opened = new Date(now); opened.setHours(7, 58, 0, 0);
    var end = new Date(now); end.setHours(21, 30, 0, 0);
    if (now.getHours() >= 10 && now < end) end = new Date(now.getTime() - 5 * 60000);

    var s = {
      day: dayKey(now),
      products: products,
      cart: [],
      doc: 'boleta',
      client: { doc: '', name: '' },
      counters: { boleta: 1287, factura: 214, nota: 58 },
      caja: { open: true, opening: 200, openedAt: opened.getTime(), cashier: NEG.cajero },
      sales: []
    };

    // Ventas de ejemplo de hoy, para que caja y reportes tengan datos
    var rand = rng(now.getDate() * 31 + now.getMonth());
    var popular = ['p19', 'p19', 'p01', 'p01', 'p02', 'p04', 'p14', 'p14', 'p18', 'p08', 'p22', 'p23', 'p05', 'p11', 'p09', 'p24', 'p20', 'p27', 'p10', 'p15', 'p29'];
    var span = end.getTime() - opened.getTime();
    var count = Math.max(8, Math.min(34, Math.round(span / (22 * 60000))));
    var times = [];
    for (var i = 0; i < count; i++) times.push(opened.getTime() + 2 * 60000 + rand() * span);
    times.sort(function (a, b) { return a - b; });

    times.forEach(function (ts) {
      var nLines = 1 + Math.floor(rand() * 4);
      var lines = [];
      for (var j = 0; j < nLines; j++) {
        var pid = popular[Math.floor(rand() * popular.length)];
        var p = products.find(function (x) { return x.id === pid; });
        if (lines.some(function (l) { return l.id === p.id; })) continue;
        var qty = p.precio < 1 ? 4 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * (p.precio < 5 ? 3 : 2));
        lines.push({ id: p.id, name: p.nombre, price: p.precio, qty: qty, bolsa: !!p.bolsa });
      }
      var mr = rand();
      var method = mr < 0.48 ? 'Efectivo' : mr < 0.80 ? 'Yape' : mr < 0.88 ? 'Plin' : 'Tarjeta';
      var dr = rand();
      var doc = dr < 0.86 ? 'boleta' : dr < 0.93 ? 'factura' : 'nota';
      var client = doc === 'factura'
        ? { doc: '20555555551', name: 'COMERCIAL LOS ANDES S.A.C.' }
        : { doc: '', name: '' };
      var t = totalsOf(lines);
      var received = method === 'Efectivo' ? [10, 20, 50, 100].find(function (b) { return b >= t.total; }) || Math.ceil(t.total) : t.total;
      s.counters[doc]++;
      s.sales.push({
        id: 's' + ts.toFixed(0), doc: doc, serie: SERIES[doc], num: s.counters[doc], ts: Math.round(ts),
        lines: lines, total: t.total, method: method, received: received, change: r2(received - t.total), op: '', client: client
      });
    });
    return s;
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && saved.day === dayKey(new Date())) {
        saved.products.forEach(function (p) {
          var base = D.PRODUCTOS.find(function (b) { return b.id === p.id; });
          if (base && !p.img) p.img = base.img;
        });
        return saved;
      }
    } catch (e) { /* sin almacenamiento */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignorar */ }
  }

  function product(id) { return state.products.find(function (p) { return p.id === id; }); }
  function todaySales() { return state.sales; }

  /* ---------- Totales con IGV incluido ---------- */
  function totalsOf(lines) {
    var total = 0, icbper = 0;
    lines.forEach(function (l) {
      var v = l.price * l.qty;
      total += v;
      if (l.bolsa) icbper += v;
    });
    total = r2(total);
    icbper = r2(icbper);
    var gravado = r2(total - icbper);
    var opGrav = r2(gravado / (1 + NEG.igv));
    return { total: total, icbper: icbper, opGrav: opGrav, igv: r2(gravado - opGrav) };
  }
  function cartLines() {
    return state.cart.map(function (c) {
      var p = product(c.id);
      return { id: p.id, name: p.nombre, price: p.precio, qty: c.qty, bolsa: !!p.bolsa };
    });
  }

  /* =========================================================
     Navegación
     ========================================================= */
  var railBtns = document.querySelectorAll('.rail__btn');
  var panels = document.querySelectorAll('[data-panel]');

  function go(view) {
    ui.view = view;
    railBtns.forEach(function (b) {
      var on = b.dataset.view === view;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    panels.forEach(function (p) {
      var on = p.dataset.panel === view;
      p.hidden = !on;
      p.classList.toggle('is-on', on);
    });
    render();
    if (view === 'venta' && window.matchMedia('(min-width: 900px)').matches) $('sale-search').focus();
  }
  railBtns.forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.view); }); });

  /* =========================================================
     Barra superior
     ========================================================= */
  $('store-name').textContent = NEG.nombre;
  $('store-addr').textContent = NEG.direccion;

  function renderBar() {
    var st = $('caja-status');
    st.className = 'status ' + (state.caja.open ? 'is-open' : 'is-closed');
    st.textContent = state.caja.open ? 'Caja abierta' : 'Caja cerrada';
    $('cashier').textContent = state.caja.cashier;
  }
  function tick() {
    var d = new Date();
    var date = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
    $('clock').textContent = date + ' · ' + hhmm(d);
  }
  tick();
  setInterval(tick, 20000);

  /* =========================================================
     Venta
     ========================================================= */
  function renderCats() {
    var cats = ['Todas'].concat(D.CATEGORIAS);
    $('sale-cats').innerHTML = cats.map(function (c) {
      var on = c === ui.cat;
      return '<button type="button" role="tab" class="chip' + (on ? ' is-on' : '') + '" aria-selected="' + on + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  function saleMatches() {
    return state.products.filter(function (p) {
      var inCat = ui.cat === 'Todas' || p.cat === ui.cat;
      var inQ = !ui.q || norm(p.nombre).indexOf(ui.q) !== -1 || p.codigo.indexOf(ui.q) !== -1;
      return inCat && inQ;
    });
  }

  function renderGrid() {
    var list = saleMatches();
    $('sale-empty').hidden = list.length > 0;
    $('sale-grid').innerHTML = list.map(function (p) {
      var inCart = state.cart.find(function (c) { return c.id === p.id; });
      var out = p.stock <= 0;
      var low = !out && p.stock <= p.min;
      return '' +
        '<button type="button" class="pcard' + (out ? ' is-out' : '') + '" data-add="' + p.id + '"' + (out ? ' disabled' : '') + '>' +
          (inCart ? '<span class="pcard__qty">' + inCart.qty + '</span>' : '') +
          '<span class="pcard__img">' + thumb(p) + '</span>' +
          '<span class="pcard__cat">' + esc(p.cat) + '</span>' +
          '<span class="pcard__name">' + esc(p.nombre) + '</span>' +
          '<span class="pcard__foot">' +
            '<b>' + money(p.precio) + '</b>' +
            '<em class="' + (out ? 'is-out' : low ? 'is-low' : '') + '">' + (out ? 'Sin stock' : 'Stock ' + p.stock) + '</em>' +
          '</span>' +
        '</button>';
    }).join('');
  }

  function addToCart(id, silent) {
    if (!state.caja.open) { toast('Abre la caja para empezar a vender'); return; }
    var p = product(id);
    var c = state.cart.find(function (x) { return x.id === id; });
    var qty = c ? c.qty : 0;
    if (qty + 1 > p.stock) { toast('No hay más stock de ' + p.nombre); return; }
    if (c) c.qty++; else state.cart.push({ id: id, qty: 1 });
    save();
    renderSale();
    if (!silent) flashLine(id);
  }
  function setQty(id, qty) {
    var p = product(id);
    var c = state.cart.find(function (x) { return x.id === id; });
    if (!c) return;
    if (qty > p.stock) { toast('Solo quedan ' + p.stock + ' en stock'); qty = p.stock; }
    if (qty <= 0) state.cart = state.cart.filter(function (x) { return x.id !== id; });
    else c.qty = qty;
    save();
    renderSale();
  }
  function flashLine(id) {
    var el = document.querySelector('.line[data-id="' + id + '"]');
    if (!el) return;
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
  }

  function renderTicket() {
    var lines = cartLines();
    var t = totalsOf(lines);
    var units = lines.reduce(function (s, l) { return s + l.qty; }, 0);

    $('ticket-empty').hidden = lines.length > 0;
    $('ticket-lines').innerHTML = lines.map(function (l) {
      return '' +
        '<li class="line" data-id="' + l.id + '">' +
          '<span class="line__img">' + thumb(product(l.id)) + '</span>' +
          '<div class="line__main">' +
            '<p class="line__name">' + esc(l.name) + '</p>' +
            '<p class="line__unit">' + money(l.price) + ' c/u</p>' +
          '</div>' +
          '<div class="qty">' +
            '<button type="button" data-dec="' + l.id + '" aria-label="Quitar uno"><i class="ti ti-minus"></i></button>' +
            '<input type="text" inputmode="numeric" value="' + l.qty + '" data-qty="' + l.id + '" aria-label="Cantidad de ' + esc(l.name) + '">' +
            '<button type="button" data-inc="' + l.id + '" aria-label="Agregar uno"><i class="ti ti-plus"></i></button>' +
          '</div>' +
          '<p class="line__total">' + money(l.price * l.qty) + '</p>' +
          '<button class="line__del" type="button" data-del="' + l.id + '" aria-label="Quitar ' + esc(l.name) + '"><i class="ti ti-x"></i></button>' +
        '</li>';
    }).join('');

    $('sum-grav').textContent = money(t.opGrav);
    $('sum-igv').textContent = money(t.igv);
    $('sum-icbper-row').hidden = !t.icbper;
    $('sum-icbper').textContent = money(t.icbper);
    $('sum-total').textContent = money(t.total);
    $('pay-open').disabled = lines.length === 0;
    $('ticket-clear').hidden = lines.length === 0;

    $('fab-count').textContent = units + (units === 1 ? ' producto' : ' productos');
    $('fab-total').textContent = money(t.total);

    renderClient(t.total);
  }

  /* ---------- Comprobante y cliente ---------- */
  function renderClient(total) {
    var doc = state.doc;
    var docInput = $('client-doc'), nameInput = $('client-name');
    document.querySelectorAll('input[name="doc"]').forEach(function (r) { r.checked = r.value === doc; });
    if (doc === 'factura') {
      $('client-doc-label').textContent = 'RUC';
      $('client-name-label').textContent = 'Razón social';
      docInput.placeholder = '11 dígitos';
      nameInput.placeholder = 'Nombre de la empresa';
    } else {
      var needDni = doc === 'boleta' && total >= BOLETA_LIMIT;
      $('client-doc-label').textContent = needDni ? 'DNI (obligatorio)' : 'DNI (opcional)';
      $('client-name-label').textContent = 'Cliente';
      docInput.placeholder = '8 dígitos';
      nameInput.placeholder = 'Clientes varios';
    }
    if (document.activeElement !== docInput) docInput.value = state.client.doc;
    if (document.activeElement !== nameInput) nameInput.value = state.client.name;
  }

  function validateClient(total) {
    var doc = state.doc, c = state.client;
    var docOk = true, nameOk = true, msg = '';
    if (doc === 'factura') {
      docOk = /^(10|20)\d{9}$/.test(c.doc);
      nameOk = c.name.trim().length > 2;
      msg = !docOk ? 'La factura necesita un RUC válido de 11 dígitos' : !nameOk ? 'Escribe la razón social del cliente' : '';
    } else if (c.doc || (doc === 'boleta' && total >= BOLETA_LIMIT)) {
      docOk = /^\d{8}$/.test(c.doc);
      msg = !docOk ? (c.doc ? 'El DNI debe tener 8 dígitos' : 'Boletas desde S/ 700 requieren DNI del cliente') : '';
    }
    $('client-doc').setAttribute('aria-invalid', String(!docOk));
    $('client-name').setAttribute('aria-invalid', String(!nameOk));
    return msg;
  }

  $('doc-type').addEventListener('change', function (e) {
    state.doc = e.target.value;
    state.client = { doc: '', name: '' };
    $('client-doc').setAttribute('aria-invalid', 'false');
    $('client-name').setAttribute('aria-invalid', 'false');
    save();
    renderTicket();
  });
  $('client-doc').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, '');
    state.client.doc = e.target.value;
    e.target.setAttribute('aria-invalid', 'false');
    save();
  });
  $('client-name').addEventListener('input', function (e) {
    state.client.name = e.target.value;
    e.target.setAttribute('aria-invalid', 'false');
    save();
  });

  /* ---------- Imagen del producto ---------- */
  function thumb(p) {
    return p && p.img
      ? '<img src="' + esc(p.img) + '" alt="" loading="lazy" width="120" height="120">'
      : '<i class="ti ti-package" aria-hidden="true"></i>';
  }

  /* =========================================================
     Escaneo de códigos de barras
     - Lector USB/Bluetooth: escribe el código + Enter muy rápido
     - Cámara del celular (BarcodeDetector, Chrome en Android)
     - "Simular escaneo" para probar sin lector
     ========================================================= */
  var audioCtx = null;
  function beep(ok) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = ok ? 1760 : 220;
      g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + (ok ? 0.08 : 0.25));
    } catch (e) { /* sin audio */ }
  }

  function clearSearch() {
    $('sale-search').value = '';
    ui.q = '';
    renderGrid();
  }

  function scanCode(code) {
    var p = state.products.find(function (x) { return x.codigo === code; });
    clearSearch();
    if (!p) { beep(false); toast('Código ' + code + ' no registrado'); return false; }
    if (!state.caja.open) { beep(false); toast('Abre la caja para empezar a vender'); return false; }
    var c = state.cart.find(function (x) { return x.id === p.id; });
    if ((c ? c.qty : 0) + 1 > p.stock) { beep(false); toast('No hay más stock de ' + p.nombre); return false; }
    beep(true);
    addToCart(p.id);
    toast('Escaneado: ' + p.nombre);
    return true;
  }

  // Lector físico cuando el foco no está en un campo: junta los dígitos rápidos hasta el Enter
  var scanBuf = '', scanLast = 0;
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (ui.view !== 'venta' || document.querySelector('dialog[open]')) return;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    var now = Date.now();
    if (now - scanLast > 60) scanBuf = '';
    scanLast = now;
    if (/^\d$/.test(e.key)) { scanBuf += e.key; return; }
    if (e.key === 'Enter' && scanBuf.length >= 6) { e.preventDefault(); scanCode(scanBuf); scanBuf = ''; }
  });

  // Simula un lector: escribe el código en el buscador y "presiona" Enter
  var simulating = false;
  function simulateScan() {
    if (simulating) return;
    var pool = state.products.filter(function (p) { return p.stock > 0 && !p.bolsa && p.precio < 15; });
    if (!pool.length) return;
    var p = pool[Math.floor(Math.random() * pool.length)];
    var input = $('sale-search');
    simulating = true;
    input.value = '';
    input.focus();
    var i = 0;
    var timer = setInterval(function () {
      input.value += p.codigo[i++];
      if (i >= p.codigo.length) {
        clearInterval(timer);
        setTimeout(function () { simulating = false; scanCode(p.codigo); }, 120);
      }
    }, 22);
  }
  $('scan-sim').addEventListener('click', simulateScan);
  $('scan-sim-2').addEventListener('click', function () { $('scanner').close(); simulateScan(); });

  // Cámara
  var scanner = $('scanner'), video = $('scan-video'), stream = null, detector = null, scanning = false;

  function stopCamera() {
    scanning = false;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null;
    video.srcObject = null;
  }
  scanner.addEventListener('close', stopCamera);

  $('scan-camera').addEventListener('click', function () {
    var status = $('scan-status');
    var box = $('scanbox');
    box.classList.remove('is-off');
    scanner.showModal();
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      box.classList.add('is-off');
      status.textContent = 'Este navegador no puede leer códigos con la cámara (funciona en Chrome para Android). En caja se usa un lector USB. Mientras, prueba con "Simular escaneo".';
      return;
    }
    status.textContent = 'Abriendo la cámara…';
    try {
      detector = detector || new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    } catch (e) {
      box.classList.add('is-off');
      status.textContent = 'Este navegador no puede leer códigos con la cámara. Prueba con "Simular escaneo".';
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        return video.play();
      })
      .then(function () {
        status.textContent = 'Apunta la cámara al código de barras.';
        scanning = true;
        loopDetect();
      })
      .catch(function () {
        box.classList.add('is-off');
        status.textContent = 'No se pudo usar la cámara. Revisa el permiso del navegador o usa "Simular escaneo".';
      });
  });

  function loopDetect() {
    if (!scanning) return;
    detector.detect(video).then(function (codes) {
      if (!scanning) return;
      if (codes.length) {
        var code = codes[0].rawValue;
        scanner.close();
        scanCode(code);
        return;
      }
      setTimeout(loopDetect, 180);
    }).catch(function () { setTimeout(loopDetect, 400); });
  }

  /* ---------- Eventos de venta ---------- */
  $('sale-cats').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    ui.cat = b.dataset.cat;
    renderCats();
    renderGrid();
  });
  $('sale-search').addEventListener('input', function (e) {
    ui.q = norm(e.target.value.trim());
    renderGrid();
  });
  // Enter: agrega si el código coincide o si queda un solo resultado (como un lector de barras)
  $('sale-search').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    var q = e.target.value.trim();
    if (!q) return;
    if (/^\d{6,}$/.test(q)) { scanCode(q); return; }        // vino de un lector o se tecleó un código
    var list = saleMatches();
    if (list.length === 1 && list[0].stock > 0) {
      addToCart(list[0].id);
      clearSearch();
    } else {
      toast(list.length ? 'Hay varios resultados: elige uno' : 'No encontramos ese producto');
    }
  });

  $('sale-grid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (b) addToCart(b.dataset.add);
  });
  $('ticket-lines').addEventListener('click', function (e) {
    var b = e.target.closest('[data-inc],[data-dec],[data-del]');
    if (!b) return;
    var d = b.dataset;
    var c = state.cart.find(function (x) { return x.id === (d.inc || d.dec || d.del); });
    if (d.inc) addToCart(d.inc, true);
    else if (d.dec && c) setQty(d.dec, c.qty - 1);
    else if (d.del) setQty(d.del, 0);
  });
  $('ticket-lines').addEventListener('change', function (e) {
    var id = e.target.dataset.qty;
    if (!id) return;
    var n = parseInt(e.target.value, 10);
    setQty(id, isNaN(n) ? 1 : n);
  });
  $('ticket-clear').addEventListener('click', function () {
    state.cart = [];
    state.client = { doc: '', name: '' };
    save();
    renderSale();
  });

  // Ticket como hoja inferior en celulares
  $('ticket-open').addEventListener('click', function () { $('ticket').classList.add('is-open'); });
  $('ticket-close').addEventListener('click', function () { $('ticket').classList.remove('is-open'); });

  function renderSale() {
    renderGrid();
    renderTicket();
  }

  /* =========================================================
     Cobro
     ========================================================= */
  var pay = $('pay');

  function currentMethod() { return $('pay-form').elements.method.value; }

  function openPay() {
    var lines = cartLines();
    if (!lines.length) return;
    if (!state.caja.open) { toast('Abre la caja para cobrar'); return; }
    var t = totalsOf(lines);
    var err = validateClient(t.total);
    if (err) {
      toast(err);
      $('ticket').classList.add('is-open');
      return;
    }
    $('pay-total').textContent = money(t.total);
    $('pay-form').elements.method.value = 'Efectivo';
    $('cash-in').value = '';
    $('op-number').value = '';
    $('pay-error').textContent = '';

    // Billetes sugeridos
    var opts = [];
    [10, 20, 50, 100, 200].forEach(function (b) { if (b >= t.total && opts.length < 3) opts.push(b); });
    $('cash-quick').innerHTML =
      '<button type="button" data-cash="' + t.total + '">Exacto</button>' +
      opts.map(function (b) { return '<button type="button" data-cash="' + b + '">S/ ' + b + '</button>'; }).join('');

    updatePay();
    pay.showModal();
    setTimeout(function () { $('cash-in').focus(); }, 50);
  }

  function updatePay() {
    var t = totalsOf(cartLines());
    var m = currentMethod();
    var cash = m === 'Efectivo';
    $('cash-box').hidden = !cash;
    $('digital-box').hidden = cash;
    if (cash) {
      var rec = parseNum($('cash-in').value);
      var ch = isNaN(rec) ? 0 : r2(rec - t.total);
      $('cash-change').textContent = money(Math.max(0, ch));
      $('cash-change').classList.toggle('is-neg', !isNaN(rec) && ch < 0);
    } else {
      $('digital-text').textContent = m === 'Tarjeta'
        ? 'Pasa la tarjeta por el POS (Izipay o Niubiz) y confirma cuando salga aprobada.'
        : 'Muestra el QR de ' + m + ' del negocio y confirma cuando veas el pago en tu celular.';
      $('op-label').textContent = m === 'Tarjeta' ? 'N.º de voucher (opcional)' : 'N.º de operación (opcional)';
    }
    $('pay-error').textContent = '';
  }

  $('pay-open').addEventListener('click', openPay);
  $('pay-form').addEventListener('change', function (e) { if (e.target.name === 'method') updatePay(); });
  $('cash-in').addEventListener('input', updatePay);
  $('cash-quick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cash]');
    if (!b) return;
    $('cash-in').value = parseNum(b.dataset.cash).toFixed(2);
    updatePay();
  });

  $('pay-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var lines = cartLines();
    var t = totalsOf(lines);
    var m = currentMethod();
    var received = t.total;
    if (m === 'Efectivo') {
      received = parseNum($('cash-in').value);
      if (isNaN(received)) received = t.total;   // vacío = monto exacto
      if (received < t.total) {
        $('pay-error').textContent = 'El monto recibido es menor al total.';
        $('cash-in').focus();
        return;
      }
    }

    var doc = state.doc;
    state.counters[doc]++;
    var sale = {
      id: 's' + Date.now(), doc: doc, serie: SERIES[doc], num: state.counters[doc], ts: Date.now(),
      lines: lines, total: t.total, method: m, received: r2(received), change: r2(received - t.total),
      op: $('op-number').value.trim(), client: { doc: state.client.doc, name: state.client.name.trim() }
    };
    lines.forEach(function (l) { product(l.id).stock -= l.qty; });
    state.sales.push(sale);
    state.cart = [];
    state.client = { doc: '', name: '' };
    save();

    pay.close();
    $('ticket').classList.remove('is-open');
    renderSale();
    showReceipt(sale, true);
  });

  /* =========================================================
     Comprobante
     ========================================================= */
  var receipt = $('receipt');

  // QR decorativo (los comprobantes reales llevan uno con sus datos)
  function fakeQr(seedStr) {
    var h = 0;
    for (var i = 0; i < seedStr.length; i++) h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    var rand = rng(h), n = 25, cells = '';
    function finder(x, y) { return x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7; }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var on;
        if (finder(x, y)) {
          var fx = x < 7 ? x : x - (n - 7), fy = y < 7 ? y : y - (n - 7);
          on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
        } else on = rand() < 0.48;
        if (on) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    return '<svg class="paper__qr" viewBox="0 0 ' + n + ' ' + n + '" aria-hidden="true">' + cells + '</svg>';
  }

  function paperHtml(s) {
    var t = totalsOf(s.lines);
    var d = new Date(s.ts);
    var number = s.serie + '-' + pad(s.num, 8);
    var client = s.doc === 'factura'
      ? '<p>RUC: ' + esc(s.client.doc) + '</p><p>' + esc(s.client.name) + '</p>'
      : '<p>' + (s.client.doc ? 'DNI: ' + esc(s.client.doc) : 'Cliente: ' + esc(s.client.name || 'CLIENTES VARIOS')) + '</p>' +
        (s.client.doc && s.client.name ? '<p>' + esc(s.client.name) + '</p>' : '');

    return '' +
      '<div class="paper__head">' +
        '<p class="paper__brand">' + esc(NEG.nombre) + '</p>' +
        '<p>' + esc(NEG.razonSocial) + '</p>' +
        '<p>RUC ' + esc(NEG.ruc) + '</p>' +
        '<p>' + esc(NEG.direccion) + '</p>' +
      '</div>' +
      '<div class="paper__doc"><p>' + esc(DOC_NAMES[s.doc]).toUpperCase() + '</p><p class="paper__num">' + number + '</p></div>' +
      '<div class="paper__meta">' +
        '<p>Fecha: ' + d.toLocaleDateString('es-PE') + '  Hora: ' + hhmm(s.ts) + '</p>' +
        client +
      '</div>' +
      '<table class="paper__items"><thead><tr><th>Cant.</th><th>Descripción</th><th>Importe</th></tr></thead><tbody>' +
        s.lines.map(function (l) {
          return '<tr><td>' + l.qty + '</td><td>' + esc(l.name) + '<small>' + nf.format(l.price) + ' c/u</small></td><td>' + nf.format(r2(l.price * l.qty)) + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
      '<dl class="paper__sums">' +
        (s.doc !== 'nota'
          ? '<div><dt>Op. gravada</dt><dd>' + money(t.opGrav) + '</dd></div><div><dt>IGV 18%</dt><dd>' + money(t.igv) + '</dd></div>'
          : '') +
        (t.icbper ? '<div><dt>ICBPER</dt><dd>' + money(t.icbper) + '</dd></div>' : '') +
        '<div class="paper__total"><dt>Total</dt><dd>' + money(t.total) + '</dd></div>' +
      '</dl>' +
      '<p class="paper__words">' + amountInWords(t.total) + '</p>' +
      '<div class="paper__pay">' +
        '<p>Pago: ' + esc(s.method) + (s.op ? ' · Op. ' + esc(s.op) : '') + '</p>' +
        (s.method === 'Efectivo' ? '<p>Recibido: ' + money(s.received) + ' · Vuelto: ' + money(s.change) + '</p>' : '') +
        '<p>Cajero: ' + esc(state.caja.cashier) + '</p>' +
      '</div>' +
      (s.doc !== 'nota' ? fakeQr(number + s.ts) : '') +
      '<p class="paper__foot">' + (s.doc !== 'nota' ? 'Representación impresa del comprobante electrónico.<br>' : '') + '¡Gracias por su compra!</p>' +
      '<p class="paper__demo">DEMO · Sin valor tributario</p>';
  }

  function showReceipt(sale, fresh) {
    $('receipt-ok').hidden = !fresh;
    $('receipt-next').textContent = fresh ? 'Nueva venta' : 'Cerrar';
    $('paper').innerHTML = paperHtml(sale);
    receipt.showModal();
  }
  $('receipt-print').addEventListener('click', function () { window.print(); });
  receipt.addEventListener('close', function () {
    if (ui.view === 'venta' && window.matchMedia('(min-width: 900px)').matches) $('sale-search').focus();
  });

  /* =========================================================
     Productos
     ========================================================= */
  function renderProducts() {
    var low = state.products.filter(function (p) { return p.stock <= p.min; });
    $('low-count').textContent = low.length;
    $('prod-summary').textContent = state.products.length + ' productos · ' + low.length + ' con stock bajo';
    var list = (ui.prodFilter === 'low' ? low : state.products).filter(function (p) {
      return !ui.prodQ || norm(p.nombre).indexOf(ui.prodQ) !== -1 || p.codigo.indexOf(ui.prodQ) !== -1;
    });
    $('prod-rows').innerHTML = list.length ? list.map(function (p) {
      var cls = p.stock <= 0 ? 'is-out' : p.stock <= p.min ? 'is-low' : '';
      return '' +
        '<tr>' +
          '<td><span class="cell-name">' + esc(p.nombre) + '</span>' + (cls ? '<span class="tag ' + cls + '">' + (p.stock <= 0 ? 'Agotado' : 'Stock bajo') + '</span>' : '') + '</td>' +
          '<td class="mono hide-sm">' + esc(p.codigo) + '</td>' +
          '<td class="hide-sm">' + esc(p.cat) + '</td>' +
          '<td class="num">' + money(p.precio) + '</td>' +
          '<td class="num"><span class="stock ' + cls + '">' + p.stock + '</span></td>' +
          '<td class="act"><button class="icon-btn icon-btn--sm" type="button" data-edit="' + p.id + '" aria-label="Editar ' + esc(p.nombre) + '"><i class="ti ti-pencil"></i></button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="6" class="empty-row">Sin productos para mostrar.</td></tr>';
  }

  $('prod-search').addEventListener('input', function (e) { ui.prodQ = norm(e.target.value.trim()); renderProducts(); });
  document.querySelectorAll('input[name="stockf"]').forEach(function (r) {
    r.addEventListener('change', function () { ui.prodFilter = r.value; renderProducts(); });
  });

  var prodModal = $('prod-modal');
  var editingId = null;
  $('prod-cat').innerHTML = D.CATEGORIAS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');

  function openProduct(id) {
    editingId = id || null;
    var f = $('prod-form');
    var p = id ? product(id) : null;
    $('prod-title').textContent = p ? 'Editar producto' : 'Nuevo producto';
    f.elements.nombre.value = p ? p.nombre : '';
    f.elements.cat.value = p ? p.cat : D.CATEGORIAS[0];
    f.elements.codigo.value = p ? p.codigo : '';
    f.elements.precio.value = p ? p.precio.toFixed(2) : '';
    f.elements.stock.value = p ? p.stock : '';
    f.elements.min.value = p ? p.min : '';
    $('prod-error').textContent = '';
    prodModal.showModal();
    f.elements.nombre.focus();
  }
  $('prod-new').addEventListener('click', function () { openProduct(null); });
  $('prod-rows').addEventListener('click', function (e) {
    var b = e.target.closest('[data-edit]');
    if (b) openProduct(b.dataset.edit);
  });

  $('prod-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var nombre = f.elements.nombre.value.trim();
    var precio = parseNum(f.elements.precio.value);
    var stock = parseInt(f.elements.stock.value, 10);
    var min = parseInt(f.elements.min.value || '0', 10);
    var codigo = f.elements.codigo.value.replace(/\D/g, '');
    var err = !nombre ? 'Escribe el nombre del producto'
      : !(precio > 0) ? 'El precio debe ser mayor a 0'
      : isNaN(stock) || stock < 0 ? 'El stock debe ser un número desde 0'
      : codigo && state.products.some(function (p) { return p.codigo === codigo && p.id !== editingId; }) ? 'Ese código ya existe'
      : '';
    if (err) { $('prod-error').textContent = err; return; }

    var data = { nombre: nombre, cat: f.elements.cat.value, codigo: codigo || String(Date.now()).slice(-13), precio: r2(precio), stock: stock, min: isNaN(min) ? 0 : min };
    if (editingId) Object.assign(product(editingId), data);
    else state.products.unshift(Object.assign({ id: 'n' + Date.now() }, data));
    save();
    prodModal.close();
    toast(editingId ? 'Producto actualizado' : 'Producto agregado');
    render();
  });

  /* =========================================================
     Caja
     ========================================================= */
  function cajaTotals() {
    var by = { Efectivo: 0, Yape: 0, Plin: 0, Tarjeta: 0 };
    var total = 0;
    todaySales().forEach(function (s) { by[s.method] += s.total; total += s.total; });
    return { by: by, total: r2(total), expected: r2(state.caja.opening + by.Efectivo) };
  }

  function stat(label, value, sub, mod) {
    return '<div class="stat' + (mod ? ' stat--' + mod : '') + '"><p class="stat__label">' + label + '</p><p class="stat__value">' + value + '</p>' + (sub ? '<p class="stat__sub">' + sub + '</p>' : '') + '</div>';
  }

  function renderCaja() {
    var c = state.caja, t = cajaTotals(), sales = todaySales();
    $('caja-info').textContent = c.open
      ? 'Abierta a las ' + hhmm(c.openedAt) + ' por ' + c.cashier + ' · Apertura ' + money(c.opening)
      : 'Cerrada a las ' + hhmm(c.closedAt) + ' · Contado ' + money(c.counted) + ' · ' + diffText(c.counted - c.expectedAtClose);
    $('caja-toggle').innerHTML = c.open ? '<i class="ti ti-lock"></i> Cerrar caja' : '<i class="ti ti-lock-open"></i> Abrir caja';

    $('caja-stats').innerHTML =
      stat('Ventas del día', money(t.total), sales.length + ' comprobantes') +
      stat('Efectivo', money(t.by.Efectivo)) +
      stat('Yape y Plin', money(t.by.Yape + t.by.Plin), 'Yape ' + money(t.by.Yape) + ' · Plin ' + money(t.by.Plin)) +
      stat('Tarjeta', money(t.by.Tarjeta)) +
      stat('Efectivo esperado en caja', money(t.expected), 'Apertura + ventas en efectivo', 'accent');

    $('sales-rows').innerHTML = sales.length ? sales.slice().reverse().map(function (s) {
      return '' +
        '<tr>' +
          '<td class="mono">' + hhmm(s.ts) + '</td>' +
          '<td class="mono">' + s.serie + '-' + pad(s.num, 8) + '</td>' +
          '<td class="hide-sm">' + esc(s.client.name || (s.client.doc ? 'DNI ' + s.client.doc : 'Clientes varios')) + '</td>' +
          '<td><span class="method method--' + norm(s.method) + '">' + esc(s.method) + '</span></td>' +
          '<td class="num">' + money(s.total) + '</td>' +
          '<td class="act"><button class="link-btn" type="button" data-sale="' + s.id + '">Ver</button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="6" class="empty-row">Aún no hay ventas hoy.</td></tr>';
  }

  function diffText(d) {
    d = r2(d);
    return d === 0 ? 'cuadre exacto' : d > 0 ? 'sobrante ' + money(d) : 'faltante ' + money(-d);
  }

  $('sales-rows').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sale]');
    if (!b) return;
    var s = state.sales.find(function (x) { return x.id === b.dataset.sale; });
    if (s) showReceipt(s, false);
  });

  var cajaModal = $('caja-modal');
  $('caja-toggle').addEventListener('click', function () {
    var c = state.caja, t = cajaTotals();
    $('caja-error').textContent = '';
    if (c.open) {
      $('caja-title').textContent = 'Cerrar caja';
      $('caja-submit').textContent = 'Cerrar caja';
      $('caja-body').innerHTML =
        '<dl class="arqueo">' +
          '<div><dt>Apertura</dt><dd>' + money(c.opening) + '</dd></div>' +
          '<div><dt>Ventas en efectivo</dt><dd>' + money(t.by.Efectivo) + '</dd></div>' +
          '<div class="arqueo__total"><dt>Efectivo esperado</dt><dd>' + money(t.expected) + '</dd></div>' +
        '</dl>' +
        '<label class="field"><span>Efectivo contado en caja</span><input id="caja-amount" inputmode="decimal" placeholder="' + t.expected.toFixed(2) + '"></label>' +
        '<p class="arqueo__diff" id="caja-diff"></p>';
      var input = $('caja-amount');
      input.addEventListener('input', function () {
        var v = parseNum(input.value);
        $('caja-diff').textContent = isNaN(v) ? '' : 'Resultado: ' + diffText(v - t.expected);
        $('caja-diff').className = 'arqueo__diff' + (isNaN(v) ? '' : r2(v - t.expected) < 0 ? ' is-neg' : ' is-ok');
      });
    } else {
      $('caja-title').textContent = 'Abrir caja';
      $('caja-submit').textContent = 'Abrir caja';
      $('caja-body').innerHTML = '<label class="field"><span>Monto de apertura (sencillo en caja)</span><input id="caja-amount" inputmode="decimal" value="200.00"></label>';
    }
    cajaModal.showModal();
    $('caja-amount').focus();
  });

  $('caja-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = state.caja, t = cajaTotals();
    var v = parseNum($('caja-amount').value);
    if (c.open && isNaN(v)) v = t.expected;
    if (isNaN(v) || v < 0) { $('caja-error').textContent = 'Escribe un monto válido'; return; }
    if (c.open) {
      c.open = false;
      c.closedAt = Date.now();
      c.counted = r2(v);
      c.expectedAtClose = t.expected;
      toast('Caja cerrada · ' + diffText(v - t.expected));
    } else {
      c.open = true;
      c.opening = r2(v);
      c.openedAt = Date.now();
      toast('Caja abierta con ' + money(v));
    }
    save();
    cajaModal.close();
    render();
  });

  /* =========================================================
     Reportes
     ========================================================= */
  function renderReports() {
    var sales = todaySales(), t = cajaTotals();
    var units = 0, byProduct = {}, byHour = {};
    sales.forEach(function (s) {
      var h = new Date(s.ts).getHours();
      byHour[h] = (byHour[h] || 0) + s.total;
      s.lines.forEach(function (l) {
        if (l.bolsa) return;
        units += l.qty;
        var bp = byProduct[l.id] || (byProduct[l.id] = { name: l.name, qty: 0, amount: 0 });
        bp.qty += l.qty;
        bp.amount += l.price * l.qty;
      });
    });

    $('rep-date').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('rep-kpis').innerHTML =
      stat('Ventas del día', money(t.total)) +
      stat('Comprobantes', String(sales.length)) +
      stat('Ticket promedio', money(sales.length ? t.total / sales.length : 0)) +
      stat('Unidades vendidas', String(units));

    // Barras por hora (de 7:00 a 22:00, o más si hubo ventas fuera de ese rango)
    var sold = Object.keys(byHour).map(Number);
    var from = Math.min.apply(null, [7].concat(sold)), to = Math.max.apply(null, [22].concat(sold));
    var hours = [];
    for (var h = from; h <= to; h++) hours.push(h);
    $('rep-hours').style.gridTemplateColumns = 'repeat(' + hours.length + ', minmax(0, 1fr))';
    var max = Math.max.apply(null, hours.map(function (x) { return byHour[x] || 0; }).concat([1]));
    var nowH = new Date().getHours();
    $('rep-hours').innerHTML = hours.map(function (x) {
      var v = byHour[x] || 0;
      return '<div class="bars__col' + (x === nowH ? ' is-now' : '') + '" title="' + x + ':00 · ' + money(v) + '">' +
        '<span class="bars__val">' + (v ? Math.round(v) : '') + '</span>' +
        '<span class="bars__bar" style="height:' + Math.max(v ? 4 : 0, v / max * 100) + '%"></span>' +
        '<span class="bars__label">' + x + '</span>' +
      '</div>';
    }).join('');

    var methods = ['Efectivo', 'Yape', 'Plin', 'Tarjeta'];
    $('rep-methods').innerHTML = methods.map(function (m) {
      var v = t.by[m], pct = t.total ? v / t.total * 100 : 0;
      return '<li><div class="hbars__row"><span>' + m + '</span><b>' + money(v) + '</b></div>' +
        '<span class="hbars__track"><span class="hbars__fill method--' + norm(m) + '" style="width:' + pct.toFixed(1) + '%"></span></span>' +
        '<span class="hbars__pct">' + Math.round(pct) + '%</span></li>';
    }).join('');

    var top = Object.keys(byProduct).map(function (k) { return byProduct[k]; })
      .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);
    $('rep-top').innerHTML = top.length ? top.map(function (p) {
      return '<li><span class="rank__name">' + esc(p.name) + '</span><span class="rank__qty">' + p.qty + ' u.</span><span class="rank__amt">' + money(p.amount) + '</span></li>';
    }).join('') : '<li class="muted">Sin ventas todavía.</li>';

    var low = state.products.filter(function (p) { return p.stock <= p.min; })
      .sort(function (a, b) { return a.stock / (a.min || 1) - b.stock / (b.min || 1); }).slice(0, 6);
    $('rep-low').innerHTML = low.length ? low.map(function (p) {
      return '<li><span>' + esc(p.nombre) + '</span><span class="stock ' + (p.stock <= 0 ? 'is-out' : 'is-low') + '">' + p.stock + ' / mín. ' + p.min + '</span></li>';
    }).join('') : '<li class="muted">Todo el stock está en orden.</li>';
  }

  /* =========================================================
     General
     ========================================================= */
  function render() {
    renderBar();
    if (ui.view === 'venta') { renderCats(); renderSale(); }
    if (ui.view === 'productos') renderProducts();
    if (ui.view === 'caja') renderCaja();
    if (ui.view === 'reportes') renderReports();
  }

  // Cerrar ventanas con los botones [data-close] y con clic fuera
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  // Atajos de teclado
  document.addEventListener('keydown', function (e) {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'F2') { e.preventDefault(); if (ui.view !== 'venta') go('venta'); $('sale-search').focus(); }
    if (e.key === 'F9' && ui.view === 'venta') { e.preventDefault(); openPay(); }
    if (e.key === 'Escape') $('ticket').classList.remove('is-open');
  });

  $('demo-reset').addEventListener('click', function () {
    if (!window.confirm('¿Reiniciar la demo? Se borrarán las ventas y cambios que hiciste.')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorar */ }
    state = seed();
    save();
    ui.cat = 'Todas'; ui.q = ''; $('sale-search').value = '';
    go('venta');
    toast('Demo reiniciada');
  });

  var toastTimer = null;
  function toast(text) {
    var el = $('toast');
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  /* ---------- Inicio ---------- */
  state = load();
  save();
  go('venta');
})();
