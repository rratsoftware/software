/* =========================================================
   Página de reservas para el cliente
   4 pasos: servicio → barbero → fecha y hora → datos
   ========================================================= */
(function () {
  'use strict';

  var D = window.RESERVAS_DATOS;
  var A = window.Agenda;
  var caja = document.getElementById('paso');
  var pasos = document.querySelectorAll('#pasos li');
  var resumen = document.getElementById('resumen-lista');

  var sel = { servicio: null, pro: null, fecha: null, hora: null, proAsignado: null };
  var actual = 0;

  document.getElementById('nombre-negocio').textContent = D.negocio.nombre;
  document.getElementById('direccion-negocio').textContent = D.negocio.direccion;
  var hh = A.horarioDe(A.hoy());
  document.getElementById('horario-hoy').textContent = hh ? 'Hoy de ' + hh[0] + ' a ' + hh[1] : 'Hoy cerrado';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function pintarResumen() {
    var sv = sel.servicio && A.servicio(sel.servicio);
    var pro = sel.proAsignado || sel.pro;
    var filas = [
      ['Servicio', sv ? sv.nombre + ' · ' + sv.minutos + ' min' : '—'],
      ['Barbero', pro ? (pro === 'cualquiera' ? 'El primero disponible' : A.profesional(pro).nombre) : '—'],
      ['Fecha', sel.fecha ? A.fechaLarga(sel.fecha) : '—'],
      ['Hora', sel.hora || '—'],
      ['Precio', sv ? A.soles(sv.precio) : '—']
    ];
    resumen.innerHTML = filas.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
  }

  function ir(n) {
    actual = n;
    pasos.forEach(function (li, i) {
      li.classList.toggle('is-hecho', i < n);
      li.classList.toggle('is-actual', i === n);
    });
    [pasoServicio, pasoPro, pasoFecha, pasoDatos][n]();
    pintarResumen();
    var t = caja.querySelector('h2');
    if (t && n > 0) t.focus();
  }

  function volver(n) {
    return '<button type="button" class="volver" data-volver="' + n + '"><i class="ti ti-arrow-left" aria-hidden="true"></i> Volver</button>';
  }
  caja.addEventListener('click', function (e) {
    var v = e.target.closest('[data-volver]');
    if (v) ir(+v.dataset.volver);
  });

  /* ---------- 1. Servicio ---------- */
  function pasoServicio() {
    caja.innerHTML = '<h2 id="paso-titulo" tabindex="-1">¿Qué te vas a hacer?</h2>' +
      '<div class="opciones">' + D.servicios.map(function (s) {
        return '<button type="button" class="opcion' + (sel.servicio === s.id ? ' is-elegida' : '') + '" data-servicio="' + s.id + '">' +
          '<span class="opcion__icono"><i class="ti ti-' + s.icono + '" aria-hidden="true"></i></span>' +
          '<span class="opcion__texto"><b>' + esc(s.nombre) + '</b><small>' + s.minutos + ' min</small></span>' +
          '<span class="opcion__precio">' + A.soles(s.precio) + '</span></button>';
      }).join('') + '</div>';
    caja.querySelectorAll('[data-servicio]').forEach(function (b) {
      b.addEventListener('click', function () { sel.servicio = b.dataset.servicio; sel.hora = null; ir(1); });
    });
  }

  /* ---------- 2. Barbero ---------- */
  function pasoPro() {
    var lista = [{ id: 'cualquiera', nombre: 'El primero disponible', rol: 'Te damos más horarios', color: '#57534e' }].concat(D.profesionales);
    caja.innerHTML = volver(0) + '<h2 id="paso-titulo" tabindex="-1">¿Con quién?</h2>' +
      '<div class="opciones opciones--pros">' + lista.map(function (p) {
        var ini = p.id === 'cualquiera' ? '<i class="ti ti-users" aria-hidden="true"></i>' : p.nombre.charAt(0);
        return '<button type="button" class="opcion opcion--pro' + (sel.pro === p.id ? ' is-elegida' : '') + '" data-pro="' + p.id + '">' +
          '<span class="avatar avatar--' + p.id + '">' + ini + '</span>' +
          '<span class="opcion__texto"><b>' + esc(p.nombre) + '</b><small>' + esc(p.rol) + '</small></span></button>';
      }).join('') + '</div>';
    caja.querySelectorAll('[data-pro]').forEach(function (b) {
      b.addEventListener('click', function () { sel.pro = b.dataset.pro; sel.hora = null; sel.proAsignado = null; ir(2); });
    });
  }

  /* ---------- 3. Fecha y hora ---------- */
  function pasoFecha() {
    var sv = A.servicio(sel.servicio);
    var dias = [];
    for (var i = 0; i < D.diasVisibles; i++) dias.push(A.sumarDias(A.hoy(), i));
    if (!sel.fecha || sel.fecha < A.hoy()) {
      sel.fecha = dias.filter(function (f) { return A.horasLibres(f, sel.pro, sv.minutos).some(function (h) { return h.pro; }); })[0] || dias[0];
    }
    caja.innerHTML = volver(1) + '<h2 id="paso-titulo" tabindex="-1">Elige el día y la hora</h2>' +
      '<div class="dias" role="listbox" aria-label="Días">' + dias.map(function (f) {
        var c = A.fechaCorta(f);
        var abierto = !!A.horarioDe(f);
        var libres = abierto ? A.horasLibres(f, sel.pro, sv.minutos).filter(function (h) { return h.pro; }).length : 0;
        return '<button type="button" role="option" class="dia' + (f === sel.fecha ? ' is-elegido' : '') + '" data-fecha="' + f + '"' +
          (libres ? '' : ' disabled') + ' aria-selected="' + (f === sel.fecha) + '">' +
          '<small>' + (f === A.hoy() ? 'hoy' : c.dia) + '</small><b>' + c.num + '</b><small>' + (abierto ? (libres ? libres + ' libres' : 'lleno') : 'cerrado') + '</small></button>';
      }).join('') + '</div>' +
      '<p class="horas__titulo">' + A.fechaLarga(sel.fecha) + '</p>' +
      '<div class="horas" id="horas"></div>';
    pintarHoras();
    caja.querySelectorAll('[data-fecha]').forEach(function (b) {
      b.addEventListener('click', function () { sel.fecha = b.dataset.fecha; sel.hora = null; pasoFecha(); pintarResumen(); });
    });
    var elegido = caja.querySelector('.dia.is-elegido');
    if (elegido) elegido.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function pintarHoras() {
    var sv = A.servicio(sel.servicio);
    var horas = A.horasLibres(sel.fecha, sel.pro, sv.minutos);
    var cont = document.getElementById('horas');
    if (!horas.some(function (h) { return h.pro; })) {
      cont.innerHTML = '<p class="vacio">No quedan horarios este día. Prueba con otro.</p>';
      return;
    }
    cont.innerHTML = horas.map(function (h) {
      return '<button type="button" class="hora' + (sel.hora === h.hora ? ' is-elegida' : '') + '" data-hora="' + h.hora + '" data-quien="' + (h.pro || '') + '"' +
        (h.pro ? '' : ' disabled aria-label="' + h.hora + ' ocupado"') + '>' + h.hora + '</button>';
    }).join('');
    cont.querySelectorAll('[data-hora]:not([disabled])').forEach(function (b) {
      b.addEventListener('click', function () {
        sel.hora = b.dataset.hora;
        sel.proAsignado = b.dataset.quien;
        ir(3);
      });
    });
  }

  /* ---------- 4. Datos y confirmación ---------- */
  function pasoDatos() {
    var sv = A.servicio(sel.servicio);
    caja.innerHTML = volver(2) + '<h2 id="paso-titulo" tabindex="-1">Tus datos</h2>' +
      '<form class="datos" id="datos" novalidate>' +
      '<label>Nombre y apellido<input name="nombre" autocomplete="name" placeholder="Ej. Diego Flores" required></label>' +
      '<label>Celular (WhatsApp)<input name="telefono" type="tel" inputmode="numeric" autocomplete="tel" placeholder="9XX XXX XXX" required></label>' +
      '<fieldset class="pago"><legend>¿Cómo quieres separar tu cita?</legend>' +
      '<label class="pago__op"><input type="radio" name="pago" value="yape" checked><span><b>Adelanto de ' + A.soles(D.negocio.adelanto) + ' con Yape</b><small>Se descuenta del total. Tu cita queda confirmada.</small></span></label>' +
      '<label class="pago__op"><input type="radio" name="pago" value="local"><span><b>Pagar todo en el local</b><small>Tu cita queda pendiente hasta que la confirmemos.</small></span></label>' +
      '</fieldset>' +
      '<p class="datos__error" id="datos-error" role="alert"></p>' +
      '<button type="submit" class="boton boton--bloque">Reservar · ' + A.soles(sv.precio) + '</button>' +
      '<p class="datos__nota">Demo: no se cobra nada ni se envía ningún mensaje.</p></form>';
    var f = document.getElementById('datos');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = f.nombre.value.trim();
      var tel = f.telefono.value.replace(/\D/g, '');
      var err = document.getElementById('datos-error');
      if (nombre.length < 3) { err.textContent = 'Escribe tu nombre.'; f.nombre.focus(); return; }
      if (!/^9\d{8}$/.test(tel)) { err.textContent = 'Escribe un celular de 9 dígitos que empiece con 9.'; f.telefono.focus(); return; }
      // Alguien pudo tomar la hora mientras tanto
      if (!A.libre(sel.fecha, sel.proAsignado, sel.hora, sv.minutos)) {
        err.textContent = 'Esa hora acaba de ocuparse. Elige otra.';
        setTimeout(function () { ir(2); }, 1200);
        return;
      }
      var yape = f.pago.value === 'yape';
      if (yape) pagoYape(nombre, tel); else confirmar(nombre, tel, false);
    });
    f.nombre.focus();
  }

  // Pantalla simulada de pago con Yape
  function pagoYape(nombre, tel) {
    caja.innerHTML = '<div class="yape"><h2 tabindex="-1">Paga ' + A.soles(D.negocio.adelanto) + ' con Yape</h2>' +
      '<div class="yape__qr" aria-hidden="true"><i class="ti ti-qrcode"></i></div>' +
      '<p>Escanea el código con tu app o yapea al número del negocio. En la versión real el pago se verifica solo.</p>' +
      '<button type="button" class="boton boton--bloque boton--yape" id="ya-pague">Ya pagué</button>' +
      '<p class="datos__nota">Demo: no se cobra nada.</p></div>';
    caja.querySelector('h2').focus();
    document.getElementById('ya-pague').addEventListener('click', function () { confirmar(nombre, tel, true); });
  }

  function confirmar(nombre, tel, adelanto) {
    var sv = A.servicio(sel.servicio);
    var r = A.agregar({
      fecha: sel.fecha, hora: sel.hora, pro: sel.proAsignado, servicio: sel.servicio,
      cliente: nombre, telefono: tel, estado: adelanto ? 'confirmada' : 'pendiente', adelanto: adelanto, origen: 'web'
    });
    pasos.forEach(function (li) { li.classList.add('is-hecho'); li.classList.remove('is-actual'); });
    var falta = sv.precio - (adelanto ? D.negocio.adelanto : 0);
    caja.innerHTML = '<div class="listo"><span class="listo__icono"><i class="ti ti-circle-check-filled" aria-hidden="true"></i></span>' +
      '<h2 tabindex="-1">¡Listo, ' + esc(nombre.split(' ')[0]) + '! Tu cita está ' + (adelanto ? 'confirmada' : 'reservada') + '</h2>' +
      '<p><b>' + esc(sv.nombre) + '</b> con <b>' + esc(A.profesional(r.pro).nombre) + '</b><br>' + A.fechaLarga(r.fecha) + ' a las <b>' + r.hora + '</b></p>' +
      '<p class="listo__pago">' + (adelanto ? 'Pagaste ' + A.soles(D.negocio.adelanto) + ' de adelanto. Pagas ' + A.soles(falta) + ' en el local.' : 'Pagas ' + A.soles(falta) + ' en el local.') + '</p>' +
      '<div class="whatsapp" aria-label="Así se ve el mensaje que te llega">' +
      '<p class="whatsapp__titulo"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Mensaje que te llega</p>' +
      '<p class="whatsapp__burbuja">Hola ' + esc(nombre.split(' ')[0]) + ', tu cita en ' + esc(D.negocio.nombre) + ' es el ' + A.fechaLarga(r.fecha) + ' a las ' + r.hora +
      '. Si no puedes venir, responde CANCELAR.</p></div>' +
      '<div class="listo__acciones"><a class="boton" href="panel.html">Verla en el panel del negocio <i class="ti ti-arrow-right" aria-hidden="true"></i></a>' +
      '<button type="button" class="boton boton--claro" id="otra">Reservar otra cita</button></div></div>';
    caja.querySelector('h2').focus();
    document.getElementById('otra').addEventListener('click', function () {
      sel = { servicio: null, pro: null, fecha: null, hora: null, proAsignado: null };
      ir(0);
    });
  }

  A.alCambiar(function () { if (actual === 2) pasoFecha(); });
  ir(0);
})();
