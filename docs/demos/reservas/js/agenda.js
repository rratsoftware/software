/* =========================================================
   Agenda compartida entre la página de reservas y el panel
   Guarda las citas en este navegador (localStorage).
   En la versión real esto vive en un servidor y el
   recordatorio por WhatsApp sale solo.
   ========================================================= */
(function () {
  'use strict';

  var D = window.RESERVAS_DATOS;
  var CLAVE = 'rratsoft-reservas-v1';

  /* ---------- Fechas y horas ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoy() { return iso(new Date()); }
  function deISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function sumarDias(s, n) { var d = deISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function min(h) { var p = h.split(':'); return +p[0] * 60 + +p[1]; }
  function hora(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaLarga(s) { var d = deISO(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function fechaCorta(s) { var d = deISO(s); return { dia: DIAS[d.getDay()].slice(0, 3), num: d.getDate(), mes: MESES[d.getMonth()].slice(0, 3) }; }

  function horarioDe(s) { return D.horario[deISO(s).getDay()]; }

  // Bloques de la agenda de un día: ['09:00', '09:30', ...]
  function bloques(s) {
    var h = horarioDe(s);
    if (!h) return [];
    var out = [];
    for (var m = min(h[0]); m < min(h[1]); m += D.intervalo) out.push(hora(m));
    return out;
  }

  function servicio(id) { return D.servicios.filter(function (x) { return x.id === id; })[0]; }
  function profesional(id) { return D.profesionales.filter(function (x) { return x.id === id; })[0]; }

  /* ---------- Guardar ---------- */
  var estado = null;
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }

  // Números al azar repetibles (para que la agenda de ejemplo sea estable)
  function azar(semilla) {
    var x = 0;
    for (var i = 0; i < semilla.length; i++) x = (x * 31 + semilla.charCodeAt(i)) >>> 0;
    return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  }

  // Llena la agenda con citas de ejemplo desde ayer hasta dentro de 6 días
  function ejemplo() {
    var lista = [], n = 1, base = hoy();
    var ahora = new Date().getHours() * 60 + new Date().getMinutes();
    for (var dd = -1; dd <= 6; dd++) {
      var f = sumarDias(base, dd);
      var bs = bloques(f);
      D.profesionales.forEach(function (p) {
        var r = azar(f + p.id);
        var ocupadoHasta = -1;
        bs.forEach(function (b) {
          var m = min(b);
          if (m < ocupadoHasta) return;
          var lleno = dd < 0 ? 0.6 : dd === 0 ? 0.55 : Math.max(0.15, 0.5 - dd * 0.06);
          if (r() > lleno) return;
          var sv = D.servicios[Math.floor(r() * D.servicios.length)];
          if (m + sv.minutos > min(horarioDe(f)[1])) return;
          var pasada = dd < 0 || (dd === 0 && m + sv.minutos <= ahora);
          var est = pasada ? (r() < 0.9 ? 'atendida' : 'novino') : (r() < 0.75 ? 'confirmada' : 'pendiente');
          lista.push({
            id: 'r' + (n++), fecha: f, hora: b, pro: p.id, servicio: sv.id,
            cliente: D.clientesEjemplo[Math.floor(r() * D.clientesEjemplo.length)],
            telefono: '9' + String(Math.floor(r() * 1e8)).padStart(8, '0'),
            estado: est, adelanto: r() < 0.5, origen: r() < 0.7 ? 'web' : 'panel'
          });
          ocupadoHasta = m + sv.minutos;
        });
      });
    }
    return { v: 1, creado: base, sig: n, reservas: lista };
  }

  function cargar() {
    try { estado = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { estado = null; }
    if (!estado || estado.v !== 1) { estado = ejemplo(); guardar(); }
    return estado;
  }

  /* ---------- Consultas ---------- */
  function delDia(f) {
    return estado.reservas.filter(function (r) { return r.fecha === f && r.estado !== 'cancelada'; })
      .sort(function (a, b) { return min(a.hora) - min(b.hora); });
  }

  // ¿Está libre el profesional desde "h" durante "minutos"?
  function libre(f, pro, h, minutos, ignorar) {
    var ini = min(h), fin = ini + minutos;
    var hor = horarioDe(f);
    if (!hor || ini < min(hor[0]) || fin > min(hor[1])) return false;
    if (f === hoy()) {
      var ahora = new Date().getHours() * 60 + new Date().getMinutes();
      if (ini < ahora + 15) return false;
    }
    if (f < hoy()) return false;
    return !estado.reservas.some(function (r) {
      if (r.id === ignorar || r.fecha !== f || r.pro !== pro || r.estado === 'cancelada') return false;
      var a = min(r.hora), b = a + servicio(r.servicio).minutos;
      return ini < b && a < fin;
    });
  }

  // Horas libres de un día. pro = 'cualquiera' busca al primero libre
  function horasLibres(f, pro, minutos) {
    return bloques(f).map(function (b) {
      var quien = pro === 'cualquiera'
        ? D.profesionales.map(function (p) { return p.id; }).filter(function (id) { return libre(f, id, b, minutos); })[0]
        : (libre(f, pro, b, minutos) ? pro : null);
      return { hora: b, pro: quien || null };
    });
  }

  /* ---------- Cambios ---------- */
  function agregar(r) {
    r.id = 'r' + (estado.sig++);
    estado.reservas.push(r);
    guardar();
    return r;
  }
  function actualizar(id, cambios) {
    var r = estado.reservas.filter(function (x) { return x.id === id; })[0];
    if (r) { Object.assign(r, cambios); guardar(); }
    return r;
  }
  function reiniciar() { estado = ejemplo(); guardar(); }

  // Si la agenda se cambió en otra pestaña (reservas ↔ panel), se recarga
  var oyentes = [];
  window.addEventListener('storage', function (e) {
    if (e.key !== CLAVE) return;
    cargar();
    oyentes.forEach(function (fn) { fn(); });
  });

  function soles(n) { return 'S/ ' + n.toFixed(2); }

  window.Agenda = {
    cargar: cargar, delDia: delDia, horasLibres: horasLibres, libre: libre,
    agregar: agregar, actualizar: actualizar, reiniciar: reiniciar,
    alCambiar: function (fn) { oyentes.push(fn); },
    servicio: servicio, profesional: profesional, bloques: bloques, horarioDe: horarioDe,
    hoy: hoy, sumarDias: sumarDias, fechaLarga: fechaLarga, fechaCorta: fechaCorta,
    min: min, hora: hora, soles: soles,
    get reservas() { return estado.reservas; }
  };
  cargar();
})();
