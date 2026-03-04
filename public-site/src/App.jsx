import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MapView from './pages/MapView.jsx'
import Listings from './pages/Listings.jsx'

export default function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <>
      {!isLanding && <NavBar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/listings" element={<Listings />} />
      </Routes>
    </>
  )
}
