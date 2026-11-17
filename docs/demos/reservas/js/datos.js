/* =========================================================
   Barbería La Navaja — datos de la demo de reservas
   Negocio ficticio. Cambia servicios, precios, horarios y
   profesionales aquí y todo el sistema se adapta.
   ========================================================= */
window.RESERVAS_DATOS = {
  negocio: {
    nombre: 'Barbería La Navaja',
    rubro: 'Barbería',
    direccion: 'Av. Ejemplo 123, Miraflores',
    adelanto: 10              // soles que se piden por Yape para separar la cita
  },

  // Lunes = 1 ... Domingo = 0. null = cerrado
  horario: {
    1: ['09:00', '20:00'], 2: ['09:00', '20:00'], 3: ['09:00', '20:00'],
    4: ['09:00', '20:00'], 5: ['09:00', '21:00'], 6: ['09:00', '18:00'], 0: null
  },
  intervalo: 30,              // minutos de cada bloque de la agenda
  diasVisibles: 14,           // cuántos días puede reservar el cliente

  servicios: [
    { id: 'corte', nombre: 'Corte clásico', minutos: 30, precio: 25, icono: 'scissors' },
    { id: 'combo', nombre: 'Corte + barba', minutos: 60, precio: 40, icono: 'sparkles' },
    { id: 'barba', nombre: 'Perfilado de barba', minutos: 30, precio: 15, icono: 'brush' },
    { id: 'nino', nombre: 'Corte de niño', minutos: 30, precio: 20, icono: 'mood-kid' },
    { id: 'afeitado', nombre: 'Afeitado con toalla caliente', minutos: 30, precio: 30, icono: 'flame' },
    { id: 'tinte', nombre: 'Tinte de cabello o barba', minutos: 60, precio: 60, icono: 'palette' }
  ],

  profesionales: [
    { id: 'carlos', nombre: 'Carlos', rol: 'Barbero principal', color: '#c2410c' },
    { id: 'miguel', nombre: 'Miguel', rol: 'Barbero', color: '#1d4ed8' },
    { id: 'luis', nombre: 'Luis', rol: 'Barbero', color: '#15803d' }
  ],

  // Nombres de ejemplo para llenar la agenda la primera vez
  clientesEjemplo: [
    'Jorge Quispe', 'Diego Flores', 'Renzo Torres', 'Kevin Rojas', 'Andrés Huamán',
    'Bruno Castillo', 'Piero Vargas', 'Marco Chávez', 'José Ramírez', 'Luis Mamani',
    'Sebastián Paredes', 'Gonzalo Ríos', 'Álvaro Medina', 'Hugo Salazar', 'Fabio Cárdenas',
    'Raúl Espinoza', 'Joaquín Vega', 'Matías Silva', 'César Navarro', 'Iván Gutiérrez'
  ]
};
