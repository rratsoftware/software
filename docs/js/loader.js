/* =========================================================
   RratSoft — intro de carga
   La ilustración (images/rrat-line.svg) se anima sola.
   Este archivo maneja la barra de progreso y la salida.
   El intro queda bloqueado hasta que js/admin.js inserta el
   contenido de la página (con el PIN, o libre si es público).
   ========================================================= */
(function () {
  'use strict';

  var loader = document.getElementById('loader');
  if (!loader) return;

  var barEl = document.getElementById('loader-bar');
  var pctEl = document.getElementById('loader-pct');
  var statusEl = document.getElementById('loader-status');
  var skipBtn = document.getElementById('loader-skip');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Textos que aparecen según el porcentaje
  var STATUS = [
    [0, 'Inicializando'],
    [20, 'Cargando recursos'],
    [45, 'Compilando módulos'],
    [70, 'Preparando interfaz'],
    [95, 'Listo']
  ];

  var MIN_TIME = reduceMotion ? 700 : 5600;   // dibujo (~3 s) + una vuelta del destello neón
  var EXIT_TIME = 600;                         // pausa de salida (ms)
  var SAFETY_TIME = 9000;                      // si algo tarda demasiado, seguimos igual
  var HOLD_AT = 99;                            // en mantenimiento la barra se queda aquí

  var locked = true;   // hasta que exista contenido no se sale del intro

  var pageLoaded = document.readyState === 'complete';
  window.addEventListener('load', function () { pageLoaded = true; });

  var startTime = performance.now();
  var progress = 0;
  var exiting = false;
  var waiting = false;
  var done = false;
  var rafId = null;

  function setProgress(p) {
    var v = Math.min(100, Math.round(p));
    barEl.style.width = v + '%';
    pctEl.textContent = v + '%';
    for (var i = STATUS.length - 1; i >= 0; i--) {
      if (v >= STATUS[i][0]) {
        if (statusEl.textContent !== STATUS[i][1]) statusEl.textContent = STATUS[i][1];
        break;
      }
    }
  }

  // Modo mantenimiento: la barra queda "pensando" sin terminar nunca
  function startWaiting() {
    waiting = true;
    loader.classList.add('is-waiting');
    statusEl.textContent = 'Modo mantenimiento';
    pctEl.textContent = 'Preparando todo';
  }

  function exit() {
    if (exiting) return;
    exiting = true;
    loader.classList.remove('is-waiting');
    setProgress(100);
    loader.classList.add('is-leaving');
    setTimeout(finish, EXIT_TIME);
  }

  function finish() {
    if (done) return;
    done = true;
    if (rafId) cancelAnimationFrame(rafId);
    setProgress(100);
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.dispatchEvent(new CustomEvent('rratsoft:ready'));
    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 900);
  }

  function loop(now) {
    if (done || waiting) return;
    rafId = requestAnimationFrame(loop);

    var elapsed = now - startTime;
    if (elapsed > SAFETY_TIME) pageLoaded = true;
    var timeCap = Math.min(1, elapsed / MIN_TIME) * 100;
    var target = pageLoaded ? timeCap : Math.min(timeCap, 90);
    if (locked) target = Math.min(target, HOLD_AT);
    // Avanza suave pero sin quedarse pegado cerca del final
    progress = Math.min(target, progress + Math.max((target - progress) * 0.1, 0.5));
    setProgress(progress);

    if (locked && progress >= HOLD_AT) {
      startWaiting();
    } else if (progress >= 100) {
      exit();
    }
  }

  skipBtn.addEventListener('click', function () { if (!locked) finish(); });
  rafId = requestAnimationFrame(loop);

  /* Lo usa js/admin.js cuando el contenido ya está en la página */
  window.RratSoftLoader = {
    unlock: function () {
      if (!locked) return;
      locked = false;
      skipBtn.hidden = false;
      if (waiting) exit();
      // Si aún no llegó al tope, el bucle sigue solo hasta el 100%
    }
  };
})();
