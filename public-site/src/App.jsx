import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MapView from './pages/MapView.jsx'
import Listings from './pages/Listings.jsx'
import MyList from './pages/MyList.jsx'
import Picks from './pages/Picks.jsx'
import Owners from './pages/Owners.jsx'

export default function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/' || location.pathname === '/owners'

  return (
    <>
      {!isLanding && <NavBar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/picks" element={<Picks />} />
        <Route path="/owners" element={<Owners />} />
      </Routes>
    </>
  )
}
