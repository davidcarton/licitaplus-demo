const MAX_ENTRADAS = 200

const entradas = []

function registrar(nivel, contexto, mensaje) {
  entradas.unshift({ fecha: new Date().toISOString(), nivel, contexto, mensaje })
  if (entradas.length > MAX_ENTRADAS) entradas.pop()

  const linea = `[${contexto}] ${mensaje}`
  if (nivel === 'error') console.error(linea)
  else if (nivel === 'warn') console.warn(linea)
  else console.log(linea)
}

module.exports = {
  error: (contexto, mensaje) => registrar('error', contexto, mensaje),
  warn: (contexto, mensaje) => registrar('warn', contexto, mensaje),
  info: (contexto, mensaje) => registrar('info', contexto, mensaje),
  getEntradas: () => entradas,
}
