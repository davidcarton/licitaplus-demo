import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Bookmark, Send } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import Topbar from '../components/dashboard/Topbar.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import TablaUrgentes from '../components/dashboard/TablaUrgentes.jsx'
import { diasRestantes } from '../utils/format.js'

const EMPRESA = 'Constructora García'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [total, setTotal] = useState(0)
  const [urgentes, setUrgentes] = useState([])
  const [estados, setEstados] = useState({})

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Dashboard'

    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => {
        setTotal(data.total || 0)
        const lic = data.licitaciones || []
        const proximas = lic
          .filter(l => {
            const d = diasRestantes(l.fechaLimite)
            return d !== null && d >= 0 && d <= 7
          })
          .slice(0, 5)
        setUrgentes(proximas)

        const estadosMock = ['Nueva', 'Estudiando', 'Nueva', 'Presentada', 'Estudiando']
        const inicial = {}
        proximas.forEach((l, i) => { inicial[l.expediente] = estadosMock[i % estadosMock.length] })
        setEstados(inicial)
      })
      .catch(() => {})

    return () => { document.title = tituloPrevio }
  }, [])

  const marcarPresentada = (expediente) => {
    setEstados(prev => ({ ...prev, [expediente]: 'Presentada' }))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gris-fondo)' }}>
      <Sidebar />

      <div className="dash-content" style={{ marginLeft: 180, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Inicio" />

        <main style={{ padding: '28px clamp(1rem, 3vw, 2.5rem)', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--negro)',
              margin: 0,
            }}
          >
            {EMPRESA} <span style={{ color: 'var(--n400)', fontWeight: 600 }}>· {fechaLarga()}</span>
          </motion.h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginTop: 24,
          }}>
            <KPICard
              icon={Building2}
              value={total}
              label="licitaciones de obra en plazo ahora mismo"
              onClick={() => navigate('/')}
            />
            <KPICard
              icon={Bookmark}
              value="7"
              label="licitaciones guardadas por tu empresa"
              onClick={() => navigate('/dashboard/licitaciones')}
            />
            <KPICard
              icon={Send}
              value="4"
              label="ofertas enviadas este mes"
              onClick={() => navigate('/dashboard/licitaciones')}
            />
          </div>

          <section style={{ marginTop: 36 }}>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
              color: 'var(--negro)', margin: 0,
            }}>
              Atención requerida
            </h3>
            <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4, marginBottom: 16 }}>
              Licitaciones guardadas con plazo próximo
            </p>
            <TablaUrgentes items={urgentes} estados={estados} onMarcarPresentada={marcarPresentada} />
          </section>
        </main>
      </div>
    </div>
  )
}
