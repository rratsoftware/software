/* =========================================================
   RratSoft — interacción de la página
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileMQ = window.matchMedia('(max-width: 960px)');

  /* ---------- Cabecera al hacer scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú desplegable "Servicios" ---------- */
  var menuItem = document.querySelector('.has-menu');
  var menuBtn = menuItem.querySelector('.nav__link');
  var closeTimer = null;

  function setMega(open) {
    clearTimeout(closeTimer);
    menuItem.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  var canHover = window.matchMedia('(hover: hover)').matches;
  menuBtn.addEventListener('click', function () {
    // Con mouse en escritorio ya se abrió al pasar por encima: el clic no lo cierra
    if (canHover && !mobileMQ.matches) setMega(true);
    else setMega(!menuItem.classList.contains('is-open'));
  });
  // En escritorio se abre al pasar el mouse
  menuItem.addEventListener('mouseenter', function () {
    if (!mobileMQ.matches) setMega(true);
  });
  menuItem.addEventListener('mouseleave', function () {
    if (mobileMQ.matches) return;
    closeTimer = setTimeout(function () { setMega(false); }, 180);
  });
  document.addEventListener('click', function (e) {
    if (!mobileMQ.matches && !menuItem.contains(e.target)) setMega(false);
  });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-open', open);
    if (!open) setMega(false);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); setMega(false); }
  });

  /* ---------- Carrusel de servicios ---------- */
  var carousel = document.getElementById('carousel');
  var prevBtn = document.querySelector('[data-carousel="prev"]');
  var nextBtn = document.querySelector('[data-carousel="next"]');

  function stepSize() {
    var card = carousel.firstElementChild;
    var gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : carousel.clientWidth;
  }
  function updateArrows() {
    var max = carousel.scrollWidth - carousel.clientWidth - 2;
    prevBtn.disabled = carousel.scrollLeft <= 2;
    nextBtn.disabled = carousel.scrollLeft >= max;
  }
  prevBtn.addEventListener('click', function () { carousel.scrollBy({ left: -stepSize() }); });
  nextBtn.addEventListener('click', function () { carousel.scrollBy({ left: stepSize() }); });
  carousel.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  /* ---------- Preguntas que rotan en la franja verde ---------- */
  var questions = document.querySelectorAll('#questions li');
  var qIndex = 2;
  if (questions.length && !reduceMotion) {
    setInterval(function () {
      questions[qIndex].classList.remove('is-active');
      qIndex = (qIndex + 1) % questions.length;
      questions[qIndex].classList.add('is-active');
    }, 2600);
  }

  /* ---------- Aparición al hacer scroll ---------- */
  var STAGGER_PARENTS = ['plans', 'bento', 'steps'];

  function startReveal() {
    var els = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Escalonar tarjetas dentro de una misma rejilla
    els.forEach(function (el) {
      var parent = el.parentElement;
      var stagger = parent && STAGGER_PARENTS.some(function (c) { return parent.classList.contains(c); });
      if (stagger) {
        var index = Array.prototype.indexOf.call(parent.children, el);
        el.style.transitionDelay = (index % 3) * 90 + 'ms';
        el.addEventListener('transitionend', function () { el.style.transitionDelay = ''; }, { once: true });
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  if (document.body.classList.contains('is-loading')) {
    document.addEventListener('rratsoft:ready', startReveal, { once: true });
  } else {
    startReveal();
  }

  /* ---------- Año en el pie ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Formulario de contacto ----------
     No hay servidor todavía: al enviar se abre el correo del visitante
     con el mensaje ya escrito. Cambia CONTACT_EMAIL por el tuyo. */
  var CONTACT_EMAIL = 'hola@rratsoft.com';
  var form = document.getElementById('contact-form');
  var note = document.getElementById('form-note');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    var invalid = fields.filter(function (f) { return !f.checkValidity(); });

    fields.forEach(function (f) {
      f.setAttribute('aria-invalid', String(invalid.indexOf(f) !== -1));
    });

    if (invalid.length) {
      note.textContent = 'Revisa los campos marcados.';
      note.className = 'form__note is-error';
      invalid[0].focus();
      return;
    }

    var data = new FormData(form);
    var subject = 'Proyecto de ' + data.get('nombre');
    var body = data.get('mensaje') + '\n\n— ' + data.get('nombre') + ' (' + data.get('email') + ')';
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    note.className = 'form__note is-ok';
    note.textContent = '¡Gracias! Se abrió tu correo para enviar el mensaje.';
    form.reset();
  });
})();
