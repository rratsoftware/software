/* Instalar como app: botón "Instalar", ayuda para iPhone y trabajador sin conexión */
(function () {
  'use strict';
  var boton = document.getElementById('instalar');
  var ayuda = document.getElementById('ayuda-instalar');
  var pasos = document.getElementById('ayuda-pasos');
  var pedido = null;

  var instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* sin trabajador */ }); });
  }

  if (instalada) { document.documentElement.classList.add('es-app'); return; }
  boton.hidden = false;

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; });
  window.addEventListener('appinstalled', function () { boton.hidden = true; pedido = null; });

  function paso(icono, html) { return '<li><i class="ti ti-' + icono + '" aria-hidden="true"></i><span>' + html + '</span></li>'; }

  boton.addEventListener('click', function () {
    if (pedido) {
      pedido.prompt();
      pedido.userChoice.then(function (r) { if (r.outcome === 'accepted') boton.hidden = true; pedido = null; });
      return;
    }
    pasos.innerHTML = esIOS
      ? paso('brand-safari', 'Abre esta página en <b>Safari</b>.') +
        paso('share', 'Toca el botón <b>Compartir</b>, abajo al centro.') +
        paso('square-plus', 'Elige <b>Agregar a pantalla de inicio</b> y luego <b>Agregar</b>.')
      : paso('brand-chrome', 'Abre esta página en <b>Chrome</b>.') +
        paso('dots-vertical', 'Toca el menú <b>⋮</b>, arriba a la derecha.') +
        paso('download', 'Elige <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b>.');
    ayuda.showModal();
  });

  ayuda.addEventListener('click', function (e) { if (e.target === ayuda || e.target.closest('[data-cerrar-ayuda]')) ayuda.close(); });
})();
