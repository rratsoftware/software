/* =========================================================
   RratSoft — Cotizador
   Precios base en soles (pen) y dólares (usd), sin oferta.
   La oferta y la moneda vienen de main.js (window.RratSoftPrecios).
   Para cambiar precios o agregar opciones, edita las listas de abajo.
   ========================================================= */
(function () {
  var P = window.RratSoftPrecios;
  var E = window.RRATSOFT_EMPRESA || { email: 'hola@rratsoft.com', whatsapp: '' };
  var form = document.getElementById('quote-form');
  if (!form || !P) return;

  // Tipo de proyecto: precio base y semanas de trabajo
  var TYPES = [
    { id: 'landing',  icon: 'ti-file-text',       name: 'Landing',                pen: 1100,  usd: 299,  weeks: 1 },
    { id: 'web',      icon: 'ti-world',           name: 'Web profesional',        pen: 3400,  usd: 899,  weeks: 3 },
    { id: 'tienda',   icon: 'ti-shopping-cart',   name: 'Tienda online',          pen: 2900,  usd: 790,  weeks: 3 },
    { id: 'pos',      icon: 'ti-receipt',         name: 'Punto de venta (POS)',   pen: 3900,  usd: 1050, weeks: 4 },
    { id: 'sistema',  icon: 'ti-layout-dashboard', name: 'Sistema o CRM a medida', pen: 9400,  usd: 2500, weeks: 8 },
    { id: 'app',      icon: 'ti-device-mobile',   name: 'App móvil',              pen: 12000, usd: 3200, weeks: 10 }
  ];

  // Funciones extra: precio único y semanas que suma
  var EXTRAS = [
    { id: 'pagos',    name: 'Pagos en línea (Izipay, Niubiz, Mercado Pago)', pen: 900,  usd: 240, weeks: 1 },
    { id: 'sunat',    name: 'Boletas y facturas electrónicas (SUNAT)',      pen: 1200, usd: 320, weeks: 1 },
    { id: 'whatsapp', name: 'Integración con WhatsApp',                      pen: 600,  usd: 160, weeks: 0.5 },
    { id: 'usuarios', name: 'Usuarios, roles y permisos',                    pen: 1100, usd: 290, weeks: 1 },
    { id: 'reportes', name: 'Reportes y panel de indicadores',               pen: 1300, usd: 350, weeks: 1 },
    { id: 'idiomas',  name: 'Versión en inglés',                             pen: 500,  usd: 135, weeks: 0.5 },
    { id: 'dominio',  name: 'Dominio y hosting (primer año)',                pen: 250,  usd: 69,  weeks: 0 },
    { id: 'manten',   name: 'Mantenimiento mensual',                         pen: 190,  usd: 52,  weeks: 0, monthly: true }
  ];

  // Urgencia: multiplica el precio y acorta el plazo
  var SPEED = [
    { id: 'normal',  name: 'Plazo normal', note: 'El plazo recomendado', factor: 1,    time: 1 },
    { id: 'rapido',  name: 'Prioritario',  note: '+25 % · hasta 30 % antes', factor: 1.25, time: 0.7 }
  ];

  var typesBox = document.getElementById('quote-types');
  var extrasBox = document.getElementById('quote-extras');
  var speedBox = document.getElementById('quote-speed');
  var nameInput = document.getElementById('quote-name');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  typesBox.innerHTML = TYPES.map(function (t, i) {
    return '<label class="qopt"><input type="radio" name="qtype" value="' + t.id + '"' + (i === 1 ? ' checked' : '') + '>' +
      '<span><i class="ti ' + t.icon + '" aria-hidden="true"></i><b>' + esc(t.name) + '</b><em data-price="' + t.id + '"></em></span></label>';
  }).join('');

  extrasBox.innerHTML = EXTRAS.map(function (x) {
    return '<label class="qx"><input type="checkbox" name="qextra" value="' + x.id + '">' +
      '<span class="qx__box"><i class="ti ti-check" aria-hidden="true"></i></span>' +
      '<span class="qx__name">' + esc(x.name) + '</span><em data-price="' + x.id + '"></em></label>';
  }).join('');

  speedBox.innerHTML = SPEED.map(function (s, i) {
    return '<label class="qopt qopt--row"><input type="radio" name="qspeed" value="' + s.id + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span><b>' + esc(s.name) + '</b><em>' + esc(s.note) + '</em></span></label>';
  }).join('');

  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  function state() {
    var cur = P.getCurrency();
    var key = cur === 'USD' ? 'usd' : 'pen';
    var type = find(TYPES, form.querySelector('input[name="qtype"]:checked').value);
    var speed = find(SPEED, form.querySelector('input[name="qspeed"]:checked').value);
    var extras = Array.prototype.map.call(form.querySelectorAll('input[name="qextra"]:checked'), function (i) { return find(EXTRAS, i.value); });
    var once = extras.filter(function (x) { return !x.monthly; });
    var monthly = extras.filter(function (x) { return x.monthly; });

    var base = type[key] + once.reduce(function (a, x) { return a + x[key]; }, 0);
    base = Math.round(base * speed.factor / P.CURRENCIES[cur].round) * P.CURRENCIES[cur].round;
    var weeks = (type.weeks + once.reduce(function (a, x) { return a + x.weeks; }, 0)) * speed.time;
    weeks = Math.max(1, Math.round(weeks));

    return {
      cur: cur, type: type, speed: speed, extras: extras,
      base: base, total: P.withOffer(cur, base),
      monthly: P.withOffer(cur, monthly.reduce(function (a, x) { return a + x[key]; }, 0)),
      weeks: weeks
    };
  }

  function weeksText(w) { return w === 1 ? '1 semana' : w + ' semanas'; }

  function message(st) {
    var lines = [
      'Hola RratSoft, quiero cotizar un proyecto:',
      '• Tipo: ' + st.type.name,
      '• Extras: ' + (st.extras.length ? st.extras.map(function (x) { return x.name; }).join(', ') : 'ninguno'),
      '• Plazo: ' + st.speed.name + ' (aprox. ' + weeksText(st.weeks) + ')',
      '• Estimado del cotizador: ' + P.fmt(st.cur, st.total) + (st.monthly ? ' + ' + P.fmt(st.cur, st.monthly) + ' al mes' : '')
    ];
    var name = nameInput.value.trim();
    if (name) lines.push('', 'Mi nombre: ' + name);
    return lines.join('\n');
  }

  function render() {
    var st = state();
    var key = st.cur === 'USD' ? 'usd' : 'pen';

    // precios de cada opción en la moneda elegida
    TYPES.concat(EXTRAS).forEach(function (o) {
      var el = form.querySelector('[data-price="' + o.id + '"]');
      if (el) el.textContent = (o.monthly ? '' : TYPES.indexOf(o) !== -1 ? 'desde ' : '+ ') + P.fmt(st.cur, P.withOffer(st.cur, o[key])) + (o.monthly ? ' / mes' : '');
    });

    var old = document.getElementById('quote-old');
    var save = document.getElementById('quote-save');
    document.getElementById('quote-total').textContent = P.fmt(st.cur, st.total);
    old.hidden = save.hidden = st.total === st.base;
    old.textContent = P.fmt(st.cur, st.base);
    save.textContent = P.OFFER.label + ': ahorras ' + P.fmt(st.cur, st.base - st.total);

    document.getElementById('quote-time').textContent = weeksText(st.weeks);
    document.getElementById('quote-count').textContent = st.extras.filter(function (x) { return !x.monthly; }).length;
    document.getElementById('quote-monthly-row').hidden = !st.monthly;
    document.getElementById('quote-monthly').textContent = P.fmt(st.cur, st.monthly) + ' / mes';

    var text = message(st);
    document.getElementById('quote-wa').href = 'https://wa.me/' + (E.whatsapp || '') + '?text=' + encodeURIComponent(text);
    document.getElementById('quote-mail').href = 'mailto:' + E.email +
      '?subject=' + encodeURIComponent('Cotización: ' + st.type.name) + '&body=' + encodeURIComponent(text);
  }

  form.addEventListener('change', render);
  nameInput.addEventListener('input', render);
  document.addEventListener('rratsoft:moneda', render);

  // Botones "Cotizar" de los planes: eligen el tipo de proyecto
  document.querySelectorAll('[data-quote]').forEach(function (a) {
    a.addEventListener('click', function () {
      var input = form.querySelector('input[name="qtype"][value="' + a.getAttribute('data-quote') + '"]');
      if (input) { input.checked = true; render(); }
    });
  });

  render();
})();
