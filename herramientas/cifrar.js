/* =========================================================
   RratSoft — cifra el contenido de la página con el PIN

   Lee   privado/contenido.html  (texto plano, NO se sube)
   Crea  sitio/contenido.json    (cifrado, este sí se sube)

   Uso (desde la carpeta RratSoft):
     node herramientas/cifrar.js            → te pide el PIN
     node herramientas/cifrar.js --publico  → sin PIN: abre el sitio a todos

   Cifrado: AES-GCM 256 con clave derivada del PIN (PBKDF2-SHA256).
   Cada vez que cambies privado/contenido.html, vuelve a ejecutarlo.
   ========================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'privado', 'contenido.html');
const OUT = path.join(ROOT, 'sitio', 'contenido.json');

const PIN_LENGTH = 4;          // debe coincidir con las casillas del index
const ITERATIONS = 600000;     // más alto = más lento de adivinar por fuerza bruta

const b64 = (buf) => Buffer.from(buf).toString('base64');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

async function encrypt(html, pin) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const data = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html));
  return { v: 1, iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) };
}

(async () => {
  const html = fs.readFileSync(SRC, 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '');

  if (process.argv.includes('--publico')) {
    fs.writeFileSync(OUT, JSON.stringify({ v: 1, publico: true, html }));
    console.log('Listo: sitio/contenido.json SIN cifrar. Cualquiera puede entrar al sitio.');
    return;
  }

  const pin = process.argv[2] || await ask(`PIN de ${PIN_LENGTH} dígitos: `);
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) {
    console.error(`El PIN debe tener exactamente ${PIN_LENGTH} números.`);
    process.exit(1);
  }

  fs.writeFileSync(OUT, JSON.stringify(await encrypt(html, pin)));
  console.log('Listo: sitio/contenido.json cifrado. Solo se entra con el PIN.');
})();
