const express = require('express')
const axios = require('axios')
const xml2js = require('xml2js')
const cors = require('cors')
const https = require('https')
const os = require('os')
const path = require('path')
const cron = require('node-cron')

const app = express()
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))

const ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

let cache = {
  datos: null,
  ultimaActualizacion: null,
  proximaActualizacion: null
}

// ─── Próxima actualización ─────────────────────────────────────────────────────

function getProximaActualizacion() {
  const ahora = new Date()
  // Convertir a hora española
  const esStr = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' })
  const es = new Date(esStr)
  const hoy = new Date(es)

  const horarios = [7, 12, 18]
  let proxima = null

  for (const h of horarios) {
    const candidato = new Date(hoy)
    candidato.setHours(h, 0, 0, 0)
    if (candidato > es) {
      proxima = candidato
      break
    }
  }

  if (!proxima) {
    // Mañana a las 07:00
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)
    manana.setHours(7, 0, 0, 0)
    proxima = manana
  }

  // Ajustar la diferencia UTC↔Madrid para devolver Date en UTC
  const offsetMs = proxima.getTime() - es.getTime() + ahora.getTime()
  return new Date(offsetMs)
}

// ─── Helpers de parsing ────────────────────────────────────────────────────────

function getText(val) {
  if (val == null) return null
  if (typeof val === 'string') return val.trim() || null
  if (typeof val === 'object') {
    if (val['#text']) return String(val['#text']).trim()
    if (val._) return String(val._).trim()
  }
  return null
}

function getFloat(val) {
  if (val == null) return null
  if (typeof val === 'object' && val['#text']) val = val['#text']
  if (typeof val === 'object' && val._) val = val._
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function getLink(linkVal, entryId) {
  const fallback = entryId ? String(entryId) : '#'
  if (!linkVal) return fallback
  if (Array.isArray(linkVal)) {
    const alt = linkVal.find(l => l && l.$ && l.$.rel === 'alternate')
    if (alt && alt.$) return alt.$.href || fallback
    const first = linkVal[0]
    if (first && first.$) return first.$.href || fallback
    return fallback
  }
  if (typeof linkVal === 'object') {
    if (linkVal.$) return linkVal.$.href || fallback
    if (linkVal._) return String(linkVal._)
    return fallback
  }
  return String(linkVal) || fallback
}

function getCPVFromClassification(classification) {
  if (!classification) return null
  const arr = [].concat(classification)
  const codes = arr.map(c => {
    const icc = c && c.ItemClassificationCode
    if (!icc) return null
    if (typeof icc === 'string') return icc
    return icc._ || icc['#text'] || null
  }).filter(Boolean)
  return codes.length > 0 ? codes.join(' ') : null
}

const PROVINCIAS_CONOCIDAS = [
  'Navarra','Madrid','Barcelona','Cataluña','Andalucía','Valencia','Galicia',
  'Aragón','Castilla','Murcia','Extremadura','Asturias','Cantabria','Rioja',
  'Vasco','Canarias','Baleares','Ceuta','Melilla','Sevilla','Málaga','Córdoba',
  'Granada','Huelva','Cádiz','Almería','Jaén','Burgos','León','Salamanca',
  'Valladolid','Zamora','Segovia','Ávila','Palencia','Soria','Zaragoza',
  'Huesca','Teruel','Alicante','Castellón','Lérida','Gerona','Tarragona',
  'Coruña','Lugo','Ourense','Pontevedra','Álava','Guipúzcoa','Vizcaya',
  'Badajoz','Cáceres','Oviedo','Santander','Logroño','Murcia','Toledo',
  'Albacete','Ciudad Real','Cuenca','Guadalajara','Las Palmas','Tenerife',
]

function extraerProvincia(cfs, titulo, organismo) {
  // 1. RealizedLocation en el proyecto
  const proj = cfs.ProcurementProject || {}
  const loc = proj.RealizedLocation
  if (loc) {
    const addr = loc.Address || {}
    const p = getText(addr.CountrySubentity) || getText(addr.CityName)
    if (p) return p
  }
  // 2. PostalAddress del organismo
  const party = ((cfs.LocatedContractingParty || {}).Party) || {}
  const postal = party.PostalAddress || {}
  const p2 = getText(postal.CountrySubentity)
  if (p2) return p2
  // 3. Buscar en título u organismo
  const haystack = `${titulo || ''} ${organismo || ''}`
  for (const prov of PROVINCIAS_CONOCIDAS) {
    if (haystack.includes(prov)) return prov
  }
  return null
}

function parseEntry(entry) {
  try {
    const cfs = entry.ContractFolderStatus
    if (!cfs) return null
    const proj = cfs.ProcurementProject || {}
    const budget = proj.BudgetAmount || {}
    const process = cfs.TenderingProcess || {}
    const deadline = process.TenderSubmissionDeadlinePeriod || {}
    const party = ((cfs.LocatedContractingParty || {}).Party) || {}
    const partyName = party.PartyName || {}

    const titulo = getText(proj.Name)
    const organismo = getText(partyName.Name)

    return {
      titulo,
      organismo,
      importe: getFloat(budget.TaxExclusiveAmount),
      fechaLimite: getText(deadline.EndDate) || null,
      cpv: getCPVFromClassification(proj.RequiredCommodityClassification),
      enlace: getLink(entry.link, getText(entry.id)),
      expediente: getText(cfs.ContractFolderID),
      fechaPublicacion: getText(entry.updated) || getText(entry.published) || null,
      provincia: extraerProvincia(cfs, titulo, organismo),
    }
  } catch {
    return null
  }
}

function esConstruccion(cpv) {
  if (!cpv) return false
  return String(cpv).split(/\s+/).some(c => c.trim().startsWith('45'))
}

function enPlazo(fechaLimite) {
  if (!fechaLimite) return true
  return new Date(fechaLimite) > new Date()
}

async function descargarYParsear(url) {
  const response = await axios.get(url, {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 30000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/atom+xml,application/xml,text/xml,*/*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Cache-Control': 'no-cache',
    }
  })
  return xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [xml2js.processors.stripPrefix]
  })
}

function extraerEntradas(result) {
  const entries = result && result.feed && result.feed.entry
  if (!entries) return []
  return [].concat(entries)
}

function encontrarSiguienteURL(result) {
  const links = result && result.feed && result.feed.link
  if (!links) return null
  const arr = [].concat(links)
  const next = arr.find(l => l && l.$ && l.$.rel === 'next')
  return next ? next.$.href : null
}

function filtrar(entries) {
  return entries
    .map(parseEntry)
    .filter(Boolean)
    .filter(l => esConstruccion(l.cpv) && enPlazo(l.fechaLimite))
}

function ordenar(lista) {
  return lista.sort((a, b) => {
    if (!a.fechaLimite && !b.fechaLimite) return 0
    if (!a.fechaLimite) return 1
    if (!b.fechaLimite) return -1
    return new Date(a.fechaLimite) - new Date(b.fechaLimite)
  })
}

// ─── Descarga principal ────────────────────────────────────────────────────────

async function descargarYProcesar() {
  try {
    console.log('[placsp] Descargando ATOM...')
    const result = await descargarYParsear(ATOM_URL)
    let licitaciones = filtrar(extraerEntradas(result))

    if (licitaciones.length < 10) {
      const nextURL = encontrarSiguienteURL(result)
      if (nextURL) {
        try {
          const result2 = await descargarYParsear(nextURL)
          const mas = filtrar(extraerEntradas(result2))
          licitaciones = [...licitaciones, ...mas]
        } catch (e) {
          console.warn('[placsp] Error cargando página siguiente:', e.message)
        }
      }
    }

    const ahora = new Date()
    cache.datos = ordenar(licitaciones)
    cache.ultimaActualizacion = ahora.toISOString()
    cache.proximaActualizacion = getProximaActualizacion().toISOString()
    console.log(`[placsp] OK — ${licitaciones.length} licitaciones de construcción`)
  } catch (err) {
    console.error('[placsp] Error en descarga:', err.message)
  }
}

// ─── Tareas programadas ────────────────────────────────────────────────────────

cron.schedule('0 7 * * 1-5', () => {
  console.log('[CRON 07:00] Descargando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 12 * * 1-5', () => {
  console.log('[CRON 12:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 18 * * 1-5', () => {
  console.log('[CRON 18:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 7 * * 6', () => {
  console.log('[CRON SAB 07:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

// ─── Endpoints ─────────────────────────────────────────────────────────────────

app.get('/api/licitaciones', async (req, res) => {
  try {
    const forzar = req.query.refresh === '1'

    if (forzar || !cache.datos) {
      await descargarYProcesar()
    } else {
      console.log('[cache] Sirviendo desde caché')
    }

    if (!cache.datos) {
      return res.json({ error: 'No hay datos disponibles todavía', licitaciones: [] })
    }

    res.json({
      total: cache.datos.length,
      actualizacion: cache.ultimaActualizacion,
      proximaActualizacion: cache.proximaActualizacion,
      licitaciones: cache.datos
    })
  } catch (err) {
    console.error('[api] Error:', err.message)
    res.json({ error: err.message || 'Error al obtener licitaciones', licitaciones: [] })
  }
})

app.get('/api/estado', (req, res) => {
  res.json({
    estado: 'ok',
    ultimaActualizacion: cache.ultimaActualizacion,
    proximaActualizacion: cache.proximaActualizacion,
    totalLicitaciones: cache.datos ? cache.datos.length : 0,
    servidor: new Date().toISOString()
  })
})

// ─── Servir frontend React (build de producción) ──────────────────────────────
// Ejecutar: cd client && npm run build — y luego node server.js sirve todo en :3000

const clientDist = path.join(__dirname, 'client', 'dist')
const fs = require('fs')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ─── Arranque ──────────────────────────────────────────────────────────────────

const PORT = 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nLicitaPlus corriendo en http://localhost:${PORT}`)

  const interfaces = os.networkInterfaces()
  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Accesible en red local: http://${iface.address}:${PORT}`)
      }
    }
  }

  console.log('\nHorarios de actualización: 07:00, 12:00 y 18:00 (L-V)')
  console.log('Descargando datos iniciales...')
  descargarYProcesar()
})
