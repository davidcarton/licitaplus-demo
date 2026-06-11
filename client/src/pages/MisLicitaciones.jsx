import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import Topbar from '../components/dashboard/Topbar.jsx'
import LicitacionCard from '../components/cards/LicitacionCard.jsx'
import LicitacionModal from '../components/cards/LicitacionModal.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const TABS = ['Todas', 'Guardadas', 'Presentadas']

const ESTADO_ESTILOS = {
  Nueva:      { bg: 'var(--g50)',      color: 'var(--g700)', border: 'var(--g200)' },
  Estudiando: { bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)' },
  Presentada: { bg: '#eff6ff',          color: '#1d4ed8',      border: '#bfdbfe' },
}

export default function MisLicitaciones() {
  const [licitaciones, setLicitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionada, setSeleccionada] = useState(null)
  const [tab, setTab] = useState('Todas')
  const [guardadas, setGuardadas] = useState({})

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Mis licitaciones'

    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => setLicitaciones(data.licitaciones || []))
      .catch(() => {})
      .finally(() => setCargando(false))

    return () => { document.title = tituloPrevio }
  }, [])

  const guardar = (expediente) => {
    setGuardadas(prev => ({ ...prev, [expediente]: 'Nueva' }))
  }

  const cambiarEstado = (expediente, estado) => {
    setGuardadas(prev => ({ ...prev, [expediente]: estado }))
  }

  const visibles = useMemo(() => {
    return licitaciones.filter(l => {
      if (tab === 'Guardadas') return Boolean(guardadas[l.expediente])
      if (tab === 'Presentadas') return guardadas[l.expediente] === 'Presentada'
      return true
    })
  }, [licitaciones, tab, guardadas])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gris-fondo)' }}>
      <Sidebar />

      <div className="dash-content" style={{ marginLeft: 180, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Mis licitaciones" />

        <main style={{ padding: '28px clamp(1rem, 3vw, 2.5rem)', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  border: `1px solid ${tab === t ? 'var(--verde)' : 'var(--n100)'}`,
                  background: tab === t ? 'var(--verde)' : '#fff',
                  color: tab === t ? '#fff' : 'var(--n500)',
                  transition: 'all var(--transition)',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {cargando && <Spinner />}

          {!cargando && visibles.length === 0 && (
            <div style={{
              minHeight: 240,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, color: 'var(--n400)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--n500)' }}>
                No hay licitaciones en esta pestaña
              </span>
              <span style={{ fontSize: 13 }}>
                {tab === 'Guardadas' && 'Guarda licitaciones desde la pestaña "Todas"'}
                {tab === 'Presentadas' && 'Marca una licitación guardada como "Presentada"'}
              </span>
            </div>
          )}

          {!cargando && visibles.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {visibles.map((l, i) => {
                const estado = guardadas[l.expediente]
                const estilos = estado ? (ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.Nueva) : null
                return (
                  <motion.div
                    key={l.expediente || `${l.titulo}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 380 }}
                  >
                    <LicitacionCard licitacion={l} onClick={() => setSeleccionada(l)} />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                      {estado ? (
                        <>
                          <BookmarkCheck size={16} color="var(--verde)" style={{ flexShrink: 0 }} />
                          <select
                            value={estado}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => cambiarEstado(l.expediente, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--r-md)',
                              border: `1px solid ${estilos.border}`,
                              background: estilos.bg,
                              color: estilos.color,
                              fontSize: 12,
                              fontWeight: 700,
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="Nueva">Nueva</option>
                            <option value="Estudiando">Estudiando</option>
                            <option value="Presentada">Presentada</option>
                          </select>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); guardar(l.expediente) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px',
                            borderRadius: 'var(--r-md)',
                            border: '1px solid var(--n100)',
                            background: '#fff',
                            color: 'var(--n500)',
                            fontSize: 12, fontWeight: 700,
                            fontFamily: 'var(--font-body)',
                            transition: 'all var(--transition)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--g200)'
                            e.currentTarget.style.color = 'var(--verde)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--n100)'
                            e.currentTarget.style.color = 'var(--n500)'
                          }}
                        >
                          <Bookmark size={14} />
                          Guardar
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {seleccionada && (
          <LicitacionModal licitacion={seleccionada} onCerrar={() => setSeleccionada(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
