/* Libro de caja: guarda movimientos, deudas y cierres en este navegador */
(function () {
  'use strict';
  var D = window.FINANZAS_DATOS;
  var CLAVE = 'rratsoft-finanzas-v1';
  var VERSION = 2;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ---------- */
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }
  function aFecha(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hoy() { return iso(new Date()); }
  function sumarDias(s, n) { var d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); }
  function diasEntre(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 864e5); }
  function claveMes(s) { return s.slice(0, 7); }
  function mesNombre(clave, conAnio) {
    var p = clave.split('-'); var n = MESES[+p[1] - 1];
    return conAnio ? n + ' ' + p[0] : n;
  }
  function moverMes(clave, n) {
    var p = clave.split('-'); var d = new Date(+p[0], +p[1] - 1 + n, 1);
    return d.getFullYear() + '-' + dos(d.getMonth() + 1);
  }
  function fechaLarga(s) { var d = aFecha(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function fechaCorta(s) { var d = aFecha(s); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3); }

  /* ---------- Dinero ---------- */
  function r2(n) { return Math.round(n * 100) / 100; }
  function soles(n, conSigno) {
    var t = Math.abs(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var s = n < 0 ? '−' : (conSigno && n > 0 ? '+' : '');
    return s + 'S/ ' + t;
  }

  /* ---------- Datos de ejemplo ---------- */
  function azar(semilla) {
    return function () {
      semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
      var t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function ejemplo() {
    var r = azar(20261);
    function entre(a, b) { return r2(a + r() * (b - a)); }
    function uno(lista) { return lista[Math.floor(r() * lista.length)]; }

    var hoyS = hoy();
    var inicio = moverMes(claveMes(hoyS), -5) + '-01';
    var saldo = {}; D.cuentas.forEach(function (c) { saldo[c.id] = c.inicial; });
    var movs = []; var cierres = []; var sig = 1;

    function mov(fecha, tipo, monto, cuenta, categoria, nota, destino) {
      monto = r2(monto);
      var m = { id: 'm' + (sig++), fecha: fecha, tipo: tipo, monto: monto, cuenta: cuenta, categoria: categoria || null, nota: nota };
      if (destino) m.destino = destino;
      movs.push(m);
      if (tipo === 'ingreso') saldo[cuenta] += monto;
      else saldo[cuenta] -= monto;
      if (tipo === 'transferencia') saldo[destino] += monto;
    }

    var otros = ['Útiles de limpieza', 'Bolsas y cinta de embalaje', 'Almuerzo del personal', 'Repuesto para la cortadora', 'Pasajes para trámite'];
    var fletes = ['Flete a obra en Surco', 'Taxi de carga', 'Flete de mercadería', 'Envío a cliente'];

    for (var f = inicio; f <= hoyS; f = sumarDias(f, 1)) {
      var d = aFecha(f), dia = d.getDate(), dow = d.getDay();
      var ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() === dia;
      var esHoy = f === hoyS;
      var abierto = dow !== 0;
      var ritmo = 0.9 + (d.getMonth() % 3) * 0.06 + (dow === 6 ? 0.25 : 0);
      var parte = esHoy ? 0.45 : 1;

      if (dia === 1) mov(f, 'gasto', 2800, 'bcp', 'alquiler', 'Alquiler de ' + MESES[d.getMonth()]);
      if (dia === 3) mov(f, 'gasto', 350, 'bcp', 'otros-g', 'Honorarios del contador');
      if (dia === 5) mov(f, 'gasto', 99, 'bcp', 'servicios', 'Internet del local');
      if (dia === 10) mov(f, 'gasto', entre(190, 280), 'bcp', 'servicios', 'Recibo de luz');
      if (dia === 12) mov(f, 'gasto', entre(60, 110), 'yape', 'servicios', 'Recibo de agua');
      if (dia === 17) mov(f, 'gasto', entre(720, 1180), 'bcp', 'impuestos', 'IGV y renta de ' + MESES[(d.getMonth() + 11) % 12]);

      if (abierto) {
        mov(f, 'ingreso', entre(480, 860) * ritmo * parte, 'caja', 'ventas', esHoy ? 'Ventas en efectivo hasta las 2 p. m.' : 'Ventas en efectivo');
        mov(f, 'ingreso', entre(190, 430) * ritmo * parte, 'yape', 'ventas', esHoy ? 'Ventas por Yape y Plin hasta las 2 p. m.' : 'Ventas por Yape y Plin');
        mov(f, 'ingreso', entre(160, 520) * ritmo * parte, 'bcp', 'ventas', esHoy ? 'Ventas con tarjeta hasta las 2 p. m.' : 'Ventas con tarjeta (POS)');

        if (dow === 1 && !esHoy) mov(f, 'gasto', entre(4000, 6000), 'bcp', 'mercaderia', 'Pedido a ' + uno(D.proveedores));
        if (dow === 4 && r() < 0.6) mov(f, 'gasto', entre(380, 900), 'caja', 'mercaderia', 'Compra al contado — ' + uno(D.proveedores));
        if ((dow === 2 || dow === 5) && !esHoy) mov(f, 'gasto', entre(35, 120), 'caja', 'transporte', uno(fletes));
        if (r() < 0.22 && !esHoy) mov(f, 'gasto', entre(15, 85), 'caja', 'otros-g', uno(otros));
        if ((dia === 7 || dia === 18 || dia === 26) && !esHoy) mov(f, 'ingreso', entre(1500, 4800), 'bcp', 'obras', 'Pedido para obra — ' + uno(D.clientes.slice(0, 3)));
        if (dia === 22 && !esHoy) mov(f, 'ingreso', entre(400, 1200), 'bcp', 'cobros', 'Pago de deuda — ' + uno(D.clientes.slice(3)));
      }

      if (dia === 15 || ultimo) mov(f, 'gasto', 2600, 'bcp', 'sueldos', (dia === 15 ? 'Quincena' : 'Fin de mes') + ' — 2 trabajadores');
      if (dow === 6 && saldo.caja > 1800) mov(f, 'transferencia', Math.floor((saldo.caja - 1200) / 100) * 100, 'caja', null, 'Depósito de la semana', 'bcp');
      if (ultimo && saldo.yape > 1200) mov(f, 'transferencia', Math.floor((saldo.yape - 700) / 100) * 100, 'yape', null, 'Pase de Yape al banco', 'bcp');

      // Cierre de caja de los últimos días (hoy todavía no se cierra)
      if (abierto && !esHoy && diasEntre(f, hoyS) <= 12) {
        var dif = uno([0, 0, 0, 0, -2.5, 1, -10, 0.5, 0]);
        var esperado = r2(saldo.caja);
        if (dif > 0) mov(f, 'ingreso', dif, 'caja', 'otros-i', 'Sobrante en el cierre de caja');
        if (dif < 0) mov(f, 'gasto', -dif, 'caja', 'otros-g', 'Faltante en el cierre de caja');
        cierres.push({ fecha: f, esperado: esperado, contado: r2(esperado + dif), diferencia: dif, quien: D.negocio.duena });
      }
    }

    var deudas = [
      { tipo: 'cobrar', nombre: 'Constructora Huamán', concepto: 'Factura F001-2481 · fierro y cemento', monto: 4380, pagado: 0, vence: sumarDias(hoyS, -6) },
      { tipo: 'cobrar', nombre: 'Taller Mecánico El Rápido', concepto: 'Boleta B001-9932 · herramientas', monto: 360, pagado: 0, vence: sumarDias(hoyS, -15) },
      { tipo: 'cobrar', nombre: 'Sr. Julio Paredes (maestro de obra)', concepto: 'Venta al crédito · tubos y pegamento', monto: 820, pagado: 300, vence: sumarDias(hoyS, 2) },
      { tipo: 'cobrar', nombre: 'Inmobiliaria Las Lomas', concepto: 'Factura F001-2502 · pintura y accesorios', monto: 6950, pagado: 0, vence: sumarDias(hoyS, 9) },
      { tipo: 'cobrar', nombre: 'Colegio San Andrés', concepto: 'Factura F001-2510 · mantenimiento', monto: 1240, pagado: 0, vence: sumarDias(hoyS, 20) },
      { tipo: 'pagar', nombre: 'Importadora Ferretera Lima', concepto: 'Factura de compra 0045-7781', monto: 5420, pagado: 0, vence: sumarDias(hoyS, -2) },
      { tipo: 'pagar', nombre: 'Aceros Arequipa (distribuidor)', concepto: 'Factura de compra 0102-3341', monto: 7800, pagado: 2000, vence: sumarDias(hoyS, 4) },
      { tipo: 'pagar', nombre: 'Distribuidora Pinturas del Sur', concepto: 'Factura de compra 0007-1290', monto: 3150, pagado: 0, vence: sumarDias(hoyS, 11) },
      { tipo: 'pagar', nombre: 'Alquiler del local', concepto: 'Alquiler de ' + mesNombre(moverMes(claveMes(hoyS), 1)), monto: 2800, pagado: 0, vence: moverMes(claveMes(hoyS), 1) + '-01' },
      { tipo: 'pagar', nombre: 'Tubos y Conexiones Perú', concepto: 'Factura de compra 0019-4410', monto: 1980, pagado: 0, vence: sumarDias(hoyS, 17) }
    ].map(function (x, i) { x.id = 'd' + (i + 1); x.pagos = []; return x; });

    return { v: VERSION, creado: hoyS, sig: sig, sigD: deudas.length + 1, movimientos: movs, deudas: deudas, cierres: cierres };
  }

  /* ---------- Guardar y cargar ---------- */
  var estado = null;
  var oyentes = [];
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function avisar() { oyentes.forEach(function (fn) { fn(); }); }
  function cargar() {
    try { estado = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { estado = null; }
    if (!estado || estado.v !== VERSION) { estado = ejemplo(); guardar(); }
  }
  function reiniciar() { estado = ejemplo(); guardar(); avisar(); }
  window.addEventListener('storage', function (e) { if (e.key === CLAVE) { cargar(); avisar(); } });

  /* ---------- Consultas ---------- */
  function cuenta(id) { return D.cuentas.filter(function (c) { return c.id === id; })[0]; }
  function categoria(id) {
    var todas = D.categorias.ingreso.concat(D.categorias.gasto);
    return todas.filter(function (c) { return c.id === id; })[0] || { id: id, nombre: 'Transferencia', icono: 'arrows-exchange' };
  }

  function saldos(hasta) {
    var s = {}; D.cuentas.forEach(function (c) { s[c.id] = c.inicial; });
    estado.movimientos.forEach(function (m) {
      if (hasta && m.fecha > hasta) return;
      if (m.tipo === 'ingreso') s[m.cuenta] += m.monto;
      else s[m.cuenta] -= m.monto;
      if (m.tipo === 'transferencia') s[m.destino] += m.monto;
    });
    Object.keys(s).forEach(function (k) { s[k] = r2(s[k]); });
    return s;
  }

  function delMes(clave) { return estado.movimientos.filter(function (m) { return claveMes(m.fecha) === clave; }); }

  function totales(lista) {
    var t = { ingresos: 0, gastos: 0, porCategoria: {} };
    lista.forEach(function (m) {
      if (m.tipo === 'ingreso') t.ingresos += m.monto;
      if (m.tipo === 'gasto') { t.gastos += m.monto; t.porCategoria[m.categoria] = (t.porCategoria[m.categoria] || 0) + m.monto; }
    });
    t.ingresos = r2(t.ingresos); t.gastos = r2(t.gastos); t.ganancia = r2(t.ingresos - t.gastos);
    return t;
  }

  function serie(clave, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) { var k = moverMes(clave, -i); out.push({ clave: k, t: totales(delMes(k)) }); }
    return out;
  }

  function primerMes() { return claveMes(estado.movimientos.length ? estado.movimientos[0].fecha : hoy()); }

  function agregar(m) {
    m.id = 'm' + (estado.sig++); m.monto = r2(m.monto);
    estado.movimientos.push(m);
    estado.movimientos.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
    guardar(); avisar(); return m;
  }
  function eliminar(id) {
    estado.movimientos = estado.movimientos.filter(function (m) { return m.id !== id; });
    estado.deudas.forEach(function (d) {
      var antes = d.pagos.length;
      d.pagos = d.pagos.filter(function (p) { return p.mov !== id; });
      if (d.pagos.length !== antes) d.pagado = r2(d.pagos.reduce(function (s, p) { return s + p.monto; }, d.pagadoInicial || 0));
    });
    guardar(); avisar();
  }

  /* ---------- Deudas ---------- */
  function deudas(tipo) {
    return estado.deudas.filter(function (d) { return d.tipo === tipo; })
      .map(function (d) { d.saldo = r2(d.monto - d.pagado); return d; })
      .sort(function (a, b) { return a.vence < b.vence ? -1 : 1; });
  }
  function pagarDeuda(id, monto, cuentaId) {
    var d = estado.deudas.filter(function (x) { return x.id === id; })[0];
    if (!d) return null;
    if (d.pagadoInicial == null) d.pagadoInicial = d.pagado;
    var m = {
      fecha: hoy(), tipo: d.tipo === 'cobrar' ? 'ingreso' : 'gasto', monto: monto, cuenta: cuentaId,
      categoria: d.tipo === 'cobrar' ? 'cobros' : (d.nombre === 'Alquiler del local' ? 'alquiler' : 'mercaderia'),
      nota: (d.tipo === 'cobrar' ? 'Cobro — ' : 'Pago — ') + d.nombre
    };
    m.id = 'm' + (estado.sig++); m.monto = r2(m.monto);
    estado.movimientos.push(m);
    d.pagos.push({ mov: m.id, monto: m.monto, fecha: m.fecha });
    d.pagado = r2(d.pagado + m.monto);
    guardar(); avisar(); return m;
  }
  function agregarDeuda(d) {
    d.id = 'd' + (estado.sigD++); d.pagado = 0; d.pagos = [];
    estado.deudas.push(d); guardar(); avisar(); return d;
  }

  /* ---------- Cierre de caja ---------- */
  function cierreDe(fecha) { return estado.cierres.filter(function (c) { return c.fecha === fecha; })[0]; }
  function cerrarCaja(contado) {
    var f = hoy();
    var esperado = saldos()['caja'];
    var dif = r2(contado - esperado);
    if (dif > 0) agregar({ fecha: f, tipo: 'ingreso', monto: dif, cuenta: 'caja', categoria: 'otros-i', nota: 'Sobrante en el cierre de caja' });
    if (dif < 0) agregar({ fecha: f, tipo: 'gasto', monto: -dif, cuenta: 'caja', categoria: 'otros-g', nota: 'Faltante en el cierre de caja' });
    estado.cierres = estado.cierres.filter(function (c) { return c.fecha !== f; });
    estado.cierres.push({ fecha: f, esperado: esperado, contado: r2(contado), diferencia: dif, quien: D.negocio.duena });
    guardar(); avisar();
    return dif;
  }

  /* ---------- Exportar para el contador ---------- */
  function csv(clave) {
    var filas = [['Fecha', 'Tipo', 'Categoría', 'Detalle', 'Cuenta', 'Ingreso', 'Gasto']];
    delMes(clave).forEach(function (m) {
      var tipo = m.tipo === 'ingreso' ? 'Ingreso' : m.tipo === 'gasto' ? 'Gasto' : 'Transferencia';
      var cta = cuenta(m.cuenta).nombre + (m.destino ? ' → ' + cuenta(m.destino).nombre : '');
      filas.push([m.fecha, tipo, m.categoria ? categoria(m.categoria).nombre : '', m.nota, cta,
        m.tipo === 'ingreso' ? m.monto.toFixed(2) : '', m.tipo === 'gasto' ? m.monto.toFixed(2) : '']);
    });
    return '﻿' + filas.map(function (f) {
      return f.map(function (c) { c = String(c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\r\n');
  }

  cargar();

  window.Libro = {
    get movimientos() { return estado.movimientos; },
    get cierres() { return estado.cierres; },
    alCambiar: function (fn) { oyentes.push(fn); },
    reiniciar: reiniciar, agregar: agregar, eliminar: eliminar,
    saldos: saldos, delMes: delMes, totales: totales, serie: serie, primerMes: primerMes,
    deudas: deudas, pagarDeuda: pagarDeuda, agregarDeuda: agregarDeuda,
    cierreDe: cierreDe, cerrarCaja: cerrarCaja, csv: csv,
    cuenta: cuenta, categoria: categoria,
    hoy: hoy, sumarDias: sumarDias, diasEntre: diasEntre, claveMes: claveMes, moverMes: moverMes,
    mesNombre: mesNombre, fechaLarga: fechaLarga, fechaCorta: fechaCorta, soles: soles, r2: r2
  };
})();
