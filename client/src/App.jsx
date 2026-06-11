import { HashRouter, Routes, Route } from 'react-router-dom'
import LicitacionesPublicas from './pages/LicitacionesPublicas.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MisLicitaciones from './pages/MisLicitaciones.jsx'
import Preferencias from './pages/Preferencias.jsx'
import './styles/global.css'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LicitacionesPublicas />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/licitaciones" element={<MisLicitaciones />} />
        <Route path="/dashboard/preferencias" element={<Preferencias />} />
      </Routes>
    </HashRouter>
  )
}
