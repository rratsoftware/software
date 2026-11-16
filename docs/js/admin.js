/* =========================================================
   RratSoft — acceso con PIN (modo mantenimiento)

   El contenido de la página NO está en index.html: viene cifrado
   en contenido.json y solo se puede abrir con el PIN correcto.
   Sin PIN no hay nada que ver, ni siquiera en el código fuente.

   Para cambiar el PIN o el contenido:
     node herramientas/cifrar.js
   ========================================================= */
(function () {
  'use strict';

  var CONTENT_URL = 'contenido.json';
  var SESSION_KEY = 'rratsoft-key';   // la clave queda solo mientras la pestaña esté abierta
  var MAX_TRIES = 5;                  // intentos antes de bloquear
  var LOCK_MS = 30000;                // tiempo de bloqueo (ms)
  var LOCK_KEY = 'rratsoft-pin-lock';

  var loaderApi = window.RratSoftLoader;
  var app = document.getElementById('app');
  var openBtn = document.getElementById('admin-open');
  var dialog = document.getElementById('admin-dialog');
  var form = document.getElementById('pin-form');
  var msg = document.getElementById('pin-msg');
  var cancelBtn = document.getElementById('pin-cancel');
  var submitBtn = document.getElementById('pin-submit');
  var digitsBox = document.getElementById('pin-digits');
  var inputs = Array.prototype.slice.call(digitsBox.querySelectorAll('input'));

  if (!loaderApi || !app) return;

  var payload = null;     // contenido.json ya descargado
  var tries = 0;
  var countdown = null;

  /* ---------- Utilidades ---------- */
  function fromB64(s) {
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function toB64(buf) {
    var bytes = new Uint8Array(buf);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function store(method, key, value) {
    try { return method === 'get' ? sessionStorage.getItem(key) : method === 'set' ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key); }
    catch (e) { return null; }
  }
  function hasCrypto() { return !!(window.crypto && crypto.subtle); }

  /* ---------- Descifrar ---------- */
  function keyFromPin(pin) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(payload.salt), iterations: payload.iterations },
        base,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );
    });
  }

  // Si la clave es incorrecta, AES-GCM falla y la promesa se rechaza
  function decrypt(key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.data))
      .then(function (buf) { return new TextDecoder().decode(buf); });
  }

  /* ---------- Mostrar la página ---------- */
  // Scripts de la página, en orden (cada uno espera al anterior)
  var PAGE_SCRIPTS = ['js/empresa.js', 'js/main.js', 'js/cotizador.js'];

  function mount(html) {
    app.innerHTML = html;
    (function next(i) {
      if (i >= PAGE_SCRIPTS.length) { loaderApi.unlock(); return; }
      var s = document.createElement('script');
      s.src = PAGE_SCRIPTS[i];
      s.onload = function () { next(i + 1); };
      s.onerror = function () { next(i + 1); };
      document.body.appendChild(s);
    })(0);
  }

  /* ---------- Bloqueo tras muchos intentos ---------- */
  function lockedUntil() {
    try { return Number(localStorage.getItem(LOCK_KEY)) || 0; } catch (e) { return 0; }
  }
  function setLockedUntil(t) {
    try { localStorage.setItem(LOCK_KEY, String(t)); } catch (e) { /* ignorar */ }
  }

  function showMsg(text, type) {
    msg.textContent = text;
    msg.className = 'pin__msg' + (type ? ' is-' + type : '');
  }

  function setDisabled(on) {
    inputs.forEach(function (i) { i.disabled = on; });
    submitBtn.disabled = on;
  }

  function checkLock() {
    clearInterval(countdown);
    if (lockedUntil() - Date.now() <= 0) {
      setDisabled(false);
      return false;
    }
    setDisabled(true);
    var tick = function () {
      var s = Math.ceil((lockedUntil() - Date.now()) / 1000);
      if (s <= 0) {
        clearInterval(countdown);
        tries = 0;
        setDisabled(false);
        showMsg('');
        inputs[0].focus();
        return;
      }
      showMsg('Demasiados intentos. Espera ' + s + ' s.', 'error');
    };
    tick();
    countdown = setInterval(tick, 1000);
    return true;
  }

  /* ---------- Ventana del PIN ---------- */
  function clearDigits() {
    inputs.forEach(function (i) { i.value = ''; i.classList.remove('is-filled'); });
  }

  openBtn.addEventListener('click', function () {
    clearDigits();
    showMsg('');
    digitsBox.classList.remove('is-wrong', 'is-ok');
    dialog.showModal();
    if (!checkLock()) inputs[0].focus();
  });
  cancelBtn.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { clearInterval(countdown); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();   // clic fuera de la tarjeta
  });

  inputs.forEach(function (input, idx) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(-1);
      input.classList.toggle('is-filled', input.value !== '');
      if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus();
      if (inputs.every(function (i) { return i.value; })) form.requestSubmit();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        inputs[idx - 1].value = '';
        inputs[idx - 1].classList.remove('is-filled');
        inputs[idx - 1].focus();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });
    input.addEventListener('focus', function () { input.select(); });
  });

  // Pegar el PIN completo de una vez
  digitsBox.addEventListener('paste', function (e) {
    var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    inputs.forEach(function (i, n) {
      i.value = text[n] || '';
      i.classList.toggle('is-filled', i.value !== '');
    });
    var next = inputs.find(function (i) { return !i.value; });
    if (next) next.focus();
    else form.requestSubmit();
  });

  function fail() {
    tries++;
    digitsBox.classList.remove('is-wrong');
    void digitsBox.offsetWidth;            // reinicia la animación de sacudida
    digitsBox.classList.add('is-wrong');
    clearDigits();
    if (tries >= MAX_TRIES) {
      setLockedUntil(Date.now() + LOCK_MS);
      checkLock();
      return;
    }
    var left = MAX_TRIES - tries;
    showMsg('PIN incorrecto. ' + (left === 1 ? 'Te queda 1 intento.' : 'Te quedan ' + left + ' intentos.'), 'error');
    inputs[0].focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (checkLock() || !payload) return;

    var code = inputs.map(function (i) { return i.value; }).join('');
    if (code.length < inputs.length) {
      showMsg('Completa los ' + inputs.length + ' dígitos.', 'error');
      return;
    }

    setDisabled(true);
    showMsg('Verificando…');
    var key;
    keyFromPin(code)
      .then(function (k) { key = k; return decrypt(k); })
      .then(function (html) {
        crypto.subtle.exportKey('raw', key).then(function (raw) { store('set', SESSION_KEY, toB64(raw)); });
        showMsg('Acceso concedido', 'ok');
        digitsBox.classList.add('is-ok');
        setTimeout(function () {
          dialog.close();
          openBtn.hidden = true;
          mount(html);
        }, 500);
      })
      .catch(function () {
        setDisabled(false);
        fail();
      });
  });

  /* ---------- Inicio ---------- */
  function showGate() {
    openBtn.hidden = false;
  }

  fetch(CONTENT_URL, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      payload = data;

      // Sitio abierto al público (node herramientas/cifrar.js --publico)
      if (data.publico) { mount(data.html); return; }

      if (!hasCrypto()) {
        showGate();
        showMsg('Abre el sitio con https para poder ingresar.', 'error');
        return;
      }

      // ¿Ya ingresó el PIN en esta pestaña?
      var saved = store('get', SESSION_KEY);
      if (!saved) { showGate(); return; }
      crypto.subtle.importKey('raw', fromB64(saved), 'AES-GCM', false, ['decrypt'])
        .then(decrypt)
        .then(mount)
        .catch(function () {             // el PIN cambió: hay que volver a ingresarlo
          store('remove', SESSION_KEY);
          showGate();
        });
    })
    .catch(function () {
      // Sin contenido: el intro se queda en mantenimiento
    });
})();
