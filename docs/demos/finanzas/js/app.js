/* Finanzas del negocio — pantallas */
(function () {
  'use strict';
  var L = window.Libro;
  var D = window.FINANZAS_DATOS;
  var vista = document.getElementById('vista');
  var hoja = document.getElementById('hoja');
  var hojaCaja = document.getElementById('hoja-caja');

  var est = {
    mes: L.claveMes(L.hoy()),
    filtro: { tipo: 'todos', cuenta: 'todas', q: '' },
    deudas: 'cobrar',
    conteo: {}
  };
  var BILLETES = [200, 100, 50, 20, 10];
  var MONEDAS = [5, 2, 1, 0.5, 0.2, 0.1];
  var COLOR_CUENTA = { caja: 'var(--c-caja)', bcp: 'var(--c-bcp)', yape: 'var(--c-yape)' };

  /* ---------- Utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function S(n, signo) { return L.soles(n, signo); }
  function icono(n) { return '<i class="ti ti-' + n + '" aria-hidden="true"></i>'; }
  function may(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pct(n) { return n.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function variacion(a, b) { return b ? (a - b) / Math.abs(b) * 100 : null; }
  function esMesActual() { return est.mes === L.claveMes(L.hoy()); }

  var avisoT;
  function aviso(txt) {
    var a = document.getElementById('aviso');
    a.textContent = txt; a.hidden = false;
    clearTimeout(avisoT); avisoT = setTimeout(function () { a.hidden = true; }, 2800);
  }

  function selectorMes() {
    var primero = est.mes <= L.primerMes();
    return '<div class="mes" role="group" aria-label="Mes">' +
      '<button type="button" class="mes__btn" data-mes="-1" aria-label="Mes anterior"' + (primero ? ' disabled' : '') + '>' + icono('chevron-left') + '</button>' +
      '<span class="mes__nombre">' + may(L.mesNombre(est.mes, true)) + '</span>' +
      '<button type="button" class="mes__btn" data-mes="1" aria-label="Mes siguiente"' + (esMesActual() ? ' disabled' : '') + '>' + icono('chevron-right') + '</button>' +
      '</div>';
  }

  /* =========================================================
     Resumen
     ========================================================= */
  function saludo() {
    var h = new Date().getHours();
    return (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches') + ', ' + D.negocio.duena;
  }

  function comparacion() {
    var actual = L.totales(L.delMes(est.mes));
    var prev = L.moverMes(est.mes, -1);
    var lista = L.delMes(prev), etiqueta = 'vs ' + L.mesNombre(prev);
    if (esMesActual()) {
      var dia = +L.hoy().slice(8);
      lista = lista.filter(function (m) { return +m.fecha.slice(8) <= dia; });
      etiqueta = 'vs 1–' + dia + ' ' + L.mesNombre(prev).slice(0, 3);
    }
    return { actual: actual, previo: L.totales(lista), etiqueta: etiqueta, hayPrevio: prev >= L.primerMes() };
  }

  function delta(v, etiqueta, bueno) {
    if (v == null) return '<span class="delta">Sin mes anterior</span>';
    var sube = v >= 0;
    var clase = (sube === bueno) ? 'delta--bien' : 'delta--mal';
    if (Math.abs(v) < 0.05) clase = '';
    return '<span class="delta ' + clase + '">' + icono(sube ? 'arrow-up-right' : 'arrow-down-right') + pct(Math.abs(v)) + ' <span>' + esc(etiqueta) + '</span></span>';
  }

  function pintarResumen() {
    var s = L.saldos();
    var total = 0; D.cuentas.forEach(function (c) { total += s[c.id]; });
    var c = comparacion(), a = c.actual, p = c.previo;
    var margen = a.ingresos ? a.ganancia / a.ingresos * 100 : 0;

    // Gastos por categoría
    var cats = Object.keys(a.porCategoria).map(function (k) { return { id: k, monto: a.porCategoria[k] }; })
      .sort(function (x, y) { return y.monto - x.monto; });
    var maxCat = cats.length ? cats[0].monto : 1;

    // Próximos 15 días
    var limite = L.sumarDias(L.hoy(), 15);
    var prox = L.deudas('cobrar').concat(L.deudas('pagar'))
      .filter(function (d) { return d.saldo > 0 && d.vence <= limite; })
      .sort(function (x, y) { return x.vence < y.vence ? -1 : 1; });
    var cobrar = 0, pagar = 0;
    prox.forEach(function (d) { if (d.tipo === 'cobrar') cobrar += d.saldo; else pagar += d.saldo; });

    vista.innerHTML =
      '<div class="cabeza">' +
        '<div><p class="cabeza__pre">' + esc(saludo()) + '</p><h1>Resumen de ' + esc(L.mesNombre(est.mes)) + '</h1></div>' +
        selectorMes() +
      '</div>' +

      '<div class="rejilla">' +
        '<div class="col">' +
          '<section class="panel cifras" aria-label="Resultado del mes">' +
            '<div class="cifra"><p class="etiqueta">Ingresos</p><p class="monto">' + S(a.ingresos) + '</p>' + (c.hayPrevio ? delta(variacion(a.ingresos, p.ingresos), c.etiqueta, true) : '') + '</div>' +
            '<div class="cifra"><p class="etiqueta">Gastos</p><p class="monto">' + S(a.gastos) + '</p>' + (c.hayPrevio ? delta(variacion(a.gastos, p.gastos), c.etiqueta, false) : '') + '</div>' +
            '<div class="cifra cifra--fuerte"><p class="etiqueta">Ganancia</p><p class="monto' + (a.ganancia < 0 ? ' monto--neg' : '') + '">' + S(a.ganancia) + '</p><span class="delta">Margen ' + pct(margen) + '</span></div>' +
          '</section>' +

          '<section class="panel">' +
            '<header class="panel__cabeza"><h2>Ingresos y gastos</h2>' +
              '<ul class="leyenda"><li><i class="punto punto--ing"></i>Ingresos</li><li><i class="punto punto--gas"></i>Gastos</li></ul></header>' +
            '<div class="grafico" id="grafico"></div>' +
            '<p class="nota-pie">Toca un mes para ver su detalle.' + (est.mes >= L.moverMes(L.claveMes(L.hoy()), -5) ? ' El mes en curso va hasta hoy.' : '') + '</p>' +
          '</section>' +

          '<section class="panel">' +
            '<header class="panel__cabeza"><h2>¿En qué se fue el dinero?</h2><span class="panel__dato">' + S(a.gastos) + '</span></header>' +
            (cats.length ? '<ul class="cats">' + cats.map(function (x) {
              var cat = L.categoria(x.id);
              return '<li><span class="cats__ico">' + icono(cat.icono) + '</span>' +
                '<span class="cats__nombre">' + esc(cat.nombre) + '</span>' +
                '<span class="cats__monto">' + S(x.monto) + '</span>' +
                '<span class="cats__pct">' + pct(x.monto / a.gastos * 100) + '</span>' +
                '<span class="cats__barra"><i style="width:' + (x.monto / maxCat * 100).toFixed(1) + '%"></i></span></li>';
            }).join('') + '</ul>' : '<p class="vacio">No hay gastos en este mes.</p>') +
          '</section>' +
        '</div>' +

        '<div class="col">' +
          '<section class="panel disponible">' +
            '<p class="etiqueta">Dinero disponible hoy</p>' +
            '<p class="monto monto--xl">' + S(total) + '</p>' +
            '<div class="reparto" aria-hidden="true">' + D.cuentas.map(function (ct) {
              return '<i style="flex:' + Math.max(s[ct.id], 0) + ';background:' + COLOR_CUENTA[ct.id] + '"></i>';
            }).join('') + '</div>' +
            '<ul class="cuentas">' + D.cuentas.map(function (ct) {
              return '<li><i class="punto" style="background:' + COLOR_CUENTA[ct.id] + '"></i><span>' + esc(ct.nombre) + '</span><b>' + S(s[ct.id]) + '</b></li>';
            }).join('') + '</ul>' +
          '</section>' +

          '<section class="panel">' +
            '<header class="panel__cabeza"><h2>Próximos 15 días</h2><a class="enlace" href="#/deudas">Ver todo</a></header>' +
            (prox.length ? '<ul class="prox">' + prox.slice(0, 6).map(function (d) {
              var dias = L.diasEntre(L.hoy(), d.vence);
              return '<li class="' + (dias < 0 ? 'is-vencida' : '') + '">' +
                '<span class="prox__fecha"><b>' + L.fechaCorta(d.vence).split(' ')[0] + '</b>' + L.fechaCorta(d.vence).split(' ')[1] + '</span>' +
                '<span class="prox__texto"><b>' + esc(d.nombre) + '</b><small>' + (dias < 0 ? 'Vencida hace ' + (-dias) + (dias === -1 ? ' día' : ' días') : d.tipo === 'cobrar' ? 'Te deben' : 'Debes pagar') + '</small></span>' +
                '<span class="prox__monto ' + (d.tipo === 'cobrar' ? 'is-ing' : '') + '">' + S(d.tipo === 'cobrar' ? d.saldo : -d.saldo, true) + '</span></li>';
            }).join('') + '</ul>' : '<p class="vacio">Nada por cobrar ni pagar en estos días.</p>') +
            '<dl class="proyeccion">' +
              '<div><dt>Disponible hoy</dt><dd>' + S(total) + '</dd></div>' +
              '<div><dt>Por cobrar</dt><dd class="is-ing">' + S(cobrar, true) + '</dd></div>' +
              '<div><dt>Por pagar</dt><dd>' + S(-pagar) + '</dd></div>' +
              '<div class="proyeccion__total"><dt>Te quedaría el ' + L.fechaCorta(limite) + '</dt><dd>' + S(total + cobrar - pagar) + '</dd></div>' +
            '</dl>' +
            '<p class="nota-pie">Sin contar las ventas de esos días.</p>' +
          '</section>' +
        '</div>' +
      '</div>';

    dibujarGrafico();
  }

  function pasoBonito(max) {
    var pasos = [1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
    for (var i = 0; i < pasos.length; i++) if (max / pasos[i] <= 4) return pasos[i];
    return 200000;
  }
  function etiquetaY(v) { return v === 0 ? '0' : (v >= 1000 ? (v / 1000).toLocaleString('es-PE') + ' mil' : v); }

  function dibujarGrafico() {
    var cont = document.getElementById('grafico');
    if (!cont) return;
    var datos = L.serie(L.claveMes(L.hoy()), 6);
    var W = Math.max(cont.clientWidth, 280), H = 220;
    var izq = 52, der = 4, arr = 10, aba = 28;
    var max = 0; datos.forEach(function (d) { max = Math.max(max, d.t.ingresos, d.t.gastos); });
    var paso = pasoBonito(max), tope = Math.ceil(max / paso) * paso || paso;
    var alto = H - arr - aba, ancho = W - izq - der;
    function y(v) { return arr + alto - v / tope * alto; }
    var gw = ancho / datos.length, bw = Math.min(26, gw * 0.3);

    var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ingresos y gastos de los últimos 6 meses">';
    for (var v = 0; v <= tope; v += paso) {
      svg += '<line class="g-linea" x1="' + izq + '" x2="' + (W - der) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="g-eje" x="' + (izq - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + etiquetaY(v) + '</text>';
    }
    datos.forEach(function (d, i) {
      var cx = izq + gw * i + gw / 2;
      var actual = i === datos.length - 1;
      var sel = d.clave === est.mes;
      svg += '<g class="g-mes' + (sel ? ' is-sel' : '') + (actual ? ' is-actual' : '') + '" data-mesg="' + d.clave + '" tabindex="0" role="button" aria-label="' +
        esc(may(L.mesNombre(d.clave, true))) + ': ingresos ' + S(d.t.ingresos) + ', gastos ' + S(d.t.gastos) + '">' +
        '<rect class="g-zona" x="' + (izq + gw * i + 2) + '" y="' + arr + '" width="' + (gw - 4) + '" height="' + alto + '" rx="6"/>' +
        '<rect class="g-ing" x="' + (cx - bw - 2) + '" y="' + y(d.t.ingresos) + '" width="' + bw + '" height="' + (y(0) - y(d.t.ingresos)) + '" rx="3"/>' +
        '<rect class="g-gas" x="' + (cx + 2) + '" y="' + y(d.t.gastos) + '" width="' + bw + '" height="' + (y(0) - y(d.t.gastos)) + '" rx="3"/>' +
        '<text class="g-mesnom" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + may(L.mesNombre(d.clave).slice(0, 3)) + (actual ? '*' : '') + '</text>' +
        '<title>' + esc(may(L.mesNombre(d.clave, true))) + ' — Ingresos ' + S(d.t.ingresos) + ' · Gastos ' + S(d.t.gastos) + '</title></g>';
    });
    svg += '</svg>';
    cont.innerHTML = svg;
  }

  /* =========================================================
     Movimientos
     ========================================================= */
  function filtrar(lista) {
    var f = est.filtro, q = f.q.trim().toLowerCase();
    return lista.filter(function (m) {
      if (f.tipo !== 'todos' && m.tipo !== f.tipo) return false;
      if (f.cuenta !== 'todas' && m.cuenta !== f.cuenta && m.destino !== f.cuenta) return false;
      if (q) {
        var txt = (m.nota + ' ' + (m.categoria ? L.categoria(m.categoria).nombre : '') + ' ' + L.cuenta(m.cuenta).nombre).toLowerCase();
        if (txt.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function filaMov(m) {
    var cat = L.categoria(m.categoria);
    var trans = m.tipo === 'transferencia';
    var signo = m.tipo === 'ingreso' ? m.monto : m.tipo === 'gasto' ? -m.monto : m.monto;
    return '<li><button type="button" class="mov mov--' + m.tipo + '" data-mov="' + m.id + '">' +
      '<span class="mov__ico">' + icono(trans ? 'arrows-exchange' : cat.icono) + '</span>' +
      '<span class="mov__texto"><b>' + esc(m.nota) + '</b><small>' + esc(trans ? 'Transferencia' : cat.nombre) + '</small></span>' +
      '<span class="mov__cuenta">' + esc(L.cuenta(m.cuenta).corto) + (trans ? ' → ' + esc(L.cuenta(m.destino).corto) : '') + '</span>' +
      '<span class="mov__monto">' + (trans ? S(m.monto) : S(signo, true)) + '</span>' +
      '</button></li>';
  }

  function pintarMovimientos() {
    var f = est.filtro;
    var lista = filtrar(L.delMes(est.mes)).slice().reverse();
    var t = L.totales(lista);
    var grupos = [], porFecha = {};
    lista.forEach(function (m) {
      if (!porFecha[m.fecha]) { porFecha[m.fecha] = []; grupos.push(m.fecha); }
      porFecha[m.fecha].push(m);
    });
    function chip(v, txt) { return '<button type="button" class="seg__op' + (f.tipo === v ? ' is-on' : '') + '" data-tipo="' + v + '" aria-pressed="' + (f.tipo === v) + '">' + txt + '</button>'; }

    vista.innerHTML =
      '<div class="cabeza">' +
        '<div><p class="cabeza__pre">' + lista.length + ' movimientos</p><h1>Movimientos</h1></div>' +
        '<div class="cabeza__acciones">' + selectorMes() +
        '<button type="button" class="btn btn--claro" id="exportar">' + icono('file-spreadsheet') + '<span>Descargar para el contador</span></button></div>' +
      '</div>' +
      '<div class="filtros">' +
        '<div class="seg" role="group" aria-label="Tipo">' + chip('todos', 'Todos') + chip('ingreso', 'Ingresos') + chip('gasto', 'Gastos') + chip('transferencia', 'Transferencias') + '</div>' +
        '<select class="campo campo--chico" id="f-cuenta" aria-label="Cuenta"><option value="todas">Todas las cuentas</option>' +
          D.cuentas.map(function (c) { return '<option value="' + c.id + '"' + (f.cuenta === c.id ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '</select>' +
        '<label class="buscar">' + icono('search') + '<input class="campo campo--chico" id="f-q" type="search" placeholder="Buscar" value="' + esc(f.q) + '" aria-label="Buscar movimiento"></label>' +
      '</div>' +
      '<div class="panel tira">' +
        '<div><span>Ingresos</span><b class="is-ing">' + S(t.ingresos) + '</b></div>' +
        '<div><span>Gastos</span><b>' + S(-t.gastos) + '</b></div>' +
        '<div><span>Diferencia</span><b>' + S(t.ganancia, true) + '</b></div>' +
      '</div>' +
      (grupos.length ? grupos.map(function (g) {
        var tg = L.totales(porFecha[g]);
        return '<section class="dia"><header class="dia__cabeza"><h2>' + may(L.fechaLarga(g)) + (g === L.hoy() ? ' · hoy' : '') + '</h2>' +
          '<span>' + S(tg.ganancia, true) + '</span></header>' +
          '<ul class="panel lista">' + porFecha[g].map(filaMov).join('') + '</ul></section>';
      }).join('') : '<p class="panel vacio">No hay movimientos con esos filtros.</p>');

    var q = document.getElementById('f-q');
    q.addEventListener('input', function () {
      est.filtro.q = q.value;
      var pos = q.selectionStart;
      pintarMovimientos();
      var n = document.getElementById('f-q'); n.focus(); n.setSelectionRange(pos, pos);
    });
    document.getElementById('f-cuenta').addEventListener('change', function (e) { est.filtro.cuenta = e.target.value; pintarMovimientos(); });
  }

  function exportar() {
    var blob = new Blob([L.csv(est.mes)], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'movimientos-' + est.mes + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    aviso('Se descargó el archivo de ' + L.mesNombre(est.mes) + '. Se abre en Excel.');
  }

  /* =========================================================
     Por cobrar y por pagar
     ========================================================= */
  function estadoVence(d) {
    var dias = L.diasEntre(L.hoy(), d.vence);
    if (d.saldo <= 0) return { clase: 'ok', txt: 'Pagada' };
    if (dias < 0) return { clase: 'mal', txt: 'Vencida hace ' + (-dias) + (dias === -1 ? ' día' : ' días') };
    if (dias === 0) return { clase: 'alerta', txt: 'Vence hoy' };
    if (dias <= 7) return { clase: 'alerta', txt: 'Vence en ' + dias + (dias === 1 ? ' día' : ' días') };
    return { clase: '', txt: 'Vence el ' + L.fechaCorta(d.vence) };
  }

  function pintarDeudas() {
    var tipo = est.deudas;
    var todas = L.deudas(tipo);
    var pend = todas.filter(function (d) { return d.saldo > 0; });
    var pagadas = todas.filter(function (d) { return d.saldo <= 0; });
    var tot = 0, venc = 0, sem = 0;
    pend.forEach(function (d) {
      var dias = L.diasEntre(L.hoy(), d.vence);
      tot += d.saldo; if (dias < 0) venc += d.saldo; else if (dias <= 7) sem += d.saldo;
    });
    var totCobrar = L.deudas('cobrar').reduce(function (s, d) { return s + Math.max(d.saldo, 0); }, 0);
    var totPagar = L.deudas('pagar').reduce(function (s, d) { return s + Math.max(d.saldo, 0); }, 0);
    var cobrar = tipo === 'cobrar';

    function tarjeta(d) {
      var e = estadoVence(d);
      var avance = d.pagado > 0 ? Math.min(d.pagado / d.monto * 100, 100) : 0;
      return '<li class="deuda">' +
        '<div class="deuda__info"><b>' + esc(d.nombre) + '</b><small>' + esc(d.concepto) + '</small>' +
          '<span class="estado estado--' + e.clase + '">' + esc(e.txt) + '</span></div>' +
        '<div class="deuda__monto"><b>' + S(Math.max(d.saldo, 0)) + '</b>' +
          (d.pagado > 0 ? '<small>de ' + S(d.monto) + ' · ' + (cobrar ? 'cobrado ' : 'pagado ') + S(d.pagado) + '</small><span class="avance"><i style="width:' + avance.toFixed(0) + '%"></i></span>' : '<small>' + (cobrar ? 'Por cobrar' : 'Por pagar') + '</small>') +
        '</div>' +
        (d.saldo > 0 ? '<button type="button" class="btn btn--claro btn--chico" data-pagar="' + d.id + '">' + icono(cobrar ? 'cash' : 'send') + (cobrar ? 'Registrar cobro' : 'Registrar pago') + '</button>' : '') +
        '</li>';
    }

    vista.innerHTML =
      '<div class="cabeza">' +
        '<div><p class="cabeza__pre">Créditos a clientes y facturas de proveedores</p><h1>Por cobrar y por pagar</h1></div>' +
        '<button type="button" class="btn btn--claro" id="nueva-deuda">' + icono('plus') + '<span>Nueva ' + (cobrar ? 'cuenta por cobrar' : 'cuenta por pagar') + '</span></button>' +
      '</div>' +
      '<div class="seg seg--grande" role="group" aria-label="Tipo">' +
        '<button type="button" class="seg__op' + (cobrar ? ' is-on' : '') + '" data-deudas="cobrar" aria-pressed="' + cobrar + '">Me deben <b>' + S(totCobrar) + '</b></button>' +
        '<button type="button" class="seg__op' + (!cobrar ? ' is-on' : '') + '" data-deudas="pagar" aria-pressed="' + !cobrar + '">Debo <b>' + S(totPagar) + '</b></button>' +
      '</div>' +
      '<div class="panel tira">' +
        '<div><span>Total pendiente</span><b>' + S(tot) + '</b></div>' +
        '<div><span>Vencido</span><b class="' + (venc > 0 ? 'is-mal' : '') + '">' + S(venc) + '</b></div>' +
        '<div><span>Vence en 7 días</span><b>' + S(sem) + '</b></div>' +
      '</div>' +
      (pend.length ? '<ul class="panel lista deudas">' + pend.map(tarjeta).join('') + '</ul>' : '<p class="panel vacio">' + (cobrar ? 'Nadie te debe. ' : 'No tienes deudas pendientes. ') + '</p>') +
      (pagadas.length ? '<details class="pagadas"><summary>' + (cobrar ? 'Cobradas' : 'Pagadas') + ' (' + pagadas.length + ')</summary><ul class="panel lista deudas">' + pagadas.map(tarjeta).join('') + '</ul></details>' : '');
  }

  /* =========================================================
     Cierre de caja
     ========================================================= */
  function pintarCaja() {
    var h = L.hoy(), ayer = L.sumarDias(h, -1);
    var inicial = L.saldos(ayer).caja;
    var ent = 0, sal = 0, dep = 0;
    L.movimientos.forEach(function (m) {
      if (m.fecha !== h || /cierre de caja/.test(m.nota)) return;
      if (m.tipo === 'ingreso' && m.cuenta === 'caja') ent += m.monto;
      if (m.tipo === 'gasto' && m.cuenta === 'caja') sal += m.monto;
      if (m.tipo === 'transferencia' && m.cuenta === 'caja') dep += m.monto;
      if (m.tipo === 'transferencia' && m.destino === 'caja') dep -= m.monto;
    });
    var cierre = L.cierreDe(h);
    var esperado = cierre ? cierre.esperado : L.r2(inicial + ent - sal - dep);
    var hist = L.cierres.slice().reverse().slice(0, 10);

    function filaConteo(v, i) {
      var n = est.conteo[v] || 0;
      return '<li><span class="conteo__den">' + (v >= 10 ? 'Billete' : 'Moneda') + ' <b>' + S(v).replace('.00', '') + '</b></span>' +
        '<span class="conteo__ctrl"><button type="button" class="conteo__btn" data-cont="' + v + '" data-d="-1" aria-label="Quitar uno de ' + v + '">' + icono('minus') + '</button>' +
        '<input class="conteo__n" inputmode="numeric" data-n="' + v + '" value="' + n + '" aria-label="Cantidad de ' + (v >= 10 ? 'billetes' : 'monedas') + ' de ' + v + '">' +
        '<button type="button" class="conteo__btn" data-cont="' + v + '" data-d="1" aria-label="Agregar uno de ' + v + '">' + icono('plus') + '</button></span>' +
        '<span class="conteo__sub" data-sub="' + v + '">' + S(n * v) + '</span></li>';
    }

    var cuadro =
      '<dl class="cuadro">' +
        '<div><dt>Efectivo al cierre de ayer</dt><dd>' + S(inicial) + '</dd></div>' +
        '<div><dt>Entradas en efectivo de hoy</dt><dd class="is-ing">' + S(ent, true) + '</dd></div>' +
        '<div><dt>Gastos pagados en efectivo</dt><dd>' + S(-sal) + '</dd></div>' +
        '<div><dt>Depósitos al banco</dt><dd>' + S(-dep) + '</dd></div>' +
        '<div class="cuadro__total"><dt>Debería haber en caja</dt><dd>' + S(esperado) + '</dd></div>' +
      '</dl>';

    var historial =
      '<section class="panel historial"><header class="panel__cabeza"><h2>Cierres anteriores</h2></header>' +
        '<div class="tabla-scroll"><table class="tabla"><thead><tr><th scope="col">Fecha</th><th scope="col">Debía haber</th><th scope="col">Se contó</th><th scope="col">Diferencia</th></tr></thead><tbody>' +
        hist.map(function (c) {
          return '<tr><td>' + may(L.fechaLarga(c.fecha).replace(/ de \S+$/, '')) + '</td><td>' + S(c.esperado) + '</td><td>' + S(c.contado) + '</td>' +
            '<td class="' + (c.diferencia < 0 ? 'is-mal' : c.diferencia > 0 ? 'is-ing' : 'is-ok') + '">' + (c.diferencia === 0 ? 'Cuadró' : S(c.diferencia, true)) + '</td></tr>';
        }).join('') +
        '</tbody></table></div></section>';

    vista.innerHTML =
      '<div class="cabeza">' +
        '<div><p class="cabeza__pre">' + may(L.fechaLarga(h)) + '</p><h1>Cierre de caja</h1></div>' +
      '</div>' +
      '<div class="rejilla rejilla--caja"><div class="col">' +
        '<section class="panel"><header class="panel__cabeza"><h2>Lo que dice el sistema</h2></header>' + cuadro +
          '<p class="nota-pie">Sale de las ventas y gastos en efectivo que se registraron hoy.</p></section>' +
        historial + '</div>' +
        (cierre
          ? '<section class="panel cerrado">' + icono(cierre.diferencia === 0 ? 'circle-check' : 'alert-circle') +
              '<h2>Caja cerrada</h2><p>' + esc(cierre.quien) + ' contó <b>' + S(cierre.contado) + '</b>. ' +
              (cierre.diferencia === 0 ? 'La caja cuadró.' : (cierre.diferencia < 0 ? 'Faltaron ' : 'Sobraron ') + '<b>' + S(Math.abs(cierre.diferencia)) + '</b> y quedó registrado.') + '</p>' +
              '<p class="nota-pie">Mañana empiezas con ' + S(cierre.contado) + ' en caja.</p></section>'
          : '<section class="panel"><header class="panel__cabeza"><h2>Cuenta el efectivo</h2><button type="button" class="enlace" id="limpiar-conteo">Limpiar</button></header>' +
              '<ul class="conteo">' + BILLETES.concat(MONEDAS).map(filaConteo).join('') + '</ul>' +
              '<div class="resultado" id="resultado"></div>' +
              '<button type="button" class="btn btn--bloque" id="cerrar-caja">' + icono('lock') + 'Cerrar caja de hoy</button>' +
            '</section>') +
      '</div>';

    if (!cierre) actualizarConteo(esperado);
  }

  function totalConteo() {
    var t = 0; Object.keys(est.conteo).forEach(function (k) { t += parseFloat(k) * (est.conteo[k] || 0); });
    return L.r2(t);
  }

  function actualizarConteo(esperado) {
    var t = totalConteo();
    var dif = L.r2(t - esperado);
    var r = document.getElementById('resultado');
    if (!r) return;
    var clase = t === 0 ? '' : dif === 0 ? 'is-ok' : 'is-mal';
    var txt = t === 0 ? 'Ingresa cuántos billetes y monedas hay.' : dif === 0 ? 'La caja cuadra.' : (dif < 0 ? 'Faltan ' : 'Sobran ') + S(Math.abs(dif));
    r.className = 'resultado ' + clase;
    r.innerHTML = '<div><span>Contaste</span><b>' + S(t) + '</b></div><p>' + txt + '</p>';
    r.dataset.esperado = esperado;
    document.getElementById('cerrar-caja').disabled = t === 0;
    Object.keys(est.conteo).forEach(function (k) {
      var s = vista.querySelector('[data-sub="' + k + '"]'); if (s) s.textContent = S(parseFloat(k) * (est.conteo[k] || 0));
    });
  }

  /* =========================================================
     Hojas (ventanas)
     ========================================================= */
  function abrirHoja(html, alAbrir) {
    hojaCaja.innerHTML = '<button type="button" class="hoja__cerrar" data-cerrar aria-label="Cerrar">' + icono('x') + '</button>' + html;
    if (!hoja.open) hoja.showModal();
    if (alAbrir) alAbrir();
  }
  function cerrarHoja() { if (hoja.open) hoja.close(); }
  hoja.addEventListener('click', function (e) { if (e.target === hoja || e.target.closest('[data-cerrar]')) cerrarHoja(); });

  function opcionesCuenta(nombre, marcada) {
    return '<div class="ctas" role="radiogroup">' + D.cuentas.map(function (c) {
      return '<label class="cta"><input type="radio" name="' + nombre + '" value="' + c.id + '"' + (c.id === marcada ? ' checked' : '') + '>' +
        '<span>' + icono(c.icono) + esc(c.corto) + '</span></label>';
    }).join('') + '</div>';
  }

  function hojaRegistrar(tipo) {
    tipo = tipo || 'gasto';
    function opsCat(t) { return D.categorias[t].map(function (c) { return '<option value="' + c.id + '">' + esc(c.nombre) + '</option>'; }).join(''); }
    abrirHoja(
      '<h2 id="hoja-titulo">Registrar movimiento</h2>' +
      '<form class="form" id="form-mov" novalidate>' +
        '<div class="seg seg--lleno" role="radiogroup" aria-label="Tipo">' +
          ['ingreso', 'gasto', 'transferencia'].map(function (t) {
            return '<label class="seg__op"><input type="radio" name="tipo" value="' + t + '"' + (t === tipo ? ' checked' : '') + '><span>' + { ingreso: 'Ingreso', gasto: 'Gasto', transferencia: 'Transferencia' }[t] + '</span></label>';
          }).join('') +
        '</div>' +
        '<label class="form__campo">Monto<span class="dinero"><span>S/</span><input class="campo campo--dinero" name="monto" inputmode="decimal" placeholder="0.00" autocomplete="off" required></span></label>' +
        '<fieldset class="form__campo"><legend id="lbl-cuenta">' + (tipo === 'ingreso' ? 'Entró a' : 'Salió de') + '</legend>' + opcionesCuenta('cuenta', 'caja') + '</fieldset>' +
        '<fieldset class="form__campo" id="campo-destino"' + (tipo === 'transferencia' ? '' : ' hidden') + '><legend>Pasó a</legend>' + opcionesCuenta('destino', 'bcp') + '</fieldset>' +
        '<label class="form__campo" id="campo-cat"' + (tipo === 'transferencia' ? ' hidden' : '') + '>Categoría<select class="campo" name="categoria">' + opsCat(tipo === 'transferencia' ? 'gasto' : tipo) + '</select></label>' +
        '<div class="form__dos">' +
          '<label class="form__campo">Fecha<input class="campo" type="date" name="fecha" value="' + L.hoy() + '" max="' + L.hoy() + '" required></label>' +
          '<label class="form__campo">Detalle<input class="campo" name="nota" placeholder="Ej. Recibo de luz" maxlength="80"></label>' +
        '</div>' +
        '<p class="form__error" id="form-error" role="alert"></p>' +
        '<button type="submit" class="btn btn--bloque">Guardar</button>' +
      '</form>',
      function () {
        var f = document.getElementById('form-mov');
        f.monto.focus();
        f.addEventListener('change', function (e) {
          if (e.target.name !== 'tipo') return;
          var t = e.target.value;
          document.getElementById('campo-destino').hidden = t !== 'transferencia';
          document.getElementById('campo-cat').hidden = t === 'transferencia';
          document.getElementById('lbl-cuenta').textContent = t === 'ingreso' ? 'Entró a' : 'Salió de';
          if (t !== 'transferencia') f.categoria.innerHTML = opsCat(t);
        });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var err = document.getElementById('form-error');
          var t = f.tipo.value, monto = parseFloat(String(f.monto.value).replace(',', '.'));
          if (!(monto > 0)) { err.textContent = 'Escribe un monto mayor a cero.'; f.monto.focus(); return; }
          if (!f.fecha.value) { err.textContent = 'Elige la fecha.'; return; }
          if (t === 'transferencia' && f.cuenta.value === f.destino.value) { err.textContent = 'Elige dos cuentas distintas.'; return; }
          var m = { fecha: f.fecha.value, tipo: t, monto: monto, cuenta: f.cuenta.value, categoria: t === 'transferencia' ? null : f.categoria.value };
          m.nota = f.nota.value.trim() || (t === 'transferencia' ? 'Transferencia entre cuentas' : L.categoria(m.categoria).nombre);
          if (t === 'transferencia') m.destino = f.destino.value;
          L.agregar(m);
          est.mes = L.claveMes(m.fecha);
          cerrarHoja();
          aviso({ ingreso: 'Ingreso', gasto: 'Gasto', transferencia: 'Transferencia' }[t] + ' de ' + S(monto) + ' registrado.');
        });
      }
    );
  }

  function hojaDetalle(id) {
    var m = L.movimientos.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var trans = m.tipo === 'transferencia';
    abrirHoja(
      '<p class="hoja__pre">' + { ingreso: 'Ingreso', gasto: 'Gasto', transferencia: 'Transferencia' }[m.tipo] + '</p>' +
      '<h2 id="hoja-titulo">' + esc(m.nota) + '</h2>' +
      '<p class="hoja__monto mov--' + m.tipo + '">' + (trans ? S(m.monto) : S(m.tipo === 'ingreso' ? m.monto : -m.monto, true)) + '</p>' +
      '<dl class="ficha">' +
        '<div><dt>Fecha</dt><dd>' + may(L.fechaLarga(m.fecha)) + '</dd></div>' +
        (trans ? '<div><dt>De</dt><dd>' + esc(L.cuenta(m.cuenta).nombre) + '</dd></div><div><dt>A</dt><dd>' + esc(L.cuenta(m.destino).nombre) + '</dd></div>'
               : '<div><dt>Cuenta</dt><dd>' + esc(L.cuenta(m.cuenta).nombre) + '</dd></div><div><dt>Categoría</dt><dd>' + esc(L.categoria(m.categoria).nombre) + '</dd></div>') +
      '</dl>' +
      '<button type="button" class="btn btn--peligro btn--bloque" id="borrar-mov">' + icono('trash') + 'Eliminar movimiento</button>',
      function () {
        document.getElementById('borrar-mov').addEventListener('click', function () {
          if (!confirm('¿Eliminar este movimiento? Los saldos se recalculan.')) return;
          L.eliminar(id); cerrarHoja(); aviso('Movimiento eliminado.');
        });
      }
    );
  }

  function hojaPago(id) {
    var d = L.deudas('cobrar').concat(L.deudas('pagar')).filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    var cobrar = d.tipo === 'cobrar';
    abrirHoja(
      '<p class="hoja__pre">' + (cobrar ? 'Registrar cobro' : 'Registrar pago') + '</p>' +
      '<h2 id="hoja-titulo">' + esc(d.nombre) + '</h2>' +
      '<p class="hoja__sub">' + esc(d.concepto) + ' · pendiente <b>' + S(d.saldo) + '</b></p>' +
      '<form class="form" id="form-pago" novalidate>' +
        '<label class="form__campo">' + (cobrar ? '¿Cuánto te pagó?' : '¿Cuánto pagaste?') + '<span class="dinero"><span>S/</span><input class="campo campo--dinero" name="monto" inputmode="decimal" value="' + d.saldo.toFixed(2) + '" required></span></label>' +
        '<fieldset class="form__campo"><legend>' + (cobrar ? 'Entró a' : 'Salió de') + '</legend>' + opcionesCuenta('cuenta', cobrar ? 'bcp' : 'bcp') + '</fieldset>' +
        '<p class="form__error" id="form-error" role="alert"></p>' +
        '<button type="submit" class="btn btn--bloque">' + (cobrar ? 'Guardar cobro' : 'Guardar pago') + '</button>' +
      '</form>',
      function () {
        var f = document.getElementById('form-pago');
        f.monto.select();
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var monto = parseFloat(String(f.monto.value).replace(',', '.'));
          var err = document.getElementById('form-error');
          if (!(monto > 0)) { err.textContent = 'Escribe un monto mayor a cero.'; return; }
          if (monto > d.saldo + 0.001) { err.textContent = 'El monto no puede ser mayor a lo pendiente (' + S(d.saldo) + ').'; return; }
          L.pagarDeuda(id, monto, f.cuenta.value);
          cerrarHoja();
          aviso((cobrar ? 'Cobro' : 'Pago') + ' de ' + S(monto) + ' registrado. Ya está en movimientos.');
        });
      }
    );
  }

  function hojaNuevaDeuda() {
    var cobrar = est.deudas === 'cobrar';
    abrirHoja(
      '<h2 id="hoja-titulo">' + (cobrar ? 'Nueva cuenta por cobrar' : 'Nueva cuenta por pagar') + '</h2>' +
      '<form class="form" id="form-deuda" novalidate>' +
        '<label class="form__campo">' + (cobrar ? 'Cliente' : 'Proveedor') + '<input class="campo" name="nombre" maxlength="60" required placeholder="' + (cobrar ? 'Ej. Constructora Huamán' : 'Ej. Distribuidora del Sur') + '"></label>' +
        '<label class="form__campo">Detalle<input class="campo" name="concepto" maxlength="80" placeholder="Ej. Factura F001-2520"></label>' +
        '<div class="form__dos">' +
          '<label class="form__campo">Monto<span class="dinero"><span>S/</span><input class="campo campo--dinero" name="monto" inputmode="decimal" placeholder="0.00" required></span></label>' +
          '<label class="form__campo">Vence<input class="campo" type="date" name="vence" value="' + L.sumarDias(L.hoy(), 15) + '" required></label>' +
        '</div>' +
        '<p class="form__error" id="form-error" role="alert"></p>' +
        '<button type="submit" class="btn btn--bloque">Guardar</button>' +
      '</form>',
      function () {
        var f = document.getElementById('form-deuda');
        f.nombre.focus();
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var monto = parseFloat(String(f.monto.value).replace(',', '.'));
          var err = document.getElementById('form-error');
          if (!f.nombre.value.trim()) { err.textContent = 'Escribe el nombre.'; f.nombre.focus(); return; }
          if (!(monto > 0)) { err.textContent = 'Escribe un monto mayor a cero.'; return; }
          if (!f.vence.value) { err.textContent = 'Elige la fecha de vencimiento.'; return; }
          L.agregarDeuda({ tipo: est.deudas, nombre: f.nombre.value.trim(), concepto: f.concepto.value.trim() || 'Sin detalle', monto: monto, vence: f.vence.value });
          cerrarHoja(); aviso('Guardado.');
        });
      }
    );
  }

  /* =========================================================
     Navegación y eventos
     ========================================================= */
  var VISTAS = { resumen: pintarResumen, movimientos: pintarMovimientos, deudas: pintarDeudas, caja: pintarCaja };
  function actual() { var v = location.hash.replace('#/', ''); return VISTAS[v] ? v : 'resumen'; }

  function pintar() {
    var v = actual();
    document.querySelectorAll('[data-vista]').forEach(function (a) {
      if (a.dataset.vista === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    VISTAS[v]();
  }

  window.addEventListener('hashchange', function () { pintar(); window.scrollTo(0, 0); });
  L.alCambiar(pintar);

  vista.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-mes]'))) { est.mes = L.moverMes(est.mes, +t.dataset.mes); pintar(); return; }
    if ((t = e.target.closest('[data-mesg]'))) { est.mes = t.dataset.mesg; pintar(); return; }
    if ((t = e.target.closest('[data-tipo]'))) { est.filtro.tipo = t.dataset.tipo; pintar(); return; }
    if ((t = e.target.closest('[data-mov]'))) { hojaDetalle(t.dataset.mov); return; }
    if ((t = e.target.closest('[data-deudas]'))) { est.deudas = t.dataset.deudas; pintar(); return; }
    if ((t = e.target.closest('[data-pagar]'))) { hojaPago(t.dataset.pagar); return; }
    if (e.target.closest('#nueva-deuda')) { hojaNuevaDeuda(); return; }
    if (e.target.closest('#exportar')) { exportar(); return; }
    if ((t = e.target.closest('[data-cont]'))) {
      var v = t.dataset.cont;
      est.conteo[v] = Math.max(0, (est.conteo[v] || 0) + (+t.dataset.d));
      var inp = vista.querySelector('[data-n="' + v + '"]'); if (inp) inp.value = est.conteo[v];
      actualizarConteo(+document.getElementById('resultado').dataset.esperado);
      return;
    }
    if (e.target.closest('#limpiar-conteo')) { est.conteo = {}; pintar(); return; }
    if (e.target.closest('#cerrar-caja')) {
      var dif = L.cerrarCaja(totalConteo());
      est.conteo = {};
      aviso(dif === 0 ? 'Caja cerrada. Cuadró exacto.' : 'Caja cerrada con ' + (dif < 0 ? 'faltante' : 'sobrante') + ' de ' + S(Math.abs(dif)) + '.');
    }
  });
  vista.addEventListener('keydown', function (e) {
    var g = e.target.closest('[data-mesg]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); est.mes = g.dataset.mesg; pintar(); }
  });
  vista.addEventListener('input', function (e) {
    var v = e.target.dataset && e.target.dataset.n;
    if (!v) return;
    est.conteo[v] = Math.max(0, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0);
    actualizarConteo(+document.getElementById('resultado').dataset.esperado);
  });

  document.getElementById('registrar').addEventListener('click', function () { hojaRegistrar('gasto'); });
  document.getElementById('reiniciar').addEventListener('click', function () {
    if (!confirm('¿Volver a los datos de ejemplo? Se borra lo que registraste.')) return;
    est.mes = L.claveMes(L.hoy()); est.conteo = {};
    L.reiniciar(); aviso('Demo reiniciada.');
  });

  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(dibujarGrafico, 120); });

  document.getElementById('nombre-negocio').textContent = D.negocio.nombre;
  pintar();
})();
