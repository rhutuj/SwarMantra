import { Route, Routes, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import RaagPage from './pages/RaagPage'
import SargamPage from './pages/SargamPage'
import BandishPage from './pages/BandishPage'
import TaanPage from './pages/TaanPage'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/raag/:raagId" element={<RaagPage />} />
        <Route path="/sargam/:sargamId" element={<SargamPage />} />
        <Route path="/bandish/:bandishId" element={<BandishPage />} />
        <Route path="/taan/:taanId" element={<TaanPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
