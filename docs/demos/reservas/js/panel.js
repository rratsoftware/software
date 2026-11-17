/* =========================================================
   Panel del negocio: agenda del día por barbero
   ========================================================= */
(function () {
  'use strict';

  var D = window.RESERVAS_DATOS;
  var A = window.Agenda;
  var $ = function (id) { return document.getElementById(id); };
  var dia = A.hoy();
  var ventana = $('ventana'), vcaja = $('ventana-caja');

  $('nombre-negocio').textContent = D.negocio.nombre;

  var ESTADOS = {
    confirmada: 'Confirmada', pendiente: 'Por confirmar', atendida: 'Atendida', novino: 'No vino', cancelada: 'Cancelada'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function aviso(txt) {
    var a = $('aviso');
    a.textContent = txt;
    a.hidden = false;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(function () { a.hidden = true; }, 2600);
  }

  /* ---------- Resumen ---------- */
  function pintarKpis(citas) {
    var bs = A.bloques(dia).length * D.profesionales.length * D.intervalo;
    var usados = citas.reduce(function (a, r) { return a + A.servicio(r.servicio).minutos; }, 0);
    var validas = citas.filter(function (r) { return r.estado !== 'novino'; });
    var ingresos = validas.reduce(function (a, r) { return a + A.servicio(r.servicio).precio; }, 0);
    var porConfirmar = citas.filter(function (r) { return r.estado === 'pendiente'; }).length;
    var web = citas.filter(function (r) { return r.origen === 'web'; }).length;
    var items = [
      ['calendar-event', 'Citas del día', citas.length],
      ['cash', 'Ingresos esperados', A.soles(ingresos)],
      ['chart-pie', 'Agenda ocupada', bs ? Math.round(usados / bs * 100) + ' %' : '—'],
      ['bell', 'Por confirmar', porConfirmar],
      ['world', 'Reservaron por la web', web]
    ];
    $('kpis').innerHTML = items.map(function (k) {
      return '<li><i class="ti ti-' + k[0] + '" aria-hidden="true"></i><span>' + k[1] + '</span><b>' + k[2] + '</b></li>';
    }).join('');
  }

  /* ---------- Agenda ---------- */
  function pintar() {
    $('fecha').textContent = A.fechaLarga(dia).replace(/^./, function (c) { return c.toUpperCase(); }) + (dia === A.hoy() ? ' · hoy' : '');
    var citas = A.delDia(dia);
    pintarKpis(citas);
    var ag = $('agenda');
    var bs = A.bloques(dia);
    if (!bs.length) {
      ag.innerHTML = '<p class="cerrado"><i class="ti ti-moon" aria-hidden="true"></i> El local está cerrado este día.</p>';
      ag.style.removeProperty('--filas');
      return;
    }
    var inicio = A.min(bs[0]);
    ag.style.setProperty('--filas', bs.length);
    ag.style.setProperty('--cols', D.profesionales.length);

    var html = '<div class="agenda__esquina"></div>';
    html += D.profesionales.map(function (p) {
      var n = citas.filter(function (r) { return r.pro === p.id; }).length;
      return '<div class="agenda__pro"><span class="avatar avatar--' + p.id + '">' + p.nombre.charAt(0) + '</span><b>' + esc(p.nombre) + '</b><small>' + n + ' citas</small></div>';
    }).join('');
    html += '<div class="agenda__horas">' + bs.map(function (b) { return '<span>' + b + '</span>'; }).join('') + '</div>';

    var ahora = new Date().getHours() * 60 + new Date().getMinutes();
    D.profesionales.forEach(function (p) {
      html += '<div class="agenda__col" data-pro="' + p.id + '">';
      bs.forEach(function (b, i) {
        html += '<button type="button" class="hueco" data-hora="' + b + '" data-pro="' + p.id + '" aria-label="Nueva cita con ' + esc(p.nombre) + ' a las ' + b + '" style="--i:' + i + '"></button>';
      });
      citas.filter(function (r) { return r.pro === p.id; }).forEach(function (r) {
        var sv = A.servicio(r.servicio);
        var fila = (A.min(r.hora) - inicio) / D.intervalo;
        var alto = sv.minutos / D.intervalo;
        html += '<button type="button" class="cita cita--' + r.estado + '" data-id="' + r.id + '" style="--i:' + fila + ';--alto:' + alto + '">' +
          '<b>' + esc(r.cliente) + '</b><span>' + r.hora + ' · ' + esc(sv.nombre) + '</span>' +
          (r.origen === 'web' ? '<i class="ti ti-world cita__web" title="Reservó por la web" aria-label="Reservó por la web"></i>' : '') +
          (r.adelanto ? '<i class="ti ti-coin cita__adelanto" title="Pagó adelanto" aria-label="Pagó adelanto"></i>' : '') + '</button>';
      });
      html += '</div>';
    });
    if (dia === A.hoy() && ahora >= inicio && ahora < A.min(bs[bs.length - 1]) + D.intervalo) {
      html += '<div class="agenda__ahora" style="--pos:' + ((ahora - inicio) / D.intervalo) + '"><span>' + A.hora(ahora) + '</span></div>';
    }
    ag.innerHTML = html;
  }

  $('agenda').addEventListener('click', function (e) {
    var c = e.target.closest('.cita');
    if (c) { detalle(c.dataset.id); return; }
    var h = e.target.closest('.hueco');
    if (h) nueva(h.dataset.pro, h.dataset.hora);
  });

  /* ---------- Detalle de una cita ---------- */
  function abrir(html) {
    vcaja.innerHTML = '<button type="button" class="ventana__cerrar" data-cerrar aria-label="Cerrar"><i class="ti ti-x" aria-hidden="true"></i></button>' + html;
    if (!ventana.open) ventana.showModal();
  }
  ventana.addEventListener('click', function (e) {
    if (e.target === ventana || e.target.closest('[data-cerrar]')) ventana.close();
  });

  function detalle(id) {
    var r = A.reservas.filter(function (x) { return x.id === id; })[0];
    var sv = A.servicio(r.servicio), p = A.profesional(r.pro);
    var acciones = [];
    if (r.estado === 'pendiente') acciones.push(['confirmada', 'circle-check', 'Confirmar cita', '']);
    if (r.estado === 'pendiente' || r.estado === 'confirmada') {
      acciones.push(['atendida', 'user-check', 'Llegó: marcar atendida', '']);
      acciones.push(['novino', 'user-x', 'No vino', 'boton--claro']);
      acciones.push(['recordar', 'brand-whatsapp', 'Enviar recordatorio', 'boton--claro']);
      acciones.push(['cancelada', 'trash', 'Cancelar cita', 'boton--peligro']);
    }
    abrir('<p class="est est--' + r.estado + '">' + ESTADOS[r.estado] + '</p>' +
      '<h2 id="ventana-titulo">' + esc(r.cliente) + '</h2>' +
      '<dl class="ficha">' +
      '<div><dt>Servicio</dt><dd>' + esc(sv.nombre) + ' · ' + sv.minutos + ' min</dd></div>' +
      '<div><dt>Cuándo</dt><dd>' + A.fechaLarga(r.fecha) + ', ' + r.hora + '</dd></div>' +
      '<div><dt>Barbero</dt><dd>' + esc(p.nombre) + '</dd></div>' +
      '<div><dt>Celular</dt><dd>' + r.telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') + '</dd></div>' +
      '<div><dt>Precio</dt><dd>' + A.soles(sv.precio) + (r.adelanto ? ' · pagó ' + A.soles(D.negocio.adelanto) + ' de adelanto' : '') + '</dd></div>' +
      '<div><dt>Reservó</dt><dd>' + (r.origen === 'web' ? 'Por la página web' : 'En el local o por teléfono') + '</dd></div>' +
      '</dl>' +
      (acciones.length ? '<div class="ventana__acciones">' + acciones.map(function (a) {
        return '<button type="button" class="boton ' + a[3] + '" data-accion="' + a[0] + '"><i class="ti ti-' + a[1] + '" aria-hidden="true"></i> ' + a[2] + '</button>';
      }).join('') + '</div>' : ''));
    vcaja.querySelectorAll('[data-accion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var acc = b.dataset.accion;
        if (acc === 'recordar') {
          aviso('Recordatorio enviado por WhatsApp a ' + r.cliente.split(' ')[0] + ' (simulado)');
          return;
        }
        A.actualizar(r.id, { estado: acc });
        ventana.close();
        pintar();
        aviso({ confirmada: 'Cita confirmada', atendida: 'Marcada como atendida', novino: 'Marcada como no vino', cancelada: 'Cita cancelada: el horario quedó libre' }[acc]);
      });
    });
  }

  /* ---------- Nueva cita (desde el local o por teléfono) ---------- */
  function nueva(pro, hora) {
    if (dia < A.hoy()) { aviso('No puedes agendar en un día pasado'); return; }
    if (!A.bloques(dia).length) { aviso('El local está cerrado este día'); return; }
    abrir('<h2 id="ventana-titulo">Nueva cita</h2><p class="ventana__sub">' + A.fechaLarga(dia) + '</p>' +
      '<form class="datos" id="form-nueva" novalidate>' +
      '<label>Cliente<input name="cliente" placeholder="Nombre y apellido" required></label>' +
      '<label>Celular<input name="telefono" type="tel" inputmode="numeric" placeholder="9XX XXX XXX"></label>' +
      '<label>Servicio<select name="servicio">' + D.servicios.map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.nombre) + ' · ' + s.minutos + ' min · ' + A.soles(s.precio) + '</option>';
      }).join('') + '</select></label>' +
      '<div class="datos__dos"><label>Barbero<select name="pro">' + D.profesionales.map(function (p) {
        return '<option value="' + p.id + '"' + (p.id === pro ? ' selected' : '') + '>' + esc(p.nombre) + '</option>';
      }).join('') + '</select></label>' +
      '<label>Hora<select name="hora"></select></label></div>' +
      '<p class="datos__error" id="nueva-error" role="alert"></p>' +
      '<button type="submit" class="boton boton--bloque">Guardar cita</button></form>');
    var f = $('form-nueva');
    function horas() {
      var sv = A.servicio(f.servicio.value);
      var libres = A.horasLibres(dia, f.pro.value, sv.minutos).filter(function (h) { return h.pro; });
      f.hora.innerHTML = libres.length ? libres.map(function (h) {
        return '<option' + (h.hora === hora ? ' selected' : '') + '>' + h.hora + '</option>';
      }).join('') : '<option value="">Sin horas libres</option>';
    }
    f.servicio.addEventListener('change', horas);
    f.pro.addEventListener('change', horas);
    horas();
    f.cliente.focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('nueva-error');
      if (f.cliente.value.trim().length < 3) { err.textContent = 'Escribe el nombre del cliente.'; f.cliente.focus(); return; }
      if (!f.hora.value) { err.textContent = 'No hay horas libres con ese barbero.'; return; }
      A.agregar({
        fecha: dia, hora: f.hora.value, pro: f.pro.value, servicio: f.servicio.value,
        cliente: f.cliente.value.trim(), telefono: f.telefono.value.replace(/\D/g, '') || '900000000',
        estado: 'confirmada', adelanto: false, origen: 'panel'
      });
      ventana.close();
      pintar();
      aviso('Cita guardada');
    });
  }

  /* ---------- Botones ---------- */
  $('dia-antes').addEventListener('click', function () { dia = A.sumarDias(dia, -1); pintar(); });
  $('dia-despues').addEventListener('click', function () { dia = A.sumarDias(dia, 1); pintar(); });
  $('dia-hoy').addEventListener('click', function () { dia = A.hoy(); pintar(); });
  $('nueva').addEventListener('click', function () { nueva(D.profesionales[0].id, null); });
  $('reiniciar').addEventListener('click', function () {
    if (!confirm('¿Reiniciar la demo? Se borran las citas que agregaste.')) return;
    A.reiniciar();
    dia = A.hoy();
    pintar();
    aviso('Demo reiniciada');
  });

  A.alCambiar(pintar);
  setInterval(pintar, 60000); // la línea de "ahora" avanza
  pintar();
})();
