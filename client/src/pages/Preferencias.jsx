import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Info, Save, CheckCircle } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import Topbar from '../components/dashboard/Topbar.jsx'

const TIPOS_OBRA = [
  'Obra civil', 'Pavimentación', 'Urbanización',
  'Edificación', 'Rehabilitación', 'Instalaciones',
  'Demolición', 'Ingeniería civil', 'Obras especiales',
]

const PROVINCIAS = [
  'Navarra', 'La Rioja', 'País Vasco', 'Aragón', 'Madrid',
  'Cataluña', 'Andalucía', 'Valencia', 'Galicia', 'Castilla y León',
]

const PROVINCIAS_ACTIVAS_INICIAL = ['Navarra', 'La Rioja', 'País Vasco']

const PLAZOS = [
  { value: 'urgente', label: 'Urgente (menos de 7 días)' },
  { value: 'proximo', label: 'Próximo (7 a 14 días)' },
  { value: 'enplazo', label: 'En plazo (más de 14 días)' },
  { value: 'todos', label: 'Todos' },
]

function formatMiles(valor) {
  if (!valor) return ''
  return Number(valor).toLocaleString('es-ES')
}

function soloDigitos(texto) {
  return texto.replace(/\D/g, '')
}

function Card({ title, subtitle, children }) {
  return (
    <section style={{
      background: '#fff',
      borderRadius: 'var(--r-xl)',
      border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)',
      padding: '22px 24px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--negro)', margin: 0 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: 18 }}>
        {children}
      </div>
    </section>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--n100)',
  fontSize: 14,
  color: 'var(--n900)',
  background: 'var(--gris-fondo)',
}

export default function Preferencias() {
  const [tiposObra, setTiposObra] = useState(
    () => Object.fromEntries(TIPOS_OBRA.map(t => [t, true]))
  )
  const [provinciasActivas, setProvinciasActivas] = useState(
    () => Object.fromEntries(PROVINCIAS.map(p => [p, PROVINCIAS_ACTIVAS_INICIAL.includes(p)]))
  )
  const [importeDesde, setImporteDesde] = useState('30000')
  const [importeHasta, setImporteHasta] = useState('500000')
  const [plazo, setPlazo] = useState('todos')
  const [cpvQuery, setCpvQuery] = useState('')
  const [cpvResultados, setCpvResultados] = useState(null)
  const [licitaciones, setLicitaciones] = useState([])
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Preferencias'

    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => setLicitaciones(data.licitaciones || []))
      .catch(() => {})

    return () => { document.title = tituloPrevio }
  }, [])

  const toggleTipo = (tipo) => {
    setTiposObra(prev => ({ ...prev, [tipo]: !prev[tipo] }))
  }

  const toggleProvincia = (provincia) => {
    setProvinciasActivas(prev => ({ ...prev, [provincia]: !prev[provincia] }))
  }

  const buscarCPV = () => {
    const q = cpvQuery.trim()
    if (!q) { setCpvResultados([]); return }
    setCpvResultados(licitaciones.filter(l => l.cpv?.includes(q)).slice(0, 8))
  }

  const guardarPreferencias = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gris-fondo)' }}>
      <Sidebar />

      <div className="dash-content" style={{ marginLeft: 180, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Preferencias" />

        <main style={{ padding: '28px clamp(1rem, 3vw, 2.5rem)', flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--negro)', margin: 0 }}>
            Mis preferencias de búsqueda
          </h2>
          <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 6, marginBottom: 24 }}>
            Personaliza qué licitaciones quieres ver
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
            {/* Tipo de obra */}
            <Card title="Tipo de obra" subtitle="Selecciona los tipos de licitación que te interesan">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 16px' }}>
                {TIPOS_OBRA.map(tipo => (
                  <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--n700)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={tiposObra[tipo]}
                      onChange={() => toggleTipo(tipo)}
                      style={{ width: 16, height: 16, accentColor: '#3D7A4F' }}
                    />
                    {tipo}
                  </label>
                ))}
              </div>
            </Card>

            {/* Provincias */}
            <Card title="Provincias" subtitle="Elige las provincias donde buscar licitaciones">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PROVINCIAS.map(p => {
                  const activa = provinciasActivas[p]
                  return (
                    <button
                      key={p}
                      onClick={() => toggleProvincia(p)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'var(--font-body)',
                        border: `1px solid ${activa ? 'var(--verde)' : 'var(--n100)'}`,
                        background: activa ? 'var(--verde-claro)' : '#fff',
                        color: activa ? 'var(--verde)' : 'var(--n500)',
                        transition: 'all var(--transition)',
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Importe */}
            <Card title="Importe de la licitación" subtitle="Define el rango de presupuesto que te interesa">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Desde
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={formatMiles(importeDesde)}
                      onChange={(e) => setImporteDesde(soloDigitos(e.target.value))}
                      style={{ ...inputStyle, paddingRight: 32 }}
                      inputMode="numeric"
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--n400)' }}>€</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Hasta
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={formatMiles(importeHasta)}
                      onChange={(e) => setImporteHasta(soloDigitos(e.target.value))}
                      style={{ ...inputStyle, paddingRight: 32 }}
                      inputMode="numeric"
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--n400)' }}>€</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Plazo */}
            <Card title="Plazo de presentación" subtitle="¿Con cuánta antelación quieres ver las licitaciones?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PLAZOS.map(p => (
                  <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--n700)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="plazo"
                      value={p.value}
                      checked={plazo === p.value}
                      onChange={() => setPlazo(p.value)}
                      style={{ width: 16, height: 16, accentColor: '#3D7A4F' }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </Card>

            {/* CPV */}
            <Card title="Búsqueda por código CPV" subtitle="Filtra licitaciones del radar por código CPV concreto">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  value={cpvQuery}
                  onChange={(e) => setCpvQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') buscarCPV() }}
                  placeholder="Ej. 45000000"
                  style={{ ...inputStyle, flex: 1, minWidth: 180 }}
                />
                <button
                  onClick={buscarCPV}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--verde-medio)',
                    color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde-medio)')}
                >
                  <Search size={15} />
                  Buscar
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}>
                <Info size={14} color="var(--n400)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: 'var(--n400)', margin: 0, lineHeight: 1.5 }}>
                  Los códigos CPV identifican el tipo de obra (por ejemplo, 72000000 corresponde a servicios
                  de tecnologías de la información). Puedes buscar por el código completo o solo por su prefijo.
                </p>
              </div>

              {cpvResultados !== null && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cpvResultados.length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--n400)' }}>
                      No se han encontrado licitaciones con ese código CPV.
                    </span>
                  ) : cpvResultados.map((l, i) => (
                    <div
                      key={l.expediente || i}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        background: 'var(--gris-fondo)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: 'var(--negro)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {l.titulo || 'Sin título'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--n400)', flexShrink: 0 }}>
                        {l.provincia || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={guardarPreferencias}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--verde)',
                  color: '#fff',
                  fontSize: 14, fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde-medio)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde)')}
              >
                <Save size={16} />
                Guardar preferencias
              </button>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 24, right: 24,
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--negro)', color: '#fff',
              padding: '12px 20px',
              borderRadius: 'var(--r-md)',
              fontSize: 13, fontWeight: 600,
              boxShadow: 'var(--shadow-hover)',
              zIndex: 100,
            }}
          >
            <CheckCircle size={16} color="var(--g500)" />
            Preferencias guardadas
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
